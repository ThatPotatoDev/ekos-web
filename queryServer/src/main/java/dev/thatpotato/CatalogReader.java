package dev.thatpotato;

import com.carrotsearch.hppc.ObjectArrayList;
import com.google.gson.Strictness;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;

public class CatalogReader {
		public static void read(File file, AstroCatalog outCatalog) {
				IO.println("Reading "+file.getAbsolutePath());
				try (var fis = new FileInputStream(file);
				     var bis = new BufferedInputStream(fis, 65536);
				     var gzis = new GZIPInputStream(bis);
				     var isr = new InputStreamReader(gzis, StandardCharsets.UTF_8);
				     var reader = new JsonReader(isr)) {

						reader.setStrictness(Strictness.LENIENT);

						while (reader.peek() != JsonToken.END_DOCUMENT) {
								readObj(reader, outCatalog);
						}
				} catch (FileNotFoundException e) {
						System.err.println(file + " file not found");
				} catch (IOException e) {
						System.err.println("Failed to read file: " + e.getMessage());
				}
		}
		private static void readObj(JsonReader reader, AstroCatalog catalog) throws IOException {
				reader.beginObject();
				String type = null;
				String[] names = null;
				String model = null, morpho = null;
				double ra = 0, de = 0, plx = -1,
							bv = -1000,
							pm_ra = Double.NaN,
							pm_de = Double.NaN,
							vmag = -1000,
							dimy = -1, dimx = -1,
							angle = -1000;
				while (reader.hasNext()) {
						switch (reader.nextName()) {
								case "model" -> model = reader.nextString();
								case "type" -> type = reader.nextString();
								case "names" -> names = readStringArray(reader).toArray(String.class);
								case "ra" -> ra = reader.nextDouble();
								case "de" -> de = reader.nextDouble();
								case "Vmag" -> vmag = reader.nextDouble();
								case "plx" -> plx = reader.nextDouble();
								case "bv" -> bv = reader.nextDouble();
								case "pm_ra" -> pm_ra = reader.nextDouble();
								case "pm_de" -> pm_de = reader.nextDouble();
								case "dimy" -> dimy = reader.nextDouble();
								case "dimx" -> dimx = reader.nextDouble();
								case "angle" -> angle = reader.nextDouble();
								case "morpho" -> morpho = reader.nextString();
								default -> reader.skipValue();
						}
				}
				switch (model) {
						case null -> // won't cause problems, nameless objs are removed via genObjects.js
								  //noinspection DataFlowIssue
									catalog.addStar(names, ra, de, plx, bv, vmag, pm_ra, pm_de);
						case "dso" -> catalog.addDso(type, names, ra, de, dimy, dimx, angle, morpho, vmag);

						default -> IO.println("unknown model: "+model);
				}
				reader.endObject();
		}

		public static ObjectArrayList<String> readStringArray(JsonReader reader) throws IOException {
				var strings = new ObjectArrayList<String>();
				reader.beginArray();
				while (reader.hasNext()) {
						strings.add(reader.nextString());
				}
				reader.endArray();
				return strings;
		}
}
