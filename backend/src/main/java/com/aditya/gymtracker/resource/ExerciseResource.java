package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.request.CreateExerciseEntryRequest;
import com.aditya.gymtracker.dto.response.ExerciseEntryResponse;
import com.aditya.gymtracker.mapper.ExerciseEntryMapper;
import com.aditya.gymtracker.service.ExerciseService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/exercises")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExerciseResource {

    @Inject
    ExerciseService exerciseService;

    @POST
    public Response createExerciseEntry(
            CreateExerciseEntryRequest request
    ) {

        ExerciseEntryResponse response =
                ExerciseEntryMapper.toResponse(
                        exerciseService.createExerciseEntry(
                                request
                        )
                );

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @GET
    @Path("/session/{sessionId}")
    public List<ExerciseEntryResponse> getExercisesBySession(
            @PathParam("sessionId") Long sessionId
    ) {

        return exerciseService.getExercisesBySession(
                        sessionId
                )
                .stream()
                .map(ExerciseEntryMapper::toResponse)
                .toList();
    }
}
