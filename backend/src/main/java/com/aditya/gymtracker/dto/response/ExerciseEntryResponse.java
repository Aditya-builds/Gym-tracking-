package com.aditya.gymtracker.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExerciseEntryResponse {

    private Long id;

    private Long workoutSessionId;

    private Long exerciseDefinitionId;

    private String exerciseName;

    private Integer orderIndex;

    private String exerciseNotes;
}
