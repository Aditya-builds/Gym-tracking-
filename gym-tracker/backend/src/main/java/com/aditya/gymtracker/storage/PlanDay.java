package com.aditya.gymtracker.storage;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PlanDay {

    private int dayNumber;
    private String title;
    /** Value used in workout session trainingDay field */
    private String label;
    private List<PlanSection> sections = new ArrayList<>();

    public List<PlanExercise> allExercises() {
        List<PlanExercise> all = new ArrayList<>();
        for (PlanSection section : sections) {
            all.addAll(section.getExercises());
        }
        return all;
    }

    public List<PlanExercise> loggableExercises() {
        return allExercises().stream()
                .filter(PlanExercise::isLoggable)
                .toList();
    }
}
