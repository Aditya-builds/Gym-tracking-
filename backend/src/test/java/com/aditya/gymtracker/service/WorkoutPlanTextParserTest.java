package com.aditya.gymtracker.service;

import com.aditya.gymtracker.storage.PlanDay;
import com.aditya.gymtracker.storage.PlanExercise;
import com.aditya.gymtracker.storage.WorkoutPlan;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WorkoutPlanTextParserTest {

    private final WorkoutPlanTextParser parser = new WorkoutPlanTextParser();

    @Test
    void parsesDayHeaderWithEmDash() {
        String text = """
                DAY 1 – BACK + BICEPS

                BACK (Main Workout)
                1. Pull-Ups
                   → 3 × 6–10
                2. Lat Pulldown
                   → 3 × 8–12
                """;

        WorkoutPlan plan = parser.parse(text);

        assertEquals(1, plan.getDays().size());
        PlanDay day = plan.getDays().get(0);
        assertEquals(1, day.getDayNumber());
        assertTrue(day.getLabel().contains("BACK"));
        assertFalse(day.loggableExercises().isEmpty());
    }

    @Test
    void parsesDayColonFormatAndBullets() {
        String text = """
                Day 1: Push
                - Pull-up
                - Bench Press
                """;

        WorkoutPlan plan = parser.parse(text);

        assertEquals(1, plan.getDays().size());
        List<String> names = plan.getDays().get(0).loggableExercises().stream()
                .map(PlanExercise::getName)
                .toList();
        assertTrue(names.contains("Pull-up"));
        assertTrue(names.contains("Bench Press"));
        assertNotNull(plan.getDaySchedule().get(plan.getDays().get(0).getLabel()));
    }

    @Test
    void parsesMultipleDays() {
        String text = """
                DAY 1 – BACK
                1. Row
                → 3 × 8–12

                DAY 2 – LEGS
                1. Back Squat
                → 4 × 6–8
                """;

        WorkoutPlan plan = parser.parse(text);

        assertEquals(2, plan.getDays().size());
        assertEquals(2, plan.getTrainingDays().size());
    }

    @Test
    void emptyTextThrows() {
        assertThrows(IllegalArgumentException.class, () -> parser.parse("   "));
    }

    @Test
    void noDaysThrowsWithHelpfulMessage() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> parser.parse("Random notes\nNo structure here")
        );
        assertTrue(ex.getMessage().contains("No training days found"));
    }
}
