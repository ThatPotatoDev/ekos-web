const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const zlib = require("zlib");
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const DSO_MAX_MAG = 14;
const STAR_MAX_MAG = 10.75; // extended survey's max is 11.5

const DD2R = 1.745329251994329576923691e-2;
const DR2D = 57.29577951308232087679815;

const ERFA_DAS2R = 4.848136811095359935899141e-6;
const ERFA_DMAS2R = ERFA_DAS2R / 1e3;
const DR2MAS = 1.0 / ERFA_DMAS2R;

const units = Object.freeze({
  EPH_RAD: 1 << 16,
  EPH_DEG: (1 << 16) | 1,    // Degree
  EPH_ARCMIN: ((1 << 16) | 1) | 2,    // (1/60)
  EPH_ARCSEC: (((1 << 16) | 1) | 2) | 4, // (1/60)
  EPH_VMAG: 3 << 16,
  EPH_RAD_PER_YEAR: 6 << 16,
  EPH_YEAR: 7 << 16,
  EPH_KM_PER_SEC: 8 << 16,
  // Legacy unit still used in gaia survey.
  EPH_ARCSEC_: 5 << 16 | 1 | 2 | 4,
});

function walk(dir) {
  const files = [];

  for (const entry of fsSync.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.name.endsWith(".eph")) {
      files.push(full);
    }
  }
  return files;
}

function parseEph(buffer) {
  if (buffer.slice(0, 4).toString("ascii") !== "EPHE") {
    throw new Error("Invalid EPHE");
  }
  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`Unsupported EPHE version ${version}`);
  }
  let offset = 8;
  const chunks = [];
  while (offset < buffer.length) {
    const type = buffer.slice(offset, offset + 4).toString("ascii");
    offset += 4;
    const len = buffer.readUInt32LE(offset);
    offset += 4;
    const data = buffer.subarray(offset, offset + len)
    offset += len;
    const crc = buffer.readUInt32LE(offset);
    offset += 4;
    chunks.push({ type, data, crc });
  }

  return chunks;
}

function readTileHeader(buffer, offset) {
  return {
    version: buffer.readUInt32LE(offset),
    offset: offset + 12
  };
}

function readTableHeader(buffer, offset) {
  const flags = buffer.readUInt32LE(offset);
  const rowSize = buffer.readUInt32LE(offset + 4);
  const columnCount = buffer.readUInt32LE(offset + 8);
  const rowCount = buffer.readUInt32LE(offset + 12);

  offset += 16;

  const columns = [];

  for (let i = 0; i < columnCount; i++) {
    let unit = buffer.readUInt32LE(offset + 8);
    if (unit === units.EPH_ARCSEC_) unit = units.EPH_ARCSEC;
    columns.push({
      name: buffer
        .slice(offset, offset + 4)
        .toString("ascii")
        .replace(/\0/g, "")
        .trim(),
      type: buffer
        .slice(offset + 4, offset + 8)
        .toString("ascii")
        .replace(/\0/g, "")
        .trim(),
      unit: unit,
      start: buffer.readUInt32LE(offset + 12),
      size: buffer.readUInt32LE(offset + 16)
    });
    offset += 20;
  }
  return {
    flags,
    rowSize,
    rowCount,
    columns,
    offset
  };
}

function readCompressedBlock(buffer, offset) {
  const uncompressedSize = buffer.readUInt32LE(offset);
  const compressedSize = buffer.readUInt32LE(offset + 4);

  const compressed =
    buffer.slice(offset + 8, offset + 8 + compressedSize);
  const data = zlib.inflateSync(compressed);

  if (data.length !== uncompressedSize) {
    console.warn(
      "Size mismatch",
      data.length,
      uncompressedSize
    );
  }
  return data;
}

function unshuffle(buffer, rowSize, rowCount) {
  const dst = Buffer.alloc(buffer.length);
  for (let j = 0; j < rowSize; j++) {
    for (let i = 0; i < rowCount; i++) {
      dst[i * rowSize + j] =
        buffer[j * rowCount + i];
    }
  }
  return dst;
}

function column(columns, name) {
  return columns.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
}

function convertUnit(srcUnit, dstUnit, v, name) {
  if (!dstUnit || srcUnit === dstUnit) return v;
  if ((srcUnit >> 16) !== (dstUnit >> 16))
    throw new Error(`Unit family mismatch ${srcUnit} -> ${dstUnit}`);
  // 1 -> deg to rad
  if ((srcUnit & 1) && !(dstUnit & 1)) v *= DD2R;
  if (!(srcUnit & 1) && (dstUnit & 1)) v *= DR2D;
  // 2 -> 1/60
  if ((srcUnit & 2) && !(dstUnit & 2)) v /= 60;
  if (!(srcUnit & 2) && (dstUnit & 2)) v *= 60;
  // 4 -> 1/60
  if ((srcUnit & 4) && !(dstUnit & 4)) v /= 60;
  if (!(srcUnit & 4) && (dstUnit & 4)) v *= 60;
  // 8 -> 365.25
  if ((srcUnit & 8) && !(dstUnit & 8)) v *= 365.25;
  if (!(srcUnit & 8) && (dstUnit & 8)) v /= 365.25;
  return v;
}

function readFloat(row, col, def = undefined, unit = 0) {
  if (!col)
    return def;

  let v;

  if (col.size === 4)
    v = row.readFloatLE(col.start);
  else if (col.size === 8)
    v = row.readDoubleLE(col.start);
  else
    return def;
  if (Number.isNaN(v)) return def;

  return convertUnit(col.unit, unit, v, col.name);
}


function readInt(row, col, def = undefined) {
  if (!col) {
    return def;
  }
  const v = row.readInt32LE(col.start);
  return Number.isNaN(v) ? def : v;
}

function readUInt64(row, col, def = undefined) {
  if (!col)
    return def;
  return row.readBigUInt64LE(col.start);
}


function readString(row, col, def = "") {
  if (!col)
    return def;

  return row
    .slice(col.start, col.start + col.size)
    .toString("utf8")
    .replace(/\0+$/, "");
}


// ---------------- STARS ----------------

function colMap(columns, keys) {
  const ret = {};
  for (let i = 0; i < keys.length; i++) {
    ret[keys[i]] = column(columns, keys[i]);
  }
  return ret;
}

function parseStarChunk(data) {

  let offset = 0;

  const tile = readTileHeader(data, offset);
  offset = tile.offset;

  const table = readTableHeader(data, offset);
  offset = table.offset;

  let tableData = readCompressedBlock(data, offset);

  if (table.flags & 1) {
    tableData =
      unshuffle(
        tableData,
        table.rowSize,
        table.rowCount
      );
  }

  // console.log(table.columns)

  const cols = colMap(table.columns, [
    "ra", "de",
    "pra", "pde",
    // "hip", "hd", "gaia",
    "ids", "spec",
    "plx", "bv",
    "vmag", "gmag"
  ]);

  const stars = [];
  for (let i = 0; i < table.rowCount; i++) {
    const row =
      tableData.subarray(
        i * table.rowSize,
        (i + 1) * table.rowSize
      );

    let vmag = readFloat(row, cols["vmag"], undefined, units.EPH_VMAG);
    if (vmag === undefined) vmag = readFloat(row, cols["gmag"], undefined, units.EPH_VMAG);

    if (vmag !== undefined
      && vmag > STAR_MAX_MAG
    ) continue;


    // let hd = readInt(row, cols["hd"], undefined);
    // let hip = readInt(row, cols["hip"], undefined);
    // let gaia = readUInt64(row, cols["gaia"], undefined);
    // if (gaia === 0n) gaia = undefined;

    let names =
      readString(row, cols["ids"])
        .split("|").filter(Boolean);
    if (names.length === 0) 
      continue;
    const plx = readFloat(row, cols["plx"], undefined, units.EPH_ARCSEC);
    const pra = readFloat(row, cols["pra"], undefined, units.EPH_RAD_PER_YEAR);
    const pde = readFloat(row, cols["pde"], undefined, units.EPH_RAD_PER_YEAR);

    stars.push({
      model: "star",
      names,
      Vmag: Number.isNaN(vmag) ? undefined : vmag,
      spec: readString(row, cols["spec"], undefined),
      pm_ra: pra !== undefined ? pra * DR2MAS : undefined,
      pm_de: pde !== undefined ? pde * DR2MAS : undefined,
      ra: readFloat(row, cols["ra"], 0, units.EPH_DEG),
      de: readFloat(row, cols["de"], 0, units.EPH_DEG),
      plx: plx !== undefined ? plx * 1000 : undefined,
      bv: readFloat(row, cols["bv"], undefined),
    });
  }
  return stars;
}

// ---------------- DSO ----------------

function parseDsoChunk(data) {

  let offset = 0;

  const tile = readTileHeader(data, offset);
  offset = tile.offset;

  const table = readTableHeader(data, offset);
  offset = table.offset;

  let tableData = readCompressedBlock(data, offset);

  if (table.flags & 1) {
    tableData =
      unshuffle(
        tableData,
        table.rowSize,
        table.rowCount
      );
  }

  const cols = colMap(table.columns, [
    "type", "ids",
    "ra", "de",
    "smin", "smax",
    "angl", "morp",
    "vmag", "bmag",
    "snam"
  ]);

  const dsos = [];

  for (let i = 0; i < table.rowCount; i++) {

    const row =
      tableData.subarray(
        i * table.rowSize,
        (i + 1) * table.rowSize
      );

    let vmag = readFloat(row, cols["vmag"], undefined, units.EPH_VMAG);
    if (vmag === undefined) vmag = readFloat(row, cols["bmag"], undefined, units.EPH_VMAG);

    if (vmag !== undefined
      && vmag > DSO_MAX_MAG
    ) continue;

    const names = readString(row, cols["ids"])
      .split("|").filter(Boolean);
    const snam = readString(row, cols["snam"]);
    if (snam && !names.includes(snam)) names.push(snam);

    const type = readString(row, cols["type"]);
    const smin = readFloat(row, cols["smin"], undefined, units.EPH_RAD);
    const smax = readFloat(row, cols["smax"], undefined, units.EPH_RAD);

    const obj = {
      model: "dso",
      type: type ?? "?",
      names: names, 

      ra: readFloat(row, cols["ra"], 0, units.EPH_DEG),
      de: readFloat(row, cols["de"], 0, units.EPH_DEG),
      dimx: smax !== undefined ? (smax * DR2D * 60) : -1,
      dimy: smin !== undefined ? (smin * DR2D * 60) : -1,
      angle: readFloat(row, cols["angl"], -1000, units.EPH_RAD) * DR2D,
      Vmag: Number.isNaN(vmag) ? undefined : vmag,
      morpho: readString(row, cols["morp"], "")
    };
    dsos.push(obj);
  }
  return dsos;
}

// ---------------- FILE ----------------

async function buildCatalog(root) {
  const files = [
    ...walk(root),
  ];

  console.log(`Found ${files.length} eph files`);
  let currFile = 0;
  const results = await Promise.all(
    files.map(async (entry) => {
      try {
        const buffer = await fs.readFile(entry);
        const chunks = parseEph(buffer);

        const items = [];

        for (const chunk of chunks) {
          switch (chunk.type) {
            case "STAR":
            case "GAIA":
              items.push(...parseStarChunk(chunk.data));
              break;
            case "DSO ":
              //TODO: recompile query server and uncomment this
              // items.push(...parseDsoChunk(chunk.data));
              break;
          }
        }
        currFile++;
        if (currFile % 1000 === 0) console.log("Current file", currFile);
        return items;
      } catch (e) {
        console.error("Failed", entry, e.message);
        return [];
      }
    })
  );
  return results.flat();
}

async function exportToJsonlGz(dataArray, outputPath) {
  const sourceStream = Readable.from(dataArray);

  const jsonlTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      callback(null, JSON.stringify(chunk) + '\n');
    }
  });

  const gzipStream = zlib.createGzip();
  const destinationStream = fsSync.createWriteStream(outputPath);

  try {
    await pipeline(sourceStream, jsonlTransform, gzipStream, destinationStream);
  } catch (error) {
    console.error('Export failed:', error);
  }
}

const root = process.argv[2];
const output = process.argv[3] || "catalog.jsonl.gz";

if (!root) {
  console.error(
    "Usage: node genObjects.js <root>"
  );
  process.exit(1);
}

async function run() {
  let start = new Date();
  const catalog = await buildCatalog(root);
  let time = (new Date() - start) / 1000;
  console.log(`Generated ${output} in ${time}s`);
  console.log(`${catalog.length} objects`)
  console.log(catalog.find(o => o.names.includes("NAME Arcturus")));
  start = new Date();
  await exportToJsonlGz(catalog, output);
  time = (new Date() - start) / 1000;
  console.log(
    `Wrote ${output} in ${time}s`
  );
}

run();