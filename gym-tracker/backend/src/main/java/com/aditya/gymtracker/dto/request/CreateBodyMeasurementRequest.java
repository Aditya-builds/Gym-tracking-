package com.aditya.gymtracker.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreateBodyMeasurementRequest {

    @NotNull
    private LocalDate measurementDate;

    @NotNull
    @Min(1)
    private Integer weekNumber;

    @Positive
    private BigDecimal bodyWeight;

    @Positive
    private BigDecimal waistNavel;

    @Positive
    private BigDecimal waistSmallest;

    @Positive
    private BigDecimal hips;

    @Positive
    private BigDecimal thigh;

    @Positive
    private BigDecimal chest;

    @Positive
    private BigDecimal shoulders;

    @Positive
    private BigDecimal arm;

    private String notes;
}
