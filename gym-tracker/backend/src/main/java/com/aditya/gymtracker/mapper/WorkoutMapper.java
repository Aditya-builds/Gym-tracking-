package com.aditya.gymtracker.mapper;

import com.aditya.gymtracker.dto.response.WorkoutSessionResponse;
import com.aditya.gymtracker.entity.WorkoutSession;

public class WorkoutMapper {
	private WorkoutMapper() {
	}

	public static WorkoutSessionResponse toResponse(
			WorkoutSession entity
	) {

		WorkoutSessionResponse response =
				new WorkoutSessionResponse();

		response.setId(entity.getId());
		response.setWorkoutDate(entity.getWorkoutDate());
		response.setWeekNumber(entity.getWeekNumber());
		response.setTrainingDay(entity.getTrainingDay());
		response.setDurationMinutes(entity.getDurationMinutes());
		response.setEnergyLevel(entity.getEnergyLevel());
		response.setCompleted(entity.getCompleted());
		response.setSessionNotes(entity.getSessionNotes());
		response.setCreatedAt(entity.getCreatedAt());

		return response;
	}
}
