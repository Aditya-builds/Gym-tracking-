package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.request.CreateSetEntryRequest;
import com.aditya.gymtracker.entity.ExerciseEntry;
import com.aditya.gymtracker.entity.SetEntry;
import com.aditya.gymtracker.exception.ResourceNotFoundException;
import com.aditya.gymtracker.repository.ExerciseEntryRepository;
import com.aditya.gymtracker.repository.SetEntryRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.util.List;

@ApplicationScoped
public class SetService {

    @Inject
    SetEntryRepository setEntryRepository;

    @Inject
    ExerciseEntryRepository exerciseEntryRepository;

    @Inject
    PRService prService;

    public SetEntry createSetEntry(
            CreateSetEntryRequest request
    ) {

        ExerciseEntry exerciseEntry =
                exerciseEntryRepository.findByIdOptional(
                        request.getExerciseEntryId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Exercise entry not found"
                        ));

        SetEntry setEntry = new SetEntry();

        setEntry.setExerciseEntry(exerciseEntry);

        setEntry.setSetNumber(
                request.getSetNumber()
        );

        setEntry.setWeight(
                request.getWeight()
        );

        setEntry.setReps(
                request.getReps()
        );

        setEntry.setRir(
                request.getRir()
        );

        setEntry.setNotes(
                request.getNotes()
        );

        try {
            setEntryRepository.persist(setEntry);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save set", e);
        }

        boolean isPr =
                prService.checkAndCreatePR(setEntry);

        setEntry.setIsPr(isPr);

        return setEntry;
    }

    public List<SetEntry> getSetsByExerciseEntry(
            Long exerciseEntryId
    ) {

        return setEntryRepository.findByExerciseEntry(
                exerciseEntryId
        );
    }
}
