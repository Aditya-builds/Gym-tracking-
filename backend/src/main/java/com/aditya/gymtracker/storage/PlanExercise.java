package com.aditya.gymtracker.storage;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlanExercise {

    private String name;
    private String sectionName;
    private Integer sets;
    private String reps;
    private String prescription;
    private String notes;
    /** Main lifts users typically log; warm-up bullets default false unless numbered main block */
    private boolean loggable = true;
}
