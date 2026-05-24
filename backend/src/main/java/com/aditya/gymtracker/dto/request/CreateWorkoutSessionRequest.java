package com.aditya.gymtracker.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateWorkoutSessionRequest {

    @NotNull(message = "Workout date is required")
    private LocalDate workoutDate;

    @NotNull(message = "Week number is required")
    @Min(value = 1, message = "Week number must be at least 1")
    private Integer weekNumber;

    @NotNull(message = "Training day is required")
    private String trainingDay;

    @Min(value = 1, message = "Duration must be positive")
    private Integer durationMinutes;

    @Min(value = 1)
    @Max(value = 10)
    private Integer energyLevel;

    private Boolean completed;

    private String sessionNotes;
}
