package dev.thatpotato;

import com.carrotsearch.hppc.*;
import com.carrotsearch.hppc.sorting.IndirectSort;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import dev.thatpotato.util.DesignationUtil;
import dev.thatpotato.util.ObjType;
import org.apache.commons.text.similarity.LevenshteinDistance;
import org.jetbrains.annotations.Nullable;

import java.text.Normalizer;
import java.util.*;

public class AstroCatalog {
		static final Gson gson = new GsonBuilder()
					.setPrettyPrinting().disableHtmlEscaping()
					.create();
		static final String[] starTypes = new String[]{"*"};
		static final LevenshteinDistance levenshtein = LevenshteinDistance.getDefaultInstance();
		int currIndex = 0;
		// fields that all objs have, default in comment

		final ObjectArrayList<String[][]>
					// 0: types, 1: names, 2: cleanNames
					stringArrFields = new ObjectArrayList<>();
		final ObjectArrayList<String>
					morpho = new ObjectArrayList<>();// null
		DoubleArrayList
			tempVmag = new DoubleArrayList(),
			tempDimx = new DoubleArrayList(),
			tempDimy = new DoubleArrayList(),
			tempAngle = new DoubleArrayList(),
			tempPlx = new DoubleArrayList(),
			tempBv = new DoubleArrayList(),
			tempPm_ra = new DoubleArrayList(),
			tempPm_de = new DoubleArrayList();

		private final Map<String, String[]> typeHierarchyCache = new HashMap<>();
		final DoubleArrayList
					ra = new DoubleArrayList(),
					de = new DoubleArrayList();

    // Star row attributes layout: [vmag, plx, bv, pm_ra, pm_de] -> 24 bytes per star
		float[] starAttributes;
		// DSO row attributes layout: [vmag, bmag, dimx, dimy, angle] -> 20 bytes per DSO
		float[] dsoAttributes;

		int[] poolDataIndex;

		int starCounter = 0;
		int dsoCounter = 0;

		long[] nameIndex;
		boolean ready = false;


		public Object[] search(String q, @Nullable ObjectHashSet<String> filterTypes, int limit) {
				boolean isGenericCatalogPrefix = q.length() <= 3 && q.matches("[a-zA-Z]+");

				q = Normalizer.normalize(q, Normalizer.Form.NFD)
							.replaceAll("\\p{M}", "")
							.toLowerCase()
							.trim();

				int firstMatchIdx = this.findFirstIndex(q, false);
				if (firstMatchIdx == -1) return new Object[0];

				final String queryStr = q;
				var mq = isGenericCatalogPrefix ? null : new PriorityQueue<SearchMatch>(limit,
							(a, b) -> Integer.compare(b.distance, a.distance)
				);
				var fastResults = isGenericCatalogPrefix ? new ArrayList<JsonObject>(limit) : null;

				for (int i = firstMatchIdx; i < nameIndex.length; i++) {
						long packed = nameIndex[i];
						int objI = (int) (packed >>> 32);
						int aliasI = (int) (packed & 0xFFFFFFFFL);
						String[][] matrix = this.stringArrFields.get(objI);
						String s = matrix[2][aliasI];

						if (!s.regionMatches(true, 0, queryStr, 0, queryStr.length())) break;
						if (isGenericCatalogPrefix) {
								if (s.isEmpty() || !Character.isUpperCase(s.charAt(0)))
										continue;
						}
						if (filterTypes != null) {
								boolean matchesTypes = false;
								String[] objTypes = matrix[0];
								if (objTypes == null) {
										if (filterTypes.contains("*")) matchesTypes = true;
								} else for (String t : objTypes) {
										if (!filterTypes.contains(t)) continue;
										matchesTypes = true;
										break;
								}
								if (!matchesTypes) continue;
						}
						if (isGenericCatalogPrefix) {
								fastResults.add(this.toJson(objI, null, matrix[1][aliasI]));
								if (fastResults.size() >= limit) return fastResults.toArray();
						} else {
								int dist = levenshtein.apply(s.toLowerCase(), queryStr);
								//noinspection DataFlowIssue
								if (mq.size() >= limit && dist >= mq.peek().distance) continue;

								mq.offer(new SearchMatch(objI, dist, matrix[1][aliasI]));
								if (mq.size() > limit) mq.poll();
						}
				}
				if (isGenericCatalogPrefix) return fastResults.toArray();

				var finalJsonArray = new JsonObject[mq.size()];
				int idx = mq.size() - 1;
				while (!mq.isEmpty()) {
						SearchMatch sm = mq.poll();
						finalJsonArray[idx--] = this.toJson(sm.index, sm.distance, sm.match);
				}
				return finalJsonArray;
		}

		private int findFirstIndex(String q, boolean strictEquals) {
				int low = 0;
				int high = nameIndex.length - 1;
				int resultIdx = -1;

				while (low <= high) {
						int mid = (low + high) >>> 1;
						long packed = nameIndex[mid];
						int objI = (int) (packed >>> 32);
						int aliasI = (int) (packed & 0xFFFFFFFFL);

						String currentCleanName = this.stringArrFields.get(objI)[2][aliasI];
						boolean isMatch = strictEquals
									? currentCleanName.equalsIgnoreCase(q)
									: currentCleanName.regionMatches(true, 0, q, 0, q.length());
						if (isMatch) {
								resultIdx = mid;
								high = mid - 1;
						} else if (currentCleanName.compareToIgnoreCase(q) < 0)
								low = mid + 1;
						else high = mid - 1;
				}
				return resultIdx;
		}


		public void freezeAndPackCatalog() {
				starAttributes = new float[starCounter * 5];
				dsoAttributes = new float[dsoCounter * 4];
				poolDataIndex = new int[currIndex];

				int sIdx = 0, dIdx = 0;

				for (int i = 0; i < currIndex; i++) {
						if (this.stringArrFields.get(i)[0] == null) {
								poolDataIndex[i] = sIdx / 5;
								starAttributes[sIdx++] = (float) tempVmag.get(i);
								starAttributes[sIdx++] = (float) tempPlx.get(i);
								starAttributes[sIdx++] = (float) tempBv.get(i);
								starAttributes[sIdx++] = (float) tempPm_ra.get(i);
								starAttributes[sIdx++] = (float) tempPm_de.get(i);
						} else {
								poolDataIndex[i] = dIdx / 4;
								dsoAttributes[dIdx++] = (float) tempVmag.get(i);
								dsoAttributes[dIdx++] = (float) tempDimx.get(i);
								dsoAttributes[dIdx++] = (float) tempDimy.get(i);
								dsoAttributes[dIdx++] = (float) tempAngle.get(i);
						}
				}
				tempVmag = tempDimx = tempDimy = tempAngle = tempPlx = tempBv = null;
				this.stringArrFields.trimToSize();
				this.morpho.trimToSize();
				System.gc();
		}

		public void compileIndex() {
				IO.println("Starting to compile index");
				int totalNamesCount = 0;
				for (int i = 0; i < currIndex; i++) {
						totalNamesCount += stringArrFields.get(i)[2].length;
				}
				nameIndex = new long[totalNamesCount];
				int ptr = 0;

				for (int i = 0; i < currIndex; i++) {
						for (int i1 = 0; i1 < this.stringArrFields.get(i)[2].length; i1++) {
								nameIndex[ptr++] = ((long) i << 32) | (i1 & 0xFFFFFFFFL);
						}
				}
				int[] permutation = IndirectSort.mergesort(
							0, nameIndex.length,
							(a, b) -> {
									long packedA = nameIndex[a];
									long packedB = nameIndex[b];
									int objA = (int) (packedA >>> 32);
									int aliasA = (int) (packedA & 0xFFFFFFFFL);
									int objB = (int) (packedB >>> 32);
									int aliasB = (int) (packedB & 0xFFFFFFFFL);
									return this.stringArrFields.get(objA)[2][aliasA]
												.compareToIgnoreCase(this.stringArrFields.get(objB)[2][aliasB]);
							}
				);
				long[] sortedNameIndex = new long[nameIndex.length];
				for (int i = 0; i < nameIndex.length; i++) {
						sortedNameIndex[i] = nameIndex[permutation[i]];
				}
				this.nameIndex = sortedNameIndex;
				this.ready = true;
				IO.println("Binary Search Index successfully compiled with " + nameIndex.length + " pointer records.");
		}

		private record SearchMatch(int index, int distance, String match) {}


		public JsonObject toJson(int i) {
			 return this.toJson(i,null,null);
		}
		public JsonObject toJson(int i, @Nullable Integer distance, @Nullable String match) {
				var obj = new JsonObject();
				if (i == -1) return obj;
				var stringArrFields = this.stringArrFields.get(i);
				String[] types = stringArrFields[0];
				String[] names = stringArrFields[1];
				obj.addProperty("model", types == null ? "star" : "dso");
				obj.add("types", gson.toJsonTree(types == null ? starTypes : types));
				obj.add("names", gson.toJsonTree(names));
				var model = new JsonObject();
				{
						model.addProperty("ra", this.ra.get(i));
						model.addProperty("de", this.de.get(i));
						int localIdx = this.poolDataIndex[i];
						if (types == null) {
								double vmag = starAttributes[localIdx * 5],
											plx =   starAttributes[localIdx * 5 + 1],
											bv =    starAttributes[localIdx * 5 + 2],
											pm_ra =    starAttributes[localIdx * 5 + 3],
											pm_de =    starAttributes[localIdx * 5 + 4];
								if (plx  != -1)    model.addProperty("plx", plx);
								if (bv   != -1000) model.addProperty("bv", bv);
								if (vmag != -1000) model.addProperty("Vmag", vmag);
								if (!Double.isNaN(pm_ra)) model.addProperty("pm_ra", pm_ra);
								if (!Double.isNaN(pm_de)) model.addProperty("pm_de", pm_de);
						} else {
								double vmag = dsoAttributes[localIdx * 4],
											dimx =  dsoAttributes[localIdx * 4 + 1],
											dimy =  dsoAttributes[localIdx * 4 + 2],
											angle = dsoAttributes[localIdx * 4 + 3];
								String morpho = this.morpho.get(i);
								if (vmag != -1000) model.addProperty("Vmag", vmag);
								if (dimx != -1) model.addProperty("dimx", dimx);
								if (dimy != -1) model.addProperty("dimy", dimy);
								if (angle != -1000) model.addProperty("angle", angle);
								if (morpho != null) model.addProperty("morpho", morpho);
						}
				}
				obj.add("model_data", model);
				if (distance != null) obj.addProperty("distance", distance);
				if (match != null) obj.addProperty("match", match);
				return obj;
		}

		public int find(String q) {
				int matchIdx = this.findFirstIndex(q, true);
				if (matchIdx == -1) return -1;
				return (int) (nameIndex[matchIdx] >>> 32);
		}

		private String cleanName(String name) {
				return Normalizer.normalize(
							DesignationUtil.designationCleanup(name, 26), Normalizer.Form.NFD
				).replaceAll("\\p{M}", "");
		}

		public void addStar(
					String[] names,
					double ra, double de,
					double plx, double bv,
					double vmag,
					double pm_ra, double pm_de
		) {
				currIndex++;

				var cleanNames = new String[names.length];
				for (int i = 0; i < names.length; i++) {
						cleanNames[i] = this.cleanName(names[i]);
				}

				var matrix = new String[3][];
				matrix[0] = null;
				matrix[1] = names;
				matrix[2] = cleanNames;
				this.stringArrFields.add(matrix);

				this.ra.add(ra);
				this.de.add(de);
				this.tempPlx.add(plx);
				this.tempBv.add(bv);
				this.tempVmag.add(vmag);
				this.tempPm_ra.add(pm_ra);
				this.tempPm_de.add(pm_de);

				this.tempDimx.add(-1);
				this.tempDimy.add(-1);
				this.tempAngle.add(-1000);
				this.morpho.add((String) null);

				starCounter++;
		}

		public void addDso(
					String type, String[] names,
					double ra, double de,
					double dimy, double dimx,
					double angle, String morpho,
					double vmag
		) {
				currIndex++;
				String[] types;
				{
						types = typeHierarchyCache.get(type);

						if (types == null) {
								var types0 = new ArrayList<String>();
								types0.add(type);
								var t = ObjType.PARENTS.get(type);
								while (t != null) {
										types0.add(t);
										t = ObjType.PARENTS.get(t);
								}
								types = types0.toArray(String[]::new);
								typeHierarchyCache.put(type, types);
						}
				}

				var cleanNames = new String[names.length];
				for (int i = 0; i < names.length; i++) {
						cleanNames[i] = this.cleanName(names[i]);
				}

				var matrix = new String[3][];
				matrix[0] = types;
				matrix[1] = names;
				matrix[2] = cleanNames;
				this.stringArrFields.add(matrix);

				this.ra.add(ra);
				this.de.add(de);
				this.tempDimy.add(dimy);
				this.tempDimx.add(dimx);
				this.tempAngle.add(angle);
				this.morpho.add(morpho.isBlank() ? null : morpho);
				this.tempVmag.add(vmag);

				this.tempPlx.add(-1);
				this.tempBv.add(-1000);

				dsoCounter++;
		}
}
