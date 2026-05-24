package com.aditya.gymtracker.service;

import com.aditya.gymtracker.entity.ExerciseDefinition;
import com.aditya.gymtracker.storage.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@ApplicationScoped
public class PlanService {

    @Inject
    JsonDataStore store;

    @Inject
    WorkoutPlanTextParser textParser;

    public WorkoutPlan getPlan() {
        GymDataRoot data = store.snapshot();
        if (data.getWorkoutPlan() != null) {
            return data.getWorkoutPlan();
        }
        WorkoutPlan fallback = new WorkoutPlan();
        fallback.setPlanName("Default catalog");
        fallback.setExercises(data.getExerciseDefinitions());
        fallback.setTrainingDays(List.of("Push", "Pull", "Legs", "Upper", "Lower", "Full Body"));
        return fallback;
    }

    public WorkoutPlan importPlan(WorkoutPlan plan) throws IOException {
        GymDataRoot data = store.snapshot();

        if (plan.getExercises() != null) {
            for (ExerciseDefinition incoming : plan.getExercises()) {
                mergeExercise(data, incoming);
            }
        }

        if (plan.getDaySchedule() != null) {
            for (Map.Entry<String, List<String>> entry : plan.getDaySchedule().entrySet()) {
                for (String exerciseName : entry.getValue()) {
                    ExerciseDefinition def = new ExerciseDefinition();
                    def.setExerciseName(exerciseName);
                    def.setExerciseCode(slug(exerciseName));
                    mergeExercise(data, def);
                }
            }
        }

        if (plan.getDays() != null) {
            for (PlanDay day : plan.getDays()) {
                for (PlanExercise ex : day.allExercises()) {
                    ExerciseDefinition def = new ExerciseDefinition();
                    def.setExerciseName(ex.getName());
                    def.setExerciseCode(slug(ex.getName()));
                    mergeExercise(data, def);
                }
            }
        }

        data.setWorkoutPlan(plan);
        store.save();
        return getPlan();
    }

    public WorkoutPlan importPlanText(String rawText) throws IOException {
        WorkoutPlan parsed = textParser.parse(rawText);
        return importPlan(parsed);
    }

    private void mergeExercise(GymDataRoot data, ExerciseDefinition incoming) {
        String code = incoming.getExerciseCode() != null
                ? incoming.getExerciseCode()
                : slug(incoming.getExerciseName());

        boolean exists = data.getExerciseDefinitions().stream()
                .anyMatch(d -> d.getExerciseCode().equalsIgnoreCase(code)
                        || d.getExerciseName().equalsIgnoreCase(incoming.getExerciseName()));

        if (!exists) {
            incoming.setId(store.nextId("exerciseDefinitions"));
            if (incoming.getExerciseCode() == null) {
                incoming.setExerciseCode(code);
            }
            if (incoming.getIsCompound() == null) {
                incoming.setIsCompound(true);
            }
            data.getExerciseDefinitions().add(incoming);
        }
    }

    private String slug(String name) {
        if (name == null) {
            return "exercise";
        }
        return name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_|_$", "");
    }
}
