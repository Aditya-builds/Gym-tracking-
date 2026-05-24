package com.aditya.gymtracker.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class WorkoutSessionResponse {

    private Long id;

    private LocalDate workoutDate;

    private Integer weekNumber;

    private String trainingDay;

    private Integer durationMinutes;

    private Integer energyLevel;

    private Boolean completed;

    private String sessionNotes;

    private Instant createdAt;
}
