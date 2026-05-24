package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.request.CreateWorkoutSessionRequest;
import com.aditya.gymtracker.dto.response.WorkoutSessionResponse;
import com.aditya.gymtracker.entity.WorkoutSession;
import com.aditya.gymtracker.mapper.WorkoutMapper;
import com.aditya.gymtracker.service.WorkoutService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/workouts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkoutResource {

    private static final Long DEFAULT_USER_ID = 1L;

    @Inject
    WorkoutService workoutService;

    @POST
    public Response createWorkoutSession(
            @Valid CreateWorkoutSessionRequest request
    ) {

        WorkoutSession session =
                workoutService.createWorkoutSession(
                        DEFAULT_USER_ID,
                        request
                );

        WorkoutSessionResponse response =
                WorkoutMapper.toResponse(session);

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @GET
    public List<WorkoutSessionResponse> getAllSessions() {

        return workoutService.getAllSessions(
                        DEFAULT_USER_ID
                )
                .stream()
                .map(WorkoutMapper::toResponse)
                .toList();
    }

    @GET
    @Path("/{id}")
    public WorkoutSessionResponse getSessionById(
            @PathParam("id") Long id
    ) {

        return WorkoutMapper.toResponse(
                workoutService.getSessionById(id)
        );
    }

    @DELETE
    @Path("/{id}")
    public Response deleteSession(
            @PathParam("id") Long id
    ) {

        workoutService.deleteSession(id);

        return Response.noContent().build();
    }
}
