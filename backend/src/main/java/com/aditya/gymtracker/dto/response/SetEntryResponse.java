package com.aditya.gymtracker.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class SetEntryResponse {

    private Long id;

    private Long exerciseEntryId;

    private Integer setNumber;

    private BigDecimal weight;

    private Integer reps;

    private Integer rir;

    private Boolean isPr;

    private String notes;

    private BigDecimal volume;

    private Double estimatedOneRepMax;

    private Instant createdAt;
}
