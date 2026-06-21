package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.dashboard.ExerciseProgressResponse;
import com.aditya.gymtracker.dto.dashboard.WeeklyVolumeResponse;
import com.aditya.gymtracker.service.AnalyticsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/analytics")
@Produces(MediaType.APPLICATION_JSON)
public class AnalyticsResource {

    @Inject
    AnalyticsService analyticsService;

    @GET
    @Path("/exercise/{exerciseEntryId}")
    public List<ExerciseProgressResponse>
    getExerciseProgress(
            @PathParam("exerciseEntryId")
            Long exerciseEntryId
    ) {

        return analyticsService.getExerciseProgress(
                exerciseEntryId
        );
    }

    @GET
    @Path("/volume/{exerciseEntryId}")
    public List<WeeklyVolumeResponse>
    getWeeklyVolume(
            @PathParam("exerciseEntryId")
            Long exerciseEntryId
    ) {

        return analyticsService.getWeeklyVolume(
                exerciseEntryId
        );
    }

    @GET
    @Path("/by-name")
    public List<ExerciseProgressResponse> getProgressByName(
            @QueryParam("name") String name,
            @QueryParam("trainingDay") String trainingDay
    ) {
        return analyticsService.getProgressByExerciseName(name, trainingDay);
    }

    @GET
    @Path("/volume-by-name")
    public List<WeeklyVolumeResponse> getWeeklyVolumeByName(
            @QueryParam("name") String name,
            @QueryParam("trainingDay") String trainingDay
    ) {
        return analyticsService.getWeeklyVolumeByExerciseName(name, trainingDay);
    }
}

