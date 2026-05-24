package com.aditya.gymtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class PersonalRecord {

    private Long id;
    private Long exerciseDefinitionId;
    private Long setEntryId;

    @JsonIgnore
    private ExerciseDefinition exerciseDefinition;

    @JsonIgnore
    private SetEntry setEntry;

    private String prType;
    private BigDecimal previousValue;
    private BigDecimal newValue;
    private Instant createdAt;
}
