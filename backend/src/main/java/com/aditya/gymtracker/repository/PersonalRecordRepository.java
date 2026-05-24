package com.aditya.gymtracker.repository;

import com.aditya.gymtracker.entity.PersonalRecord;
import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@ApplicationScoped
public class PersonalRecordRepository {

    @Inject
    JsonDataStore store;

    public void persist(PersonalRecord pr) throws IOException {
        GymDataRoot data = store.snapshot();
        if (pr.getId() == null) {
            pr.setId(store.nextId("personalRecords"));
        }
        if (pr.getExerciseDefinition() != null) {
            pr.setExerciseDefinitionId(pr.getExerciseDefinition().getId());
        }
        if (pr.getSetEntry() != null) {
            pr.setSetEntryId(pr.getSetEntry().getId());
        }
        if (pr.getCreatedAt() == null) {
            pr.setCreatedAt(Instant.now());
        }
        data.getPersonalRecords().add(pr);
        store.save();
    }

    public List<PersonalRecord> findByExercise(Long exerciseDefinitionId) {
        return store.snapshot().getPersonalRecords().stream()
                .filter(pr -> exerciseDefinitionId.equals(pr.getExerciseDefinitionId()))
                .sorted(Comparator.comparing(PersonalRecord::getCreatedAt).reversed())
                .toList();
    }

    public List<PersonalRecord> findLatestPRs() {
        return store.snapshot().getPersonalRecords().stream()
                .sorted(Comparator.comparing(PersonalRecord::getCreatedAt).reversed())
                .limit(10)
                .toList();
    }
}
