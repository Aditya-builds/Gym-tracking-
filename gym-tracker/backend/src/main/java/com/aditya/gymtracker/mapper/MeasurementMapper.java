package com.aditya.gymtracker.mapper;

import com.aditya.gymtracker.dto.response.BodyMeasurementResponse;
import com.aditya.gymtracker.entity.BodyMeasurement;

public class MeasurementMapper {

	private MeasurementMapper() {
	}

	public static BodyMeasurementResponse toResponse(
			BodyMeasurement entity
	) {

		BodyMeasurementResponse response =
				new BodyMeasurementResponse();

		response.setId(entity.getId());
		response.setMeasurementDate(entity.getMeasurementDate());
		response.setWeekNumber(entity.getWeekNumber());
		response.setBodyWeight(entity.getBodyWeight());

		response.setWaistNavel(entity.getWaistNavel());
		response.setWaistSmallest(entity.getWaistSmallest());

		response.setHips(entity.getHips());
		response.setThigh(entity.getThigh());

		response.setChest(entity.getChest());
		response.setShoulders(entity.getShoulders());
		response.setArm(entity.getArm());

		response.setNotes(entity.getNotes());

		response.setCreatedAt(entity.getCreatedAt());

		return response;
	}
}

