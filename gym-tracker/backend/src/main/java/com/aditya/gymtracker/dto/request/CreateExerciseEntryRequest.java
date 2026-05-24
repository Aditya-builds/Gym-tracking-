package com.aditya.gymtracker.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateExerciseEntryRequest {

    private Long workoutSessionId;

    private Long exerciseDefinitionId;

    private Integer orderIndex;

    private String exerciseNotes;
}
