package com.aditya.gymtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class BodyMeasurement {

    private Long id;
    private Long userId;

    @JsonIgnore
    private User user;

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
    private BigDecimal neck;
    private Boolean photosTaken;
    private String notes;
    private Instant createdAt;
}
