package com.aditya.gymtracker.storage;

import lombok.Getter;
import lombok.Setter;

/** Sheet 2 — Key Lifts (one row per week). */
@Getter
@Setter
public class KeyLiftWeek {

    private Integer week;
    private String pullUps;
    private String latPulldown;
    private String hipThrust;
    private String backSquat;
    private String rdl;
    private String legPress;
    private String ohp;
    private String inclineDbPress;
}
