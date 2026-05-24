package com.aditya.gymtracker.service;

import com.aditya.gymtracker.dto.dashboard.DashboardOverviewResponse;
import com.aditya.gymtracker.entity.BodyMeasurement;
import com.aditya.gymtracker.entity.PersonalRecord;
import com.aditya.gymtracker.entity.WorkoutSession;
import com.aditya.gymtracker.repository.BodyMeasurementRepository;
import com.aditya.gymtracker.repository.PersonalRecordRepository;
import com.aditya.gymtracker.repository.WorkoutSessionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class DashboardService {

    @Inject
    WorkoutSessionRepository workoutSessionRepository;

    @Inject
    BodyMeasurementRepository bodyMeasurementRepository;

    @Inject
    PersonalRecordRepository personalRecordRepository;

    public DashboardOverviewResponse getDashboard(
	    Long userId
    ) {

	DashboardOverviewResponse response =
		new DashboardOverviewResponse();

	List<WorkoutSession> sessions =
		workoutSessionRepository.findByUser(
			userId
		);

	int totalSessions = sessions.size();

	int completedSessions =
		(int) sessions.stream()
			.filter(WorkoutSession::getCompleted)
			.count();

	double completionPercentage =
		totalSessions == 0
			? 0
			: ((double) completedSessions / totalSessions) * 100;

	response.setTotalWorkoutSessions(
		totalSessions
	);

	response.setCompletedSessions(
		completedSessions
	);

	response.setCompletionPercentage(
		completionPercentage
	);

	BodyMeasurement latestMeasurement =
		bodyMeasurementRepository.findLatest(
			userId
		);

	if (latestMeasurement != null) {

	    response.setLatestWeight(
		    latestMeasurement.getBodyWeight()
	    );

	    response.setLatestWaist(
		    latestMeasurement.getWaistNavel()
	    );

	    response.setLatestHips(
		    latestMeasurement.getHips()
	    );
	}

	List<PersonalRecord> latestPRs =
		personalRecordRepository.findLatestPRs();

	response.setTotalPRs(
		latestPRs.size()
	);

	List<String> prMessages =
		latestPRs.stream()
			.map(pr ->
				pr.getExerciseDefinition()
					.getExerciseName()
					+ " - "
					+ pr.getPrType()
			)
			.toList();

	response.setLatestPRMessages(
		prMessages
	);

	return response;
    }
}
