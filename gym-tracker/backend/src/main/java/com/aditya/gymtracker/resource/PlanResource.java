package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.request.ImportPlanTextRequest;
import com.aditya.gymtracker.service.PlanService;
import com.aditya.gymtracker.storage.WorkoutPlan;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/plan")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlanResource {

    @Inject
    PlanService planService;

    @GET
    public WorkoutPlan getPlan() {
        return planService.getPlan();
    }

    @POST
    @Path("/import")
    public Response importPlan(WorkoutPlan plan) {
        try {
            WorkoutPlan saved = planService.importPlan(plan);
            return Response.ok(saved).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(e.getMessage())
                    .build();
        }
    }

    @POST
    @Path("/import/text")
    @Consumes(MediaType.TEXT_PLAIN)
    public Response importPlanTextPlain(String body) {
        return importPlanTextBody(body);
    }

    @POST
    @Path("/import/text")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response importPlanTextJson(ImportPlanTextRequest request) {
        return importPlanTextBody(request != null ? request.getText() : null);
    }

    private Response importPlanTextBody(String text) {
        try {
            if (text == null || text.isBlank()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("Plan text is empty")
                        .build();
            }
            WorkoutPlan saved = planService.importPlanText(text);
            return Response.ok(saved).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(e.getMessage())
                    .build();
        }
    }
}
