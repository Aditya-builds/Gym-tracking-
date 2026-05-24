package com.aditya.gymtracker.resource;

import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/backup")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BackupResource {

    @Inject
    JsonDataStore store;

    @GET
    @Path("/export")
    public GymDataRoot exportAll() {
        return store.snapshot();
    }

    @POST
    @Path("/import")
    public Response importAll(GymDataRoot data) {
        try {
            store.replaceAll(data);
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(e.getMessage())
                    .build();
        }
    }
}
