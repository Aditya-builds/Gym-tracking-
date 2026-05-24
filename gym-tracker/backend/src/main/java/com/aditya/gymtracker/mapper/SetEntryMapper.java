package com.aditya.gymtracker.mapper;

import com.aditya.gymtracker.dto.response.SetEntryResponse;
import com.aditya.gymtracker.entity.SetEntry;

public class SetEntryMapper {

    private SetEntryMapper() {
    }

    public static SetEntryResponse toResponse(
            SetEntry entity
    ) {

        SetEntryResponse response =
                new SetEntryResponse();

        response.setId(entity.getId());

        response.setExerciseEntryId(entity.getExerciseEntryId());

        response.setSetNumber(entity.getSetNumber());

        response.setWeight(entity.getWeight());

        response.setReps(entity.getReps());

        response.setRir(entity.getRir());

        response.setIsPr(entity.getIsPr());

        response.setVolume(
                entity.calculateVolume()
        );

        response.setEstimatedOneRepMax(
                entity.estimateOneRepMax()
        );

        response.setCreatedAt(entity.getCreatedAt());

        return response;
    }
}
