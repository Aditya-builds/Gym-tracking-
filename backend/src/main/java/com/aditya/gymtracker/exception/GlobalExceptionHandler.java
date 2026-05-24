package com.aditya.gymtracker.exception;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Provider
public class GlobalExceptionHandler
    implements ExceptionMapper<Exception> {

    @Override
    public Response toResponse(Exception exception) {

    Map<String, Object> error =
        new HashMap<>();

    error.put("timestamp", Instant.now());

    error.put("message",
        exception.getMessage());

    error.put("exception",
        exception.getClass().getSimpleName());

    Response.Status status =
        Response.Status.INTERNAL_SERVER_ERROR;

    if (exception instanceof ResourceNotFoundException) {
        status = Response.Status.NOT_FOUND;
    }

    return Response.status(status)
        .entity(error)
        .type(MediaType.APPLICATION_JSON)
        .build();
    }
}
