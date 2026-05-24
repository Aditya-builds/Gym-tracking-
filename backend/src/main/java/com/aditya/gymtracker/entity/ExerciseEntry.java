package com.aditya.gymtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExerciseEntry {

    private Long id;
    private Long workoutSessionId;
    private Long exerciseDefinitionId;

    @JsonIgnore
    private WorkoutSession workoutSession;

    @JsonIgnore
    private ExerciseDefinition exerciseDefinition;

    private Integer orderIndex;
    private String exerciseNotes;

    @JsonIgnore
    private List<SetEntry> setEntries;
}
