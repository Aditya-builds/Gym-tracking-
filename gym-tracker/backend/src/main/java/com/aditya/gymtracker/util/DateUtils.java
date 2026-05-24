package com.aditya.gymtracker.util;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.Locale;

public class DateUtils {

    private DateUtils() {
    }

    public static int getWeekNumber(
            LocalDate date
    ) {

        return date.get(
                WeekFields.of(Locale.getDefault())
                        .weekOfWeekBasedYear()
        );
    }
}

