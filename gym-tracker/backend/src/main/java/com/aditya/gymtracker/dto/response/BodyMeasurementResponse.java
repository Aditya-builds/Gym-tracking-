package com.aditya.gymtracker.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class BodyMeasurementResponse {

    private Long id;

    private LocalDate measurementDate;

    private Integer weekNumber;

    private BigDecimal bodyWeight;

    private BigDecimal waistNavel;

    private BigDecimal waistSmallest;

    private BigDecimal hips;

    private BigDecimal thigh;

    private BigDecimal chest;

    private BigDecimal shoulders;

    private BigDecimal arm;

    private String notes;

    private Instant createdAt;
}
