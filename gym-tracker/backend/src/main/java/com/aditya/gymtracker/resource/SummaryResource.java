package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.dashboard.WeeklySummaryResponse;
import com.aditya.gymtracker.service.SummaryService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/summary")
@Produces(MediaType.APPLICATION_JSON)
public class SummaryResource {

    private static final Long DEFAULT_USER_ID = 1L;

    @Inject
    SummaryService summaryService;

    @GET
    @Path("/weekly")
    public List<WeeklySummaryResponse>
    getWeeklySummary() {

        return summaryService.getWeeklySummary(
                DEFAULT_USER_ID
        );
    }
}

