package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.request.CreateExerciseEntryRequest;
import com.aditya.gymtracker.entity.ExerciseDefinition;
import com.aditya.gymtracker.entity.ExerciseEntry;
import com.aditya.gymtracker.entity.WorkoutSession;
import com.aditya.gymtracker.exception.ResourceNotFoundException;
import com.aditya.gymtracker.repository.ExerciseEntryRepository;
import com.aditya.gymtracker.repository.ExerciseDefinitionRepository;
import com.aditya.gymtracker.repository.WorkoutSessionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.util.List;

@ApplicationScoped
public class ExerciseService {

    @Inject
    ExerciseEntryRepository exerciseEntryRepository;

    @Inject
    WorkoutSessionRepository workoutSessionRepository;

    @Inject
    ExerciseDefinitionRepository exerciseDefinitionRepository;

    public ExerciseEntry createExerciseEntry(
            CreateExerciseEntryRequest request
    ) {

        WorkoutSession session =
                workoutSessionRepository.findByIdOptional(
                        request.getWorkoutSessionId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Workout session not found"
                        ));

        ExerciseDefinition definition =
                exerciseDefinitionRepository.findByIdOptional(
                        request.getExerciseDefinitionId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Exercise definition not found"
                        ));

        ExerciseEntry entry = new ExerciseEntry();

        entry.setWorkoutSession(session);

        entry.setExerciseDefinition(definition);

        entry.setOrderIndex(
                request.getOrderIndex()
        );

        entry.setExerciseNotes(
                request.getExerciseNotes()
        );

        try {
            exerciseEntryRepository.persist(entry);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save exercise entry", e);
        }

        return entry;
    }

    public List<ExerciseEntry> getExercisesBySession(
            Long sessionId
    ) {

        return exerciseEntryRepository.findByWorkoutSession(
                sessionId
        );
    }
}
