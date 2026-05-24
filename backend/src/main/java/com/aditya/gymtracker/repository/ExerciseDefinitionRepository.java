package com.aditya.gymtracker.repository;

import com.aditya.gymtracker.entity.ExerciseDefinition;
import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

@ApplicationScoped
public class ExerciseDefinitionRepository {

    @Inject
    JsonDataStore store;

    public Optional<ExerciseDefinition> findByIdOptional(Long id) {
        GymDataRoot data = store.snapshot();
        return data.getExerciseDefinitions().stream()
                .filter(d -> d.getId().equals(id))
                .findFirst();
    }
}
