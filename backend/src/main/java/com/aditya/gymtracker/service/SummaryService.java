package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.dashboard.WeeklySummaryResponse;
import com.aditya.gymtracker.entity.BodyMeasurement;
import com.aditya.gymtracker.entity.SetEntry;
import com.aditya.gymtracker.repository.BodyMeasurementRepository;
import com.aditya.gymtracker.repository.SetEntryRepository;
import com.aditya.gymtracker.util.VolumeCalculator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.util.*;

@ApplicationScoped
public class SummaryService {

    @Inject
    BodyMeasurementRepository bodyMeasurementRepository;

    @Inject
    SetEntryRepository setEntryRepository;

    public List<WeeklySummaryResponse> getWeeklySummary(
            Long userId
    ) {

        List<BodyMeasurement> measurements =
                bodyMeasurementRepository.findByUser(
                        userId
                );

        List<SetEntry> sets =
                setEntryRepository.listAllForUser(userId);

        Map<Integer, WeeklySummaryResponse> summaryMap =
                new HashMap<>();

        for (BodyMeasurement measurement : measurements) {

            WeeklySummaryResponse response =
                    summaryMap.getOrDefault(
                            measurement.getWeekNumber(),
                            new WeeklySummaryResponse()
                    );

            response.setWeekNumber(
                    measurement.getWeekNumber()
            );

            response.setBodyWeight(
                    measurement.getBodyWeight()
            );

            response.setWaist(
                    measurement.getWaistNavel()
            );

            response.setHips(
                    measurement.getHips()
            );

            response.setThigh(
                    measurement.getThigh()
            );

            summaryMap.put(
                    measurement.getWeekNumber(),
                    response
            );
        }

        for (SetEntry set : sets) {

            Integer week =
                    set.getExerciseEntry()
                            .getWorkoutSession()
                            .getWeekNumber();

            WeeklySummaryResponse response =
                    summaryMap.getOrDefault(
                            week,
                            new WeeklySummaryResponse()
                    );

            BigDecimal currentVolume =
                    response.getTotalVolume() == null
                            ? BigDecimal.ZERO
                            : response.getTotalVolume();

            BigDecimal setVolume =
                    VolumeCalculator.calculate(
                            set.getWeight(),
                            set.getReps()
                    );

            response.setTotalVolume(
                    currentVolume.add(setVolume)
            );

            String exerciseName =
                    set.getExerciseEntry()
                            .getExerciseDefinition()
                            .getExerciseName();

            String formattedSet =
                    set.getWeight()
                            + " x "
                            + set.getReps();

            if (exerciseName.toLowerCase()
                    .contains("squat")) {

                response.setBestSquat(
                        formattedSet
                );
            }

            if (exerciseName.toLowerCase()
                    .contains("hip thrust")) {

                response.setBestHipThrust(
                        formattedSet
                );
            }

            if (exerciseName.toLowerCase()
                    .contains("pull")
                    || exerciseName.toLowerCase()
                    .contains("lat")) {

                response.setBestPullMovement(
                        formattedSet
                );
            }

            summaryMap.put(
                    week,
                    response
            );
        }

        List<WeeklySummaryResponse> responses =
                new ArrayList<>(
                        summaryMap.values()
                );

        responses.sort(
                Comparator.comparing(
                        WeeklySummaryResponse::getWeekNumber
                )
        );

        return responses;
    }
}

