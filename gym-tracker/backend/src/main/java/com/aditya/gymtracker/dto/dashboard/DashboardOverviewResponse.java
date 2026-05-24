package com.aditya.gymtracker.dto.dashboard;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class DashboardOverviewResponse {

    private Integer totalWorkoutSessions;

    private Integer completedSessions;

    private Double completionPercentage;

    private BigDecimal latestWeight;

    private BigDecimal latestWaist;

    private BigDecimal latestHips;

    private Integer totalPRs;

    private List<String> latestPRMessages;
}
