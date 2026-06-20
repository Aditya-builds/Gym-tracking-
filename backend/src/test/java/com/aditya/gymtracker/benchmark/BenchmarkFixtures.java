package com.aditya.gymtracker.benchmark;

import java.math.BigDecimal;

final class BenchmarkFixtures {

    static final String FULL_PLAN = """
            DAY 1 – BACK + BICEPS (V-TAPER FOCUSED)

            Warm-up
            - Band pull-aparts
            → 2 × 15

            BACK (Main Workout)
            1. Pull-Ups
               → 3 × 6–10
            2. Lat Pulldown
               → 3 × 8–12
            3. Chest-Supported Row
               → 3 × 8–12
            4. Single-Arm Dumbbell Row
               → 3 × 10–12

            BICEPS
            - Incline Dumbbell Curl
              → 3 × 10–12
            - Hammer Curl
              → 3 × 12–15

            DAY 2 – LEGS + GLUTES

            LEGS (Main Workout)
            1. Back Squat
               → 4 × 6–8
            2. Romanian Deadlift
               → 3 × 8–10
            3. Leg Press
               → 3 × 10–12
            4. Walking Lunges
               → 3 × 12 each

            GLUTES
            - Hip Thrust
              → 4 × 8–12
            - Cable Kickback
              → 3 × 12–15

            DAY 3 – CHEST + TRICEPS + SHOULDERS

            CHEST (Main Workout)
            1. Barbell Bench Press
               → 4 × 6–8
            2. Incline Dumbbell Press
               → 3 × 8–12
            3. Cable Fly
               → 3 × 12–15

            SHOULDERS
            - Overhead Press
              → 3 × 6–10
            - Lateral Raise
              → 3 × 12–15

            TRICEPS
            - Skull Crushers
              → 3 × 10–12
            - Rope Pushdown
              → 3 × 12–15

            DAY 4 – UPPER (PULL EMPHASIS)

            UPPER (Main Workout)
            1. Barbell Row
               → 4 × 6–8
            2. Pull-Ups
               → 3 × 6–10
            3. Face Pull
               → 3 × 15–20

            DAY 5 – LOWER + CORE

            LOWER (Main Workout)
            1. Front Squat
               → 3 × 6–8
            2. Leg Curl
               → 3 × 10–12
            3. Calf Raise
               → 4 × 12–15

            CORE
            - Hanging Leg Raise
              → 3 × 10–12
            """;

    static final String SMALL_PLAN = """
            Day 1: Push
            - Pull-up
            - Bench Press
            - Overhead Press
            """;

    static final BigDecimal SAMPLE_WEIGHT = new BigDecimal("100.0");
    static final Integer SAMPLE_REPS = 8;

    private BenchmarkFixtures() {
    }
}
