package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.request.CreateBodyMeasurementRequest;
import com.aditya.gymtracker.entity.BodyMeasurement;
import com.aditya.gymtracker.entity.User;
import com.aditya.gymtracker.exception.ResourceNotFoundException;
import com.aditya.gymtracker.repository.BodyMeasurementRepository;
import com.aditya.gymtracker.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.util.List;

@ApplicationScoped
public class MeasurementService {

    @Inject
    BodyMeasurementRepository bodyMeasurementRepository;

    @Inject
    UserRepository userRepository;

    public BodyMeasurement createMeasurement(
            Long userId,
            CreateBodyMeasurementRequest request
    ) {

        User user = userRepository.findByIdOptional(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        ));

        BodyMeasurement measurement =
                new BodyMeasurement();

        measurement.setUser(user);
        measurement.setUserId(user.getId());

        measurement.setMeasurementDate(
                request.getMeasurementDate()
        );

        measurement.setWeekNumber(
                request.getWeekNumber()
        );

        measurement.setBodyWeight(
                request.getBodyWeight()
        );

        measurement.setWaistNavel(
                request.getWaistNavel()
        );

        measurement.setWaistSmallest(
                request.getWaistSmallest()
        );

        measurement.setHips(
                request.getHips()
        );

        measurement.setThigh(
                request.getThigh()
        );

        measurement.setChest(
                request.getChest()
        );

        measurement.setShoulders(
                request.getShoulders()
        );

        measurement.setArm(
                request.getArm()
        );

        measurement.setNotes(
                request.getNotes()
        );

        try {
            bodyMeasurementRepository.persist(measurement);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save measurement", e);
        }

        return measurement;
    }

    public List<BodyMeasurement> getAllMeasurements(
            Long userId
    ) {

        return bodyMeasurementRepository.findByUser(
                userId
        );
    }

    public BodyMeasurement getLatestMeasurement(
            Long userId
    ) {

        return bodyMeasurementRepository.findLatest(
                userId
        );
    }
}

