package com.aditya.gymtracker.storage;

import com.aditya.gymtracker.entity.ExerciseDefinition;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class WorkoutPlan {

    private String planName;
    private Integer weeks = 8;
    private String focus;
    private List<String> trainingDays = new ArrayList<>();
    private List<ExerciseDefinition> exercises = new ArrayList<>();
    private Map<String, List<String>> daySchedule = new LinkedHashMap<>();
    private List<PlanDay> days = new ArrayList<>();
    private List<String> weekPhases = new ArrayList<>();
    private String rawText;
}
