package com.aditya.gymtracker.benchmark;

import org.openjdk.jmh.results.format.ResultFormatType;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Runs core JMH benchmarks and validates against {@code benchmarks/baseline.json}.
 */
public final class BenchmarkRunner {

    public static void main(String[] args) throws RunnerException, IOException {
        Path output = Path.of("target/jmh-results.json");
        Files.createDirectories(output.getParent());

        Options options = new OptionsBuilder()
                .include(CoreMethodsBenchmark.class.getSimpleName())
                .forks(0)
                .warmupIterations(2)
                .warmupTime(org.openjdk.jmh.runner.options.TimeValue.seconds(1))
                .measurementIterations(3)
                .measurementTime(org.openjdk.jmh.runner.options.TimeValue.seconds(1))
                .resultFormat(ResultFormatType.JSON)
                .result(output.toString())
                .shouldDoGC(true)
                .jvmArgs("-Xms256m", "-Xmx512m")
                .build();

        new Runner(options).run();
        BenchmarkResultChecker.main(new String[]{
                output.toString(),
                "benchmarks/baseline.json"
        });
    }

    private BenchmarkRunner() {
    }
}
