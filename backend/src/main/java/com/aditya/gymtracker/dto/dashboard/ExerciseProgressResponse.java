package com.aditya.gymtracker.dto.dashboard;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class ExerciseProgressResponse {

    private String exerciseName;

    private BigDecimal weight;

    private Integer reps;

    private BigDecimal volume;

    private Double estimatedOneRepMax;

    private Instant createdAt;
}
