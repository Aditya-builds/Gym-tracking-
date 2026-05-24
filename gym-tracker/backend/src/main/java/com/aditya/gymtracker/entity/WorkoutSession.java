package com.aditya.gymtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class WorkoutSession {

    private Long id;
    private Long userId;

    @JsonIgnore
    private User user;

    private LocalDate workoutDate;
    private Integer weekNumber;
    private String trainingDay;
    private Integer durationMinutes;
    private Integer energyLevel;
    private Boolean completed = true;
    private String sessionNotes;

    @JsonIgnore
    private List<ExerciseEntry> exerciseEntries;

    private Instant createdAt;
}
