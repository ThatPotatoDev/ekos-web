function h2g(ra) {
  return ra > 12 ? (ra - 24) * 15 : ra * 15;
}

const hms = (dec) => {
  const H = dec / 15;
  if (H === null) return null;
  
  const h = Math.floor(H);
  const m = Math.floor(60 * (Math.abs(H) - h));
  const s = 60 * (60 * (Math.abs(H) - h) - m);
  
  return (
    h.toString() +
    "h " +
    m.toString() +
    "m " +
    s.toFixed(2) +
    (`s (${H.toFixed(3)}h)`)
  );
};

const hmsFromH = (decimalH) => {
  const h = Math.floor(decimalH);
  const decimalM = (decimalH - h) * 60;
  const m = Math.floor(decimalM);
  const s = ((decimalM - m) * 60).toFixed(2);

  return (`${h.toString()}h ${m.toString()}m ${s.toString()}s`);
};

const dms = (dec, extra = false) => {
  if (dec === null) return null;
  const negative = dec < 0.0 ? "-" : "+";

  const d = Math.floor(Math.abs(dec));
  const m = Math.floor(60 * (Math.abs(dec) - d));
  const s = Math.floor(60 * (60 * (Math.abs(dec) - d) - m));
  return (
    negative +
    d.toString() +
    "° " +
    m.toString() +
    "' " +
    s.toFixed(2) +
    (extra ? `" (${dec.toFixed(3)}°)` : "")
  );
};

export {
  h2g,
  hms,
  hmsFromH,
  dms,
};
