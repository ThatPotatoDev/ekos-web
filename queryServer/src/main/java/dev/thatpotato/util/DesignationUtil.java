package dev.thatpotato.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DesignationUtil {

		public static final int BAYER_LATIN_SHORT = 1;
		public static final int BAYER_LATIN_LONG  = 1 << 1;
		public static final int BAYER_CONST_SHORT = 1 << 2;
		public static final int BAYER_CONST_LONG  = 1 << 3;
		public static final int DSGN_TRANSLATE    = 1 << 4;
		public static final int DSGN_EXPAND_CAT   = 1 << 5;

		private static final String[][] GREEK = {
					{"α", "alf", "Alf", "Alpha"},
					{"β", "bet", "Bet", "Beta"},
					{"γ", "gam", "Gam", "Gamma"},
					{"δ", "del", "Del", "Delta"},
					{"ε", "eps", "Eps", "Epsilon"},
					{"ζ", "zet", "Zet", "Zeta"},
					{"η", "eta", "Eta", "Eta"},
					{"θ", "tet", "Tet", "Theta"},
					{"ι", "iot", "Iot", "Iota"},
					{"κ", "kap", "Kap", "Kappa"},
					{"λ", "lam", "Lam", "Lambda"},
					{"μ", "mu" , "Mu" , "Mu"},
					{"ν", "nu" , "Nu" , "Nu"},
					{"ξ", "xi" , "Xi" , "Xi"},
					{"ξ", "ksi", "Xi" , "Xi"},
					{"ο", "omi", "Omi", "Omicron"},
					{"π", "pi" , "Pi" , "Pi"},
					{"ρ", "rho", "Rho", "Rho"},
					{"σ", "sig", "Sig", "Sigma"},
					{"τ", "tau", "Tau", "Tau"},
					{"υ", "ups", "Ups", "Upsilon"},
					{"φ", "phi", "Phi", "Phi"},
					{"χ", "chi", "Chi", "Chi"},
					{"ψ", "psi", "Psi", "Psi"},
					{"ω", "ome", "Ome", "Omega"}
		};

		private static final String[][] CSTS = {
					{"And", "Andromedae"},
					{"Ant", "Antliae"},
					{"Aps", "Apodis"},
					{"Aqr", "Aquarii"},
					{"Aql", "Aquilae"},
					{"Ara", "Arae"},
					{"Ari", "Arietis"},
					{"Aur", "Aurigae"},
					{"Boo", "Boötis"},
					{"Cae", "Caeli"},
					{"Cam", "Camelopardalis"},
					{"Cnc", "Cancri"},
					{"CVn", "Canum Venaticorum"},
					{"CMa", "Canis Majoris"},
					{"CMi", "Canis Minoris"},
					{"Cap", "Capricorni"},
					{"Car", "Carinae"},
					{"Cas", "Cassiopeiae"},
					{"Cen", "Centauri"},
					{"Cep", "Cephei"},
					{"Cet", "Ceti"},
					{"Cha", "Chamaeleontis"},
					{"Cir", "Circini"},
					{"Col", "Columbae"},
					{"Com", "Comae Berenices"},
					{"CrA", "Coronae Australis"},
					{"CrB", "Coronae Borealis"},
					{"Crv", "Corvi"},
					{"Crt", "Crateris"},
					{"Cru", "Crucis"},
					{"Cyg", "Cygni"},
					{"Del", "Delphini"},
					{"Dor", "Doradus"},
					{"Dra", "Draconis"},
					{"Equ", "Equulei"},
					{"Eri", "Eridani"},
					{"For", "Fornacis"},
					{"Gem", "Geminorum"},
					{"Gru", "Gruis"},
					{"Her", "Herculis"},
					{"Hor", "Horologii"},
					{"Hya", "Hydrae"},
					{"Hyi", "Hydri"},
					{"Ind", "Indi"},
					{"Lac", "Lacertae"},
					{"Leo", "Leonis"},
					{"LMi", "Leonis Minoris"},
					{"Lep", "Leporis"},
					{"Lib", "Librae"},
					{"Lup", "Lupi"},
					{"Lyn", "Lyncis"},
					{"Lyr", "Lyrae"},
					{"Men", "Mensae"},
					{"Mic", "Microscopii"},
					{"Mon", "Monocerotis"},
					{"Mus", "Muscae"},
					{"Nor", "Normae"},
					{"Oct", "Octantis"},
					{"Oph", "Ophiuchi"},
					{"Ori", "Orionis"},
					{"Pav", "Pavonis"},
					{"Peg", "Pegasi"},
					{"Per", "Persei"},
					{"Phe", "Phoenicis"},
					{"Pic", "Pictoris"},
					{"Psc", "Piscium"},
					{"PsA", "Piscis Austrini"},
					{"Pup", "Puppis"},
					{"Pyx", "Pyxidis"},
					{"Ret", "Reticuli"},
					{"Sge", "Sagittae"},
					{"Sgr", "Sagittarii"},
					{"Sco", "Scorpii"},
					{"Scl", "Sculptoris"},
					{"Sct", "Scuti"},
					{"Ser", "Serpentis"},
					{"Sex", "Sextantis"},
					{"Tau", "Tauri"},
					{"Tel", "Telescopii"},
					{"Tri", "Trianguli"},
					{"TrA", "Trianguli Australis"},
					{"Tuc", "Tucanae"},
					{"UMa", "Ursae Majoris"},
					{"UMi", "Ursae Minoris"},
					{"Vel", "Velorum"},
					{"Vir", "Virginis"},
					{"Vol", "Volantis"},
					{"Vul", "Vulpeculae"}
		};

		private record BayerInfo(
					int constellation,
					int bayer,
					int exponent,
					String suffix) {}

		private record FlamsteedInfo(
					int constellation,
					int number,
					String suffix) {}

		private record VariableInfo(
					int constellation,
					String variable,
					String suffix) {}

		public static String designationCleanup(String dsgn, int flags) {
				BayerInfo bayer = parseBayer(dsgn);

				if (bayer != null) {
						String greek;
						if (bayer.bayer >= 'A' && bayer.bayer <= 'z') {
								greek = Character.toString((char) bayer.bayer);
						} else {
								String[] row = GREEK[bayer.bayer - 1];
								if ((flags & BAYER_LATIN_SHORT) != 0)
										greek = row[2];
								else if ((flags & BAYER_LATIN_LONG) != 0)
										greek = row[3];
								else greek = row[0];
						}

						String exponent =
									bayer.exponent == 0
												? ""
												: toSuperscript(bayer.exponent);

						if ((flags & (BAYER_CONST_SHORT | BAYER_CONST_LONG)) != 0) {
								String cst =
											(flags & BAYER_CONST_LONG) != 0
														? CSTS[bayer.constellation][1]
														: CSTS[bayer.constellation][0];

								return greek + exponent + " " + cst + bayer.suffix;
						}
						return greek + exponent + bayer.suffix;
				}

				FlamsteedInfo flam = parseFlamsteed(dsgn);

				if (flam != null) {
						if ((flags & (BAYER_CONST_SHORT | BAYER_CONST_LONG)) != 0) {
								String cst =
											(flags & BAYER_CONST_LONG) != 0
														? CSTS[flam.constellation][1]
														: CSTS[flam.constellation][0];
								return flam.number + " " + cst + flam.suffix;
						}
						return flam.number + flam.suffix;
				}

				VariableInfo var = parseVariableStar(dsgn);

				if (var != null) {
						if ((flags & (BAYER_CONST_SHORT | BAYER_CONST_LONG)) != 0) {
								String cst =
											(flags & BAYER_CONST_LONG) != 0
														? CSTS[var.constellation][1]
														: CSTS[var.constellation][0];
								return var.variable + " " + cst + var.suffix;
						}
						return var.variable + var.suffix;
				}

				if ((flags & DSGN_EXPAND_CAT) != 0) {
						if (dsgn.startsWith("M "))
								return "Messier " + dsgn.substring(2);
						if (dsgn.startsWith("C "))
								return "Caldwell " + dsgn.substring(2);
				}

				String[] remove = {
							"NAME ",
							"* ",
							"Cl ",
							"Cl* ",
							"** ",
							"MPC ",
							"LATIN "
				};

				for (String prefix : remove) {
						if (dsgn.startsWith(prefix)) {
								return dsgn.substring(prefix.length());
						}
				}
				return dsgn;
		}

		private static String toSuperscript(int value) {
				StringBuilder sb = new StringBuilder();
				for (char c : Integer.toString(value).toCharArray()) {
						sb.append(switch (c) {
								case '0' -> "⁰";
								case '1' -> "¹";
								case '2' -> "²";
								case '3' -> "³";
								case '4' -> "⁴";
								case '5' -> "⁵";
								case '6' -> "⁶";
								case '7' -> "⁷";
								case '8' -> "⁸";
								case '9' -> "⁹";
								default -> "";
						});
				}
				return sb.toString();
		}

		private static BayerInfo parseBayer(String dsgn) {
				String s;
				if (dsgn.startsWith("* "))
						s = dsgn.substring(2);
				else if (dsgn.startsWith("V* "))
						s = dsgn.substring(3);
				else return null;

				int bayer = 0;

				for (int i = 0; i < GREEK.length; i++) {
						String code = GREEK[i][1];
						if (s.regionMatches(true, 0, code, 0, code.length())) {
								bayer = i + 1;
								s = s.substring(code.length());
								break;
						}
				}

				if (bayer == 0) {
						char c = s.charAt(0);
						if (c == 'V') return null;
						if (Character.isLetter(c)) {
								bayer = c;
								s = s.substring(1);
						} else return null;
				}

				if (s.startsWith("."))
						s = s.substring(1);

				int exponent = 0;

				Matcher m = Pattern.compile("^(\\d+)").matcher(s);

				if (m.find()) {
						exponent = Integer.parseInt(m.group(1));
						s = s.substring(m.group(1).length());
				}
				s = s.stripLeading();

				for (int i = 0; i < CSTS.length; i++) {
						String shortName = CSTS[i][0];
						if (s.regionMatches(true, 0,
									shortName, 0, shortName.length())) {
								String suffix = s.substring(shortName.length());

								return new BayerInfo(i, bayer, exponent, suffix);
						}
				}
				return null;
		}

		private static FlamsteedInfo parseFlamsteed(String dsgn) {
				Matcher m =
							Pattern.compile(
													"^(?:\\* |V\\* )(\\d+)\\s+([A-Za-z]{3})(.*)$")
										.matcher(dsgn);
				if (!m.matches())
						return null;
				String cst = m.group(2);
				for (int i = 0; i < CSTS.length; i++) {
						if (CSTS[i][0].equalsIgnoreCase(cst)) {
								return new FlamsteedInfo(
											i,
											Integer.parseInt(m.group(1)),
											m.group(3));
						}
				}
				return null;
		}

		private static VariableInfo parseVariableStar(String dsgn) {
				Matcher m =
							Pattern.compile(
													"^V\\*\\s+([A-Z0-9]+)\\s+([A-Za-z]{3})(.*)$")
										.matcher(dsgn);

				if (!m.matches()) return null;

				String cst = m.group(2);

				for (int i = 0; i < CSTS.length; i++) {
						if (CSTS[i][0].equalsIgnoreCase(cst)) {
								return new VariableInfo(
											i,
											m.group(1),
											m.group(3));
						}
				}
				return null;
		}
}
