package com.aditya.gymtracker.storage;

import com.aditya.gymtracker.entity.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Root JSON document — maps to your tracker sheets:
 * set rows (workouts), key lifts, body check, weekly summary.
 */
@Getter
@Setter
public class GymDataRoot {

    private List<User> users = new ArrayList<>();
    private List<ExerciseDefinition> exerciseDefinitions = new ArrayList<>();
    private List<WorkoutSession> workoutSessions = new ArrayList<>();
    private List<ExerciseEntry> exerciseEntries = new ArrayList<>();
    private List<SetEntry> setEntries = new ArrayList<>();
    private List<BodyMeasurement> bodyMeasurements = new ArrayList<>();
    private List<PersonalRecord> personalRecords = new ArrayList<>();
    private List<KeyLiftWeek> keyLifts = new ArrayList<>();
    private List<WeeklySummaryEntry> weeklySummaries = new ArrayList<>();
    private WorkoutPlan workoutPlan;
}
