package com.aditya.gymtracker.util;

import java.math.BigDecimal;

public class OneRMCalculator {

    private OneRMCalculator() {
    }

    public static Double estimate(
            BigDecimal weight,
            Integer reps
    ) {

        if (weight == null || reps == null) {
            return 0.0;
        }

        return weight.doubleValue()
                * (1 + (reps / 30.0));
    }
}
