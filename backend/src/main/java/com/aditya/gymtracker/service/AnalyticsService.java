package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.dashboard.ExerciseProgressResponse;
import com.aditya.gymtracker.dto.dashboard.WeeklyVolumeResponse;
import com.aditya.gymtracker.entity.ExerciseEntry;
import com.aditya.gymtracker.entity.SetEntry;
import com.aditya.gymtracker.entity.WorkoutSession;
import com.aditya.gymtracker.repository.SetEntryRepository;
import com.aditya.gymtracker.util.OneRMCalculator;
import com.aditya.gymtracker.util.VolumeCalculator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class AnalyticsService {

    private static final Long DEFAULT_USER_ID = 1L;

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
                .map(this::toProgressResponse)
                .toList();
    }

    public List<ExerciseProgressResponse> getProgressByExerciseName(
            String exerciseName,
            String trainingDay
    ) {
        if (exerciseName == null || exerciseName.isBlank()) {
            return List.of();
        }

        String dayKey = normalizeKey(trainingDay);

        return setEntryRepository.listAllForUser(DEFAULT_USER_ID).stream()
                .filter(set -> matchesExercise(set, exerciseName))
                .filter(set -> matchesTrainingDay(set, dayKey))
                .sorted(Comparator.comparing(
                        SetEntry::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .map(this::toProgressResponse)
                .toList();
    }

    public List<WeeklyVolumeResponse> getWeeklyVolume(
            Long exerciseEntryId
    ) {

        List<SetEntry> sets =
                setEntryRepository.findByExerciseEntry(
                        exerciseEntryId
                );

        return aggregateWeeklyVolume(sets);
    }

    public List<WeeklyVolumeResponse> getWeeklyVolumeByExerciseName(
            String exerciseName,
            String trainingDay
    ) {
        if (exerciseName == null || exerciseName.isBlank()) {
            return List.of();
        }

        String dayKey = normalizeKey(trainingDay);

        List<SetEntry> sets = setEntryRepository.listAllForUser(DEFAULT_USER_ID).stream()
                .filter(set -> matchesExercise(set, exerciseName))
                .filter(set -> matchesTrainingDay(set, dayKey))
                .toList();

        return aggregateWeeklyVolume(sets);
    }

    private List<WeeklyVolumeResponse> aggregateWeeklyVolume(List<SetEntry> sets) {
        Map<Integer, BigDecimal> volumeMap = new HashMap<>();

        for (SetEntry set : sets) {
            Integer week = weekNumberFor(set);
            if (week == null) {
                continue;
            }

            BigDecimal volume = VolumeCalculator.calculate(
                    set.getWeight(),
                    set.getReps()
            );

            volumeMap.put(
                    week,
                    volumeMap.getOrDefault(week, BigDecimal.ZERO).add(volume)
            );
        }

        return volumeMap.entrySet().stream()
                .map(entry -> {
                    WeeklyVolumeResponse response = new WeeklyVolumeResponse();
                    response.setWeekNumber(entry.getKey());
                    response.setTotalVolume(entry.getValue());
                    return response;
                })
                .sorted(Comparator.comparing(WeeklyVolumeResponse::getWeekNumber))
                .collect(Collectors.toList());
    }

    private ExerciseProgressResponse toProgressResponse(SetEntry set) {
        ExerciseProgressResponse response = new ExerciseProgressResponse();

        ExerciseEntry entry = set.getExerciseEntry();
        if (entry != null && entry.getExerciseDefinition() != null) {
            response.setExerciseName(
                    entry.getExerciseDefinition().getExerciseName()
            );
        }

        response.setWeight(set.getWeight());
        response.setReps(set.getReps());
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
        response.setCreatedAt(set.getCreatedAt());
        response.setSetNumber(set.getSetNumber());
        response.setNotes(set.getNotes());

        WorkoutSession session = entry != null ? entry.getWorkoutSession() : null;
        if (session != null) {
            if (session.getWorkoutDate() != null) {
                response.setWorkoutDate(session.getWorkoutDate().toString());
            }
            response.setWeekNumber(session.getWeekNumber());
            response.setTrainingDay(session.getTrainingDay());
        }

        return response;
    }

    private boolean matchesExercise(SetEntry set, String exerciseName) {
        ExerciseEntry entry = set.getExerciseEntry();
        if (entry == null || entry.getExerciseDefinition() == null) {
            return false;
        }
        String setName = entry.getExerciseDefinition().getExerciseName();
        return namesMatch(setName, exerciseName);
    }

    private boolean matchesTrainingDay(SetEntry set, String dayKey) {
        if (dayKey == null || dayKey.isBlank()) {
            return true;
        }
        ExerciseEntry entry = set.getExerciseEntry();
        if (entry == null || entry.getWorkoutSession() == null) {
            return false;
        }
        return namesMatch(entry.getWorkoutSession().getTrainingDay(), dayKey);
    }

    private Integer weekNumberFor(SetEntry set) {
        ExerciseEntry entry = set.getExerciseEntry();
        if (entry == null || entry.getWorkoutSession() == null) {
            return null;
        }
        return entry.getWorkoutSession().getWeekNumber();
    }

    private boolean namesMatch(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        String na = normalizeKey(a);
        String nb = normalizeKey(b);
        return na.equals(nb) || na.contains(nb) || nb.contains(na);
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace('\u2013', '-')
                .replace('\u2014', '-')
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
