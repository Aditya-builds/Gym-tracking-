package com.aditya.gymtracker.repository;

import com.aditya.gymtracker.entity.SetEntry;
import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@ApplicationScoped
public class SetEntryRepository {

    @Inject
    JsonDataStore store;

    public void persist(SetEntry setEntry) throws IOException {
        GymDataRoot data = store.snapshot();
        if (setEntry.getId() == null) {
            setEntry.setId(store.nextId("setEntries"));
        }
        if (setEntry.getExerciseEntry() != null) {
            setEntry.setExerciseEntryId(setEntry.getExerciseEntry().getId());
        }
        if (setEntry.getCreatedAt() == null) {
            setEntry.setCreatedAt(Instant.now());
        }
        data.getSetEntries().add(setEntry);
        store.save();
    }

    public List<SetEntry> findByExerciseEntry(Long exerciseEntryId) {
        return store.snapshot().getSetEntries().stream()
                .filter(s -> exerciseEntryId.equals(s.getExerciseEntryId()))
                .sorted(Comparator.comparing(SetEntry::getSetNumber))
                .toList();
    }

    public List<SetEntry> listAll() {
        return store.snapshot().getSetEntries();
    }

    public List<SetEntry> listAllForUser(Long userId) {
        return store.setsForUser(userId);
    }

    public List<SetEntry> findPrSets() {
        return store.snapshot().getSetEntries().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsPr()))
                .sorted(Comparator.comparing(SetEntry::getCreatedAt).reversed())
                .toList();
    }
}
