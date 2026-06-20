package com.aditya.gymtracker.benchmark;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Compares JMH JSON output against {@code benchmarks/baseline.json} ceilings.
 */
public final class BenchmarkResultChecker {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws IOException {
        Path resultsPath = Path.of(args.length > 0 ? args[0] : "target/jmh-results.json");
        Path baselinePath = Path.of(args.length > 1 ? args[1] : "benchmarks/baseline.json");

        if (!Files.exists(resultsPath)) {
            throw new IllegalStateException("Missing JMH results: " + resultsPath.toAbsolutePath());
        }
        if (!Files.exists(baselinePath)) {
            throw new IllegalStateException("Missing baseline: " + baselinePath.toAbsolutePath());
        }

        JsonNode baselineRoot = MAPPER.readTree(baselinePath.toFile());
        JsonNode ceilings = baselineRoot.get("benchmarks");
        if (ceilings == null || !ceilings.isObject()) {
            throw new IllegalStateException("baseline.json must contain a 'benchmarks' object");
        }

        Map<String, Double> scores = readScores(resultsPath);
        List<String> failures = new ArrayList<>();

        System.out.println();
        System.out.println("JMH benchmark results (average time, lower is better):");
        System.out.println("-------------------------------------------------------");

        Iterator<Map.Entry<String, JsonNode>> fields = ceilings.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String benchmark = entry.getKey();
            double maxUs = entry.getValue().get("maxUs").asDouble();
            Double score = scores.get(benchmark);

            if (score == null) {
                failures.add(benchmark + " — missing from JMH output");
                System.out.printf("  FAIL  %-55s  (not measured)%n", shortName(benchmark));
                continue;
            }

            String status = score <= maxUs ? "OK" : "FAIL";
            System.out.printf(
                    "  %-4s  %-55s  %8.2f us/op  (max %8.0f us/op)%n",
                    status,
                    shortName(benchmark),
                    score,
                    maxUs
            );

            if (score > maxUs) {
                failures.add(String.format(
                        "%s took %.2f us/op (max allowed %.0f us/op)",
                        shortName(benchmark),
                        score,
                        maxUs
                ));
            }
        }

        System.out.println("-------------------------------------------------------");

        if (!failures.isEmpty()) {
            System.err.println();
            System.err.println("Benchmark regression detected:");
            failures.forEach(msg -> System.err.println("  - " + msg));
            System.exit(1);
        }

        System.out.println("All benchmarks within thresholds.");
    }

    private static Map<String, Double> readScores(Path resultsPath) throws IOException {
        JsonNode root = MAPPER.readTree(resultsPath.toFile());
        if (!root.isArray()) {
            throw new IllegalStateException("Expected JMH JSON array in " + resultsPath);
        }

        Map<String, Double> scores = new TreeMap<>();
        for (JsonNode row : root) {
            String benchmark = row.path("benchmark").asText(null);
            JsonNode metric = row.path("primaryMetric");
            if (benchmark == null || metric.isMissingNode()) {
                continue;
            }
            scores.put(benchmark, metric.path("score").asDouble());
        }
        return scores;
    }

    private static String shortName(String fqcn) {
        int dot = fqcn.lastIndexOf('.');
        return dot >= 0 ? fqcn.substring(dot + 1) : fqcn;
    }

    private BenchmarkResultChecker() {
    }
}
