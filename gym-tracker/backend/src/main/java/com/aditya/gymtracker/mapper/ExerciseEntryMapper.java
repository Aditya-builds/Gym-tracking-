package com.aditya.gymtracker.mapper;

import com.aditya.gymtracker.dto.response.ExerciseEntryResponse;
import com.aditya.gymtracker.entity.ExerciseEntry;

public class ExerciseEntryMapper {

    private ExerciseEntryMapper() {
    }

    public static ExerciseEntryResponse toResponse(
            ExerciseEntry entity
    ) {

        ExerciseEntryResponse response =
                new ExerciseEntryResponse();

        response.setId(entity.getId());

        response.setWorkoutSessionId(entity.getWorkoutSessionId());

        response.setExerciseDefinitionId(entity.getExerciseDefinitionId());

        response.setExerciseName(
                entity.getExerciseDefinition() != null
                        ? entity.getExerciseDefinition().getExerciseName()
                        : null
        );

        response.setOrderIndex(entity.getOrderIndex());

        response.setExerciseNotes(
                entity.getExerciseNotes()
        );

        return response;
    }
}
