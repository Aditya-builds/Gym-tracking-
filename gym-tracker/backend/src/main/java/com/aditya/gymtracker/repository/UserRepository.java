package com.aditya.gymtracker.repository;

import com.aditya.gymtracker.entity.User;
import com.aditya.gymtracker.storage.GymDataRoot;
import com.aditya.gymtracker.storage.JsonDataStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

@ApplicationScoped
public class UserRepository {

    @Inject
    JsonDataStore store;

    public Optional<User> findByIdOptional(Long id) {
        GymDataRoot data = store.snapshot();
        return data.getUsers().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst();
    }
}
