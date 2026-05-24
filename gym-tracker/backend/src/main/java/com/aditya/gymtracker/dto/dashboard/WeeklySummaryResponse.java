package com.aditya.gymtracker.dto.dashboard;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class WeeklySummaryResponse {

    private Integer weekNumber;

    private BigDecimal bodyWeight;

    private BigDecimal waist;

    private BigDecimal hips;

    private BigDecimal thigh;

    private String bestSquat;

    private String bestHipThrust;

    private String bestPullMovement;

    private BigDecimal totalVolume;
}
