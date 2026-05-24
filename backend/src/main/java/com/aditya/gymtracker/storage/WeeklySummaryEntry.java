package com.aditya.gymtracker.storage;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Sheet 4 — Weekly Summary (review row per week). */
@Getter
@Setter
public class WeeklySummaryEntry {

    private Integer week;
    private BigDecimal avgWeight;
    private BigDecimal waistNavel;
    private BigDecimal hipsGlutes;
    private BigDecimal thigh;
    private String bestSquat;
    private String bestHipThrust;
    private String bestPullOrLat;
    private Integer proteinDaysHit;
    private Integer calorieDaysHit;
    private String comment;
}
