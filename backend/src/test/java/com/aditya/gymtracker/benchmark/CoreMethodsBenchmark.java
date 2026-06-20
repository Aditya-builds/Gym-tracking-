package com.aditya.gymtracker.benchmark;

import com.aditya.gymtracker.service.WorkoutPlanTextParser;
import com.aditya.gymtracker.util.OneRMCalculator;
import com.aditya.gymtracker.util.VolumeCalculator;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Fork;
import org.openjdk.jmh.annotations.Measurement;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Warmup;

import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@Fork(0)
@Warmup(iterations = 2, time = 1)
@Measurement(iterations = 3, time = 1)
@State(Scope.Benchmark)
public class CoreMethodsBenchmark {

    private WorkoutPlanTextParser parser;

    @Setup
    public void setup() {
        parser = new WorkoutPlanTextParser();
    }

    @Benchmark
    public void parseFullPlan() {
        parser.parse(BenchmarkFixtures.FULL_PLAN);
    }

    @Benchmark
    public void parseSmallPlan() {
        parser.parse(BenchmarkFixtures.SMALL_PLAN);
    }

    @Benchmark
    public double estimateOneRepMax() {
        return OneRMCalculator.estimate(
                BenchmarkFixtures.SAMPLE_WEIGHT,
                BenchmarkFixtures.SAMPLE_REPS
        );
    }

    @Benchmark
    public void calculateVolume() {
        VolumeCalculator.calculate(
                BenchmarkFixtures.SAMPLE_WEIGHT,
                BenchmarkFixtures.SAMPLE_REPS
        );
    }
}
