package com.aditya.gymtracker.repository;

import com.aditya.gymtracker.entity.WorkoutSession;
import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class WorkoutSessionRepository {

    @Inject
    JsonDataStore store;

    public void persist(WorkoutSession session) throws IOException {
        GymDataRoot data = store.snapshot();
        if (session.getId() == null) {
            session.setId(store.nextId("workoutSessions"));
        }
        if (session.getUser() != null) {
            session.setUserId(session.getUser().getId());
        }
        if (session.getCreatedAt() == null) {
            session.setCreatedAt(Instant.now());
        }
        data.getWorkoutSessions().add(session);
        store.save();
    }

    public List<WorkoutSession> findByUser(Long userId) {
        return store.snapshot().getWorkoutSessions().stream()
                .filter(s -> userId.equals(s.getUserId()))
                .sorted(Comparator.comparing(WorkoutSession::getWorkoutDate).reversed())
                .toList();
    }

    public List<WorkoutSession> findByWeek(Long userId, Integer weekNumber) {
        return store.snapshot().getWorkoutSessions().stream()
                .filter(s -> userId.equals(s.getUserId()) && weekNumber.equals(s.getWeekNumber()))
                .sorted(Comparator.comparing(WorkoutSession::getWorkoutDate).reversed())
                .toList();
    }

    public List<WorkoutSession> findByDateRange(Long userId, LocalDate start, LocalDate end) {
        return store.snapshot().getWorkoutSessions().stream()
                .filter(s -> userId.equals(s.getUserId())
                        && !s.getWorkoutDate().isBefore(start)
                        && !s.getWorkoutDate().isAfter(end))
                .sorted(Comparator.comparing(WorkoutSession::getWorkoutDate))
                .toList();
    }

    public Optional<WorkoutSession> findByIdOptional(Long id) {
        return store.snapshot().getWorkoutSessions().stream()
                .filter(s -> s.getId().equals(id))
                .findFirst();
    }

    public void delete(WorkoutSession session) throws IOException {
        store.deleteWorkoutSession(session.getId());
    }
}
