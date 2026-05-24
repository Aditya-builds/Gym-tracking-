package com.aditya.gymtracker.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateSetEntryRequest {

    @NotNull
    private Long exerciseEntryId;

    @NotNull
    @Min(1)
    private Integer setNumber;

    @Positive
    private BigDecimal weight;

    @Positive
    private Integer reps;

    @Min(0)
    @Max(5)
    private Integer rir;
}
