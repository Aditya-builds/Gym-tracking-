package com.aditya.gymtracker.service;

import com.aditya.gymtracker.entity.ExerciseDefinition;
import com.aditya.gymtracker.entity.PersonalRecord;
import com.aditya.gymtracker.entity.SetEntry;
import com.aditya.gymtracker.repository.PersonalRecordRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@ApplicationScoped
public class PRService {

    @Inject
    PersonalRecordRepository personalRecordRepository;

    public boolean checkAndCreatePR(
            SetEntry setEntry
    ) {

        ExerciseDefinition definition =
                setEntry.getExerciseEntry()
                        .getExerciseDefinition();

        List<PersonalRecord> existingPRs =
                personalRecordRepository.findByExercise(
                        definition.getId()
                );

        BigDecimal currentVolume =
                setEntry.calculateVolume();

        BigDecimal bestVolume =
                existingPRs.stream()
                        .map(PersonalRecord::getNewValue)
                        .max(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

        if (currentVolume.compareTo(bestVolume) > 0) {

            PersonalRecord pr =
                    new PersonalRecord();

            pr.setExerciseDefinition(
                    definition
            );

            pr.setSetEntry(setEntry);

            pr.setPrType("VOLUME_PR");

            pr.setPreviousValue(bestVolume);

            pr.setNewValue(currentVolume);

            try {
                personalRecordRepository.persist(pr);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save PR", e);
            }

            return true;
        }

        return false;
    }
}

