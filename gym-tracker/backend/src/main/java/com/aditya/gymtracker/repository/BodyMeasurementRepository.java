package com.aditya.gymtracker.repository;

import com.aditya.gymtracker.entity.BodyMeasurement;
import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@ApplicationScoped
public class BodyMeasurementRepository {

    @Inject
    JsonDataStore store;

    public void persist(BodyMeasurement measurement) throws IOException {
        GymDataRoot data = store.snapshot();
        if (measurement.getId() == null) {
            measurement.setId(store.nextId("bodyMeasurements"));
        }
        if (measurement.getUser() != null) {
            measurement.setUserId(measurement.getUser().getId());
        }
        if (measurement.getCreatedAt() == null) {
            measurement.setCreatedAt(Instant.now());
        }
        data.getBodyMeasurements().add(measurement);
        store.save();
    }

    public List<BodyMeasurement> findByUser(Long userId) {
        return store.snapshot().getBodyMeasurements().stream()
                .filter(m -> userId.equals(m.getUserId()))
                .sorted(Comparator.comparing(BodyMeasurement::getMeasurementDate).reversed())
                .toList();
    }

    public List<BodyMeasurement> findByWeekRange(
            Long userId,
            Integer startWeek,
            Integer endWeek
    ) {
        return store.snapshot().getBodyMeasurements().stream()
                .filter(m -> userId.equals(m.getUserId())
                        && m.getWeekNumber() >= startWeek
                        && m.getWeekNumber() <= endWeek)
                .sorted(Comparator.comparing(BodyMeasurement::getWeekNumber))
                .toList();
    }

    public BodyMeasurement findLatest(Long userId) {
        return store.snapshot().getBodyMeasurements().stream()
                .filter(m -> userId.equals(m.getUserId()))
                .max(Comparator.comparing(BodyMeasurement::getMeasurementDate))
                .orElse(null);
    }
}
