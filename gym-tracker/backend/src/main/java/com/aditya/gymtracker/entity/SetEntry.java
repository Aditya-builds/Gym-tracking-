package com.aditya.gymtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class SetEntry {

    private Long id;
    private Long exerciseEntryId;

    @JsonIgnore
    private ExerciseEntry exerciseEntry;

    private Integer setNumber;
    private BigDecimal weight;
    private Integer reps;
    private Integer rir;
    private Boolean isPr = false;
    private Instant createdAt;

    public BigDecimal calculateVolume() {
        if (weight == null || reps == null) {
            return BigDecimal.ZERO;
        }
        return weight.multiply(BigDecimal.valueOf(reps));
    }

    public Double estimateOneRepMax() {
        if (weight == null || reps == null) {
            return 0.0;
        }
        return weight.doubleValue() * (1 + (reps / 30.0));
    }
}
