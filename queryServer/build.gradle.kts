plugins {
    java
    application
    alias(libs.plugins.shadow)
    alias(libs.plugins.graalvm)
}

group = "dev.thatpotato"
version = "1.0-SNAPSHOT"

application {
    mainClass.set("dev.thatpotato.Main")
}

graalvmNative {
    toolchainDetection = true
    binaries {
        all {
            tasks.withType<org.graalvm.buildtools.gradle.tasks.BuildNativeImageTask>().configureEach {
                disableToolchainDetection.set(true)
            }
        }
        named("main") {
            // Disables deep compiler optimizations for 2x to 3x faster builds
            buildArgs.add("-Ob")
            resources.autodetect()
            runtimeArgs.add(project.file("run/catalog.jsonl.gz").absolutePath)
            buildArgs.add("-H:+UnlockExperimentalVMOptions")
            buildArgs.add("-H:-CheckToolchain")
            buildArgs.add("-H:IncludeResourceBundles=jakarta.servlet.LocalStrings,jakarta.servlet.http.LocalStrings")
            javaLauncher.set(javaToolchains.launcherFor {
                languageVersion.set(JavaLanguageVersion.of(26))
                vendor.set(JvmVendorSpec.matching("Oracle Corporation"))
            })
            metadataRepository {
                enabled.set(false)
            }
        }
    }
    agent {
        enabled = true
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.hppc)
    implementation(libs.gson)
    implementation(libs.slf4j)
    implementation(libs.javalin)
    implementation(libs.commonsText)
}