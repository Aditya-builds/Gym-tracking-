package com.aditya.gymtracker.dto.dashboard;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class WeeklyVolumeResponse {

    private Integer weekNumber;

    private BigDecimal totalVolume;
}
