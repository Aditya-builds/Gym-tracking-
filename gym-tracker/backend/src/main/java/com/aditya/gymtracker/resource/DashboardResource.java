package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.dto.dashboard.DashboardOverviewResponse;
import com.aditya.gymtracker.service.DashboardService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

	private static final Long DEFAULT_USER_ID = 1L;

	@Inject
	DashboardService dashboardService;

	@GET
	public DashboardOverviewResponse getDashboard() {

		return dashboardService.getDashboard(
				DEFAULT_USER_ID
		);
	}
}
