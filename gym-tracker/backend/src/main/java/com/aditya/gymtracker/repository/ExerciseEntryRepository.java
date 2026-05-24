package com.aditya.gymtracker.repository;

import com.aditya.gymtracker.entity.ExerciseEntry;
import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ExerciseEntryRepository {

    @Inject
    JsonDataStore store;

    public void persist(ExerciseEntry entry) throws IOException {
        GymDataRoot data = store.snapshot();
        if (entry.getId() == null) {
            entry.setId(store.nextId("exerciseEntries"));
        }
        if (entry.getWorkoutSession() != null) {
            entry.setWorkoutSessionId(entry.getWorkoutSession().getId());
        }
        if (entry.getExerciseDefinition() != null) {
            entry.setExerciseDefinitionId(entry.getExerciseDefinition().getId());
        }
        data.getExerciseEntries().add(entry);
        store.save();
    }

    public List<ExerciseEntry> findByWorkoutSession(Long sessionId) {
        return store.snapshot().getExerciseEntries().stream()
                .filter(e -> sessionId.equals(e.getWorkoutSessionId()))
                .sorted(Comparator.comparing(
                        e -> e.getOrderIndex() != null ? e.getOrderIndex() : 0))
                .toList();
    }

    public Optional<ExerciseEntry> findByIdOptional(Long id) {
        return store.snapshot().getExerciseEntries().stream()
                .filter(e -> e.getId().equals(id))
                .findFirst();
    }
}
