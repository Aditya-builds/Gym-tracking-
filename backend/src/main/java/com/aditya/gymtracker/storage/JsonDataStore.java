package com.aditya.gymtracker.storage;

import com.aditya.gymtracker.entity.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class JsonDataStore {

    @ConfigProperty(name = "gym.data.file", defaultValue = "data/gym-data.json")
    String dataFilePath;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private GymDataRoot data = new GymDataRoot();
    private final Object lock = new Object();

    void onStart(@Observes StartupEvent event) throws IOException {
        load();
    }

    public GymDataRoot snapshot() {
        synchronized (lock) {
            hydrateAll();
            return data;
        }
    }

    public void load() throws IOException {
        synchronized (lock) {
            Path path = resolvePath();
            if (!Files.exists(path)) {
                copySeed(path);
            }
            data = mapper.readValue(path.toFile(), GymDataRoot.class);
            hydrateAll();
        }
    }

    public void save() throws IOException {
        synchronized (lock) {
            syncForeignKeys();
            Path path = resolvePath();
            Files.createDirectories(path.getParent());
            Path temp = path.resolveSibling(path.getFileName() + ".tmp");
            mapper.writerWithDefaultPrettyPrinter().writeValue(temp.toFile(), data);
            Files.move(temp, path, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        }
    }

    public void replaceAll(GymDataRoot newData) throws IOException {
        synchronized (lock) {
            this.data = newData != null ? newData : new GymDataRoot();
            hydrateAll();
            save();
        }
    }

    public long nextId(String collection) {
        return switch (collection) {
            case "users" -> data.getUsers().stream().mapToLong(User::getId).max().orElse(0) + 1;
            case "exerciseDefinitions" ->
                    data.getExerciseDefinitions().stream().mapToLong(ExerciseDefinition::getId).max().orElse(0) + 1;
            case "workoutSessions" ->
                    data.getWorkoutSessions().stream().mapToLong(WorkoutSession::getId).max().orElse(0) + 1;
            case "exerciseEntries" ->
                    data.getExerciseEntries().stream().mapToLong(ExerciseEntry::getId).max().orElse(0) + 1;
            case "setEntries" -> data.getSetEntries().stream().mapToLong(SetEntry::getId).max().orElse(0) + 1;
            case "bodyMeasurements" ->
                    data.getBodyMeasurements().stream().mapToLong(BodyMeasurement::getId).max().orElse(0) + 1;
            case "personalRecords" ->
                    data.getPersonalRecords().stream().mapToLong(PersonalRecord::getId).max().orElse(0) + 1;
            default -> throw new IllegalArgumentException("Unknown collection: " + collection);
        };
    }

    public void hydrateAll() {
        Map<Long, User> users = data.getUsers().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
        Map<Long, ExerciseDefinition> definitions = data.getExerciseDefinitions().stream()
                .collect(Collectors.toMap(ExerciseDefinition::getId, d -> d, (a, b) -> a));
        Map<Long, WorkoutSession> sessions = data.getWorkoutSessions().stream()
                .collect(Collectors.toMap(WorkoutSession::getId, s -> s, (a, b) -> a));
        Map<Long, ExerciseEntry> entries = data.getExerciseEntries().stream()
                .collect(Collectors.toMap(ExerciseEntry::getId, e -> e, (a, b) -> a));

        for (WorkoutSession session : data.getWorkoutSessions()) {
            session.setUser(users.get(session.getUserId()));
        }
        for (ExerciseEntry entry : data.getExerciseEntries()) {
            entry.setWorkoutSession(sessions.get(entry.getWorkoutSessionId()));
            entry.setExerciseDefinition(definitions.get(entry.getExerciseDefinitionId()));
        }
        for (SetEntry set : data.getSetEntries()) {
            set.setExerciseEntry(entries.get(set.getExerciseEntryId()));
        }
        for (BodyMeasurement m : data.getBodyMeasurements()) {
            m.setUser(users.get(m.getUserId()));
        }
        for (PersonalRecord pr : data.getPersonalRecords()) {
            pr.setExerciseDefinition(definitions.get(pr.getExerciseDefinitionId()));
            pr.setSetEntry(data.getSetEntries().stream()
                    .filter(s -> s.getId().equals(pr.getSetEntryId()))
                    .findFirst().orElse(null));
        }
    }

    public void deleteWorkoutSession(Long sessionId) throws IOException {
        synchronized (lock) {
            List<Long> entryIds = data.getExerciseEntries().stream()
                    .filter(e -> sessionId.equals(e.getWorkoutSessionId()))
                    .map(ExerciseEntry::getId)
                    .toList();

            List<Long> setIds = data.getSetEntries().stream()
                    .filter(s -> entryIds.contains(s.getExerciseEntryId()))
                    .map(SetEntry::getId)
                    .toList();

            data.getPersonalRecords().removeIf(pr -> setIds.contains(pr.getSetEntryId()));
            data.getSetEntries().removeIf(s -> entryIds.contains(s.getExerciseEntryId()));
            data.getExerciseEntries().removeIf(e -> sessionId.equals(e.getWorkoutSessionId()));
            data.getWorkoutSessions().removeIf(s -> sessionId.equals(s.getId()));
            save();
        }
    }

    public List<SetEntry> setsForUser(Long userId) {
        hydrateAll();
        Set<Long> sessionIds = data.getWorkoutSessions().stream()
                .filter(s -> userId.equals(s.getUserId()))
                .map(WorkoutSession::getId)
                .collect(Collectors.toSet());
        Set<Long> entryIds = data.getExerciseEntries().stream()
                .filter(e -> sessionIds.contains(e.getWorkoutSessionId()))
                .map(ExerciseEntry::getId)
                .collect(Collectors.toSet());
        return data.getSetEntries().stream()
                .filter(s -> entryIds.contains(s.getExerciseEntryId()))
                .sorted(Comparator.comparing(SetEntry::getSetNumber))
                .toList();
    }

    private void syncForeignKeys() {
        for (WorkoutSession session : data.getWorkoutSessions()) {
            if (session.getUser() != null) {
                session.setUserId(session.getUser().getId());
            }
            if (session.getCreatedAt() == null) {
                session.setCreatedAt(Instant.now());
            }
        }
        for (ExerciseEntry entry : data.getExerciseEntries()) {
            if (entry.getWorkoutSession() != null) {
                entry.setWorkoutSessionId(entry.getWorkoutSession().getId());
            }
            if (entry.getExerciseDefinition() != null) {
                entry.setExerciseDefinitionId(entry.getExerciseDefinition().getId());
            }
        }
        for (SetEntry set : data.getSetEntries()) {
            if (set.getExerciseEntry() != null) {
                set.setExerciseEntryId(set.getExerciseEntry().getId());
            }
            if (set.getCreatedAt() == null) {
                set.setCreatedAt(Instant.now());
            }
        }
        for (BodyMeasurement m : data.getBodyMeasurements()) {
            if (m.getUser() != null) {
                m.setUserId(m.getUser().getId());
            }
            if (m.getCreatedAt() == null) {
                m.setCreatedAt(Instant.now());
            }
        }
        for (PersonalRecord pr : data.getPersonalRecords()) {
            if (pr.getExerciseDefinition() != null) {
                pr.setExerciseDefinitionId(pr.getExerciseDefinition().getId());
            }
            if (pr.getSetEntry() != null) {
                pr.setSetEntryId(pr.getSetEntry().getId());
            }
            if (pr.getCreatedAt() == null) {
                pr.setCreatedAt(Instant.now());
            }
        }
        for (User user : data.getUsers()) {
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(Instant.now());
            }
        }
    }

    private Path resolvePath() {
        Path configured = Path.of(dataFilePath);
        if (configured.isAbsolute()) {
            return configured.normalize();
        }
        Path cwd = Path.of("").toAbsolutePath().normalize();
        Path inCwd = cwd.resolve(configured).normalize();
        Path inBackend = cwd.resolve("backend").resolve(configured).normalize();

        if (Files.exists(inCwd)) {
            return inCwd;
        }
        if (Files.exists(inBackend)) {
            return inBackend;
        }
        if (Files.exists(cwd.resolve("backend").resolve("pom.xml"))) {
            return inBackend;
        }
        return inCwd;
    }

    private void copySeed(Path target) throws IOException {
        Files.createDirectories(target.getParent());
        try (InputStream in = getClass().getResourceAsStream("/data/seed.json")) {
            if (in == null) {
                throw new IOException("Missing classpath seed: /data/seed.json");
            }
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
