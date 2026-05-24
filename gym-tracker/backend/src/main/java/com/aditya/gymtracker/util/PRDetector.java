package com.aditya.gymtracker.util;

import java.math.BigDecimal;

public class PRDetector {

    private PRDetector() {
    }

    public static boolean isNewPR(
            BigDecimal current,
            BigDecimal previousBest
    ) {

        if (current == null) {
            return false;
        }

        if (previousBest == null) {
            return true;
        }

        return current.compareTo(previousBest) > 0;
    }
}
