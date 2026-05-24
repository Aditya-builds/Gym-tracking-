package com.aditya.gymtracker.util;

import java.math.BigDecimal;

public class VolumeCalculator {

    private VolumeCalculator() {
    }

    public static BigDecimal calculate(
            BigDecimal weight,
            Integer reps
    ) {

        if (weight == null || reps == null) {
            return BigDecimal.ZERO;
        }

        return weight.multiply(
                BigDecimal.valueOf(reps)
        );
    }
}
