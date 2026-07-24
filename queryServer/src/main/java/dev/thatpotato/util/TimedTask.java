package dev.thatpotato.util;

import kotlin.Pair;

import java.util.function.Supplier;

public class TimedTask {
		public static long timed(Runnable runnable) {
				long start = System.currentTimeMillis();
				runnable.run();
				return System.currentTimeMillis() - start;
		}
		public static <T> Pair<Long, T> timed(Supplier<T> supplier) {
				long start = System.currentTimeMillis();
				T res = supplier.get();
				return new Pair<>(System.currentTimeMillis() - start, res);
		}
}