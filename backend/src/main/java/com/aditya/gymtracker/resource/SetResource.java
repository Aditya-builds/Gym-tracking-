package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.request.CreateSetEntryRequest;
import com.aditya.gymtracker.dto.response.SetEntryResponse;
import com.aditya.gymtracker.mapper.SetEntryMapper;
import com.aditya.gymtracker.service.SetService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/sets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SetResource {

    @Inject
    SetService setService;

    @POST
    public Response createSetEntry(
            @Valid CreateSetEntryRequest request
    ) {

        SetEntryResponse response =
                SetEntryMapper.toResponse(
                        setService.createSetEntry(
                                request
                        )
                );

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @GET
    @Path("/exercise/{exerciseEntryId}")
    public List<SetEntryResponse> getSetsByExercise(
            @PathParam("exerciseEntryId")
            Long exerciseEntryId
    ) {

        return setService.getSetsByExerciseEntry(
                        exerciseEntryId
                )
                .stream()
                .map(SetEntryMapper::toResponse)
                .toList();
    }
}
