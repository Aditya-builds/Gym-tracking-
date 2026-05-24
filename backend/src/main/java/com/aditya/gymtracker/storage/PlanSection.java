package com.aditya.gymtracker.storage;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PlanSection {

    private String name;
    private List<PlanExercise> exercises = new ArrayList<>();
}
