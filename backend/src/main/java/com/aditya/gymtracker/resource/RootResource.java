package com.aditya.gymtracker.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/")
public class RootResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response root() {
        return Response.ok(Map.of(
                "name", "Gym Tracker API",
                "status", "running",
                "message", "This is the backend API — open the web or mobile UI to use the app.",
                "ui", Map.of(
                        "web", "http://localhost:3000",
                        "mobile", "http://localhost:8082"
                ),
                "docs", "http://localhost:8080/q/swagger-ui",
                "healthCheck", "/api/dashboard"
        )).build();
    }
}
