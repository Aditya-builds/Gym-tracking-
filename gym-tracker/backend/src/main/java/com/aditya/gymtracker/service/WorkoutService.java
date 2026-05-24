package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.request.CreateWorkoutSessionRequest;
import com.aditya.gymtracker.entity.User;
import com.aditya.gymtracker.entity.WorkoutSession;
import com.aditya.gymtracker.exception.ResourceNotFoundException;
import com.aditya.gymtracker.repository.WorkoutSessionRepository;
import com.aditya.gymtracker.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class WorkoutService {

    @Inject
    WorkoutSessionRepository workoutSessionRepository;

    @Inject
    UserRepository userRepository;

    public WorkoutSession createWorkoutSession(
            Long userId,
            CreateWorkoutSessionRequest request
    ) {

        User user = userRepository.findByIdOptional(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        ));

        WorkoutSession session = new WorkoutSession();

        session.setUser(user);
        session.setUserId(user.getId());

        session.setWorkoutDate(
                request.getWorkoutDate()
        );

        session.setWeekNumber(
                request.getWeekNumber()
        );

        session.setTrainingDay(
                request.getTrainingDay()
        );

        session.setDurationMinutes(
                request.getDurationMinutes()
        );

        session.setEnergyLevel(
                request.getEnergyLevel()
        );

        session.setCompleted(
                request.getCompleted() != null
                        ? request.getCompleted()
                        : true
        );

        session.setSessionNotes(
                request.getSessionNotes()
        );

        persistSession(session);

        return session;
    }

    private void persistSession(WorkoutSession session) {
        try {
            workoutSessionRepository.persist(session);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save workout session", e);
        }
    }

    public List<WorkoutSession> getAllSessions(
            Long userId
    ) {

        return workoutSessionRepository.findByUser(userId);
    }

    public List<WorkoutSession> getSessionsByWeek(
            Long userId,
            Integer weekNumber
    ) {

        return workoutSessionRepository.findByWeek(
                userId,
                weekNumber
        );
    }

    public List<WorkoutSession> getSessionsByDateRange(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    ) {

        return workoutSessionRepository.findByDateRange(
                userId,
                startDate,
                endDate
        );
    }

    public WorkoutSession getSessionById(
            Long sessionId
    ) {

        return workoutSessionRepository.findByIdOptional(sessionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Workout session not found with id: " + sessionId
                        ));
    }

    public void deleteSession(Long sessionId) {

        WorkoutSession session =
                getSessionById(sessionId);

        try {
            workoutSessionRepository.delete(session);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete workout session", e);
        }
    }
}
 
