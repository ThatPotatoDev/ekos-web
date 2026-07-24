package dev.thatpotato;


import org.eclipse.jetty.ee10.servlet.ServletMapping;
import org.graalvm.nativeimage.hosted.Feature;
import org.graalvm.nativeimage.hosted.RuntimeReflection;

public class GraalVMCompat implements Feature {

		public void beforeAnalysis(BeforeAnalysisAccess access) {
				RuntimeReflection.register(ServletMapping[].class);
//				RuntimeReflection.register(StaticLoggerBinder.class);
		}
}