package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.dashboard.ExerciseProgressResponse;
import com.aditya.gymtracker.dto.dashboard.WeeklyVolumeResponse;
import com.aditya.gymtracker.entity.SetEntry;
import com.aditya.gymtracker.repository.SetEntryRepository;
import com.aditya.gymtracker.util.OneRMCalculator;
import com.aditya.gymtracker.util.VolumeCalculator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.util.*;

@ApplicationScoped
public class AnalyticsService {

    @Inject
    SetEntryRepository setEntryRepository;

    public List<ExerciseProgressResponse> getExerciseProgress(
            Long exerciseEntryId
    ) {

        List<SetEntry> sets =
                setEntryRepository.findByExerciseEntry(
                        exerciseEntryId
                );

        return sets.stream()
                .map(set -> {

                    ExerciseProgressResponse response =
                            new ExerciseProgressResponse();

                    response.setExerciseName(
                            set.getExerciseEntry()
                                    .getExerciseDefinition()
                                    .getExerciseName()
                    );

                    response.setWeight(
                            set.getWeight()
                    );

                    response.setReps(
                            set.getReps()
                    );

                    response.setVolume(
                            VolumeCalculator.calculate(
                                    set.getWeight(),
                                    set.getReps()
                            )
                    );

                    response.setEstimatedOneRepMax(
                            OneRMCalculator.estimate(
                                    set.getWeight(),
                                    set.getReps()
                            )
                    );

                    response.setCreatedAt(
                            set.getCreatedAt()
                    );

                    return response;
                })
                .toList();
    }

    public List<WeeklyVolumeResponse> getWeeklyVolume(
            Long exerciseEntryId
    ) {

        List<SetEntry> sets =
                setEntryRepository.findByExerciseEntry(
                        exerciseEntryId
                );

        Map<Integer, BigDecimal> volumeMap =
                new HashMap<>();

        for (SetEntry set : sets) {

            Integer week =
                    set.getExerciseEntry()
                            .getWorkoutSession()
                            .getWeekNumber();

            BigDecimal volume =
                    VolumeCalculator.calculate(
                            set.getWeight(),
                            set.getReps()
                    );

            volumeMap.put(
                    week,
                    volumeMap.getOrDefault(
                            week,
                            BigDecimal.ZERO
                    ).add(volume)
            );
        }

        List<WeeklyVolumeResponse> responses =
                new ArrayList<>();

        for (Map.Entry<Integer, BigDecimal> entry
                : volumeMap.entrySet()) {

            WeeklyVolumeResponse response =
                    new WeeklyVolumeResponse();

            response.setWeekNumber(
                    entry.getKey()
            );

            response.setTotalVolume(
                    entry.getValue()
            );

            responses.add(response);
        }

        responses.sort(
                Comparator.comparing(
                        WeeklyVolumeResponse::getWeekNumber
                )
        );

        return responses;
    }
}

