package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.request.CreateBodyMeasurementRequest;
import com.aditya.gymtracker.dto.response.BodyMeasurementResponse;
import com.aditya.gymtracker.entity.BodyMeasurement;
import com.aditya.gymtracker.mapper.MeasurementMapper;
import com.aditya.gymtracker.service.MeasurementService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/measurements")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MeasurementResource {

    private static final Long DEFAULT_USER_ID = 1L;

    @Inject
    MeasurementService measurementService;

    @POST
    public Response createMeasurement(
            @Valid CreateBodyMeasurementRequest request
    ) {

        BodyMeasurement measurement =
                measurementService.createMeasurement(
                        DEFAULT_USER_ID,
                        request
                );

        BodyMeasurementResponse response =
                MeasurementMapper.toResponse(
                        measurement
                );

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @GET
    public List<BodyMeasurementResponse> getAllMeasurements() {

        return measurementService.getAllMeasurements(
                        DEFAULT_USER_ID
                )
                .stream()
                .map(MeasurementMapper::toResponse)
                .toList();
    }

    @GET
    @Path("/latest")
    public BodyMeasurementResponse getLatestMeasurement() {

        return MeasurementMapper.toResponse(
                measurementService.getLatestMeasurement(
                        DEFAULT_USER_ID
                )
        );
    }
}
