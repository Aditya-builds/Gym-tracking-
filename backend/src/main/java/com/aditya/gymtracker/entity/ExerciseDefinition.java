package com.aditya.gymtracker.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExerciseDefinition {

    private Long id;
    private String exerciseCode;
    private String exerciseName;
    private String muscleGroup;
    private String movementType;
    private Boolean isCompound = false;
}
