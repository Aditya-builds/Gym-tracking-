import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { colors } from "../theme/colors";

import {
  createExerciseEntry,
  createSetEntry,
  createWorkoutSession,
  EXERCISE_DEFINITIONS,
  ExerciseEntry,
  getExercisesBySession,
  getSetsByExercise,
  getWorkoutSessions,
  SetEntry,
  TRAINING_DAYS,
  WorkoutSession,
} from "../api/workoutApi";
import {
  getExercisesForDay,
  getWorkoutPlan,
  PlanExercise,
  WorkoutPlan,
} from "../api/planApi";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkoutScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(
    null
  );
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [setsByExercise, setSetsByExercise] = useState<
    Record<number, SetEntry[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [trainingDay, setTrainingDay] = useState<string>(TRAINING_DAYS[0]);
  const [weekNumber, setWeekNumber] = useState("1");
  const [workoutDate, setWorkoutDate] = useState(todayIso());

  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null
  );
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");

  const loadSessions = useCallback(async () => {
    const data = await getWorkoutSessions();
    setSessions(data);
  }, []);

  const loadSessionDetails = useCallback(async (session: WorkoutSession) => {
    const exerciseList = await getExercisesBySession(session.id);
    setExercises(exerciseList);

    const setsMap: Record<number, SetEntry[]> = {};
    await Promise.all(
      exerciseList.map(async (exercise) => {
        setsMap[exercise.id] = await getSetsByExercise(exercise.id);
      })
    );
    setSetsByExercise(setsMap);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [_, plan] = await Promise.all([loadSessions(), getWorkoutPlan()]);
        setWorkoutPlan(plan);
        if (plan?.days?.length) {
          setTrainingDay(plan.days[0].label);
        } else if (plan?.trainingDays?.length) {
          setTrainingDay(plan.trainingDays[0]);
        }
      } catch (error) {
        console.error("Failed to load workouts", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSessions]);

  const dayOptions =
    workoutPlan?.days?.map((d) => d.label) ||
    workoutPlan?.trainingDays ||
    [...TRAINING_DAYS];

  const planExercisesForDay = getExercisesForDay(workoutPlan, trainingDay);

  const resolveDefinitionId = (name: string) => {
    const fromPlan = workoutPlan?.exercises?.find(
      (e) => e.exerciseName?.toLowerCase() === name.toLowerCase()
    );
    if (fromPlan?.id) return fromPlan.id;
    const fromSeed = EXERCISE_DEFINITIONS.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );
    return fromSeed?.id ?? 1;
  };

  const startWorkout = async () => {
    const week = parseInt(weekNumber, 10);
    if (!trainingDay || Number.isNaN(week) || week < 1) {
      Alert.alert("Invalid input", "Pick a training day and week number.");
      return;
    }

    setSaving(true);
    try {
      const session = await createWorkoutSession({
        workoutDate,
        weekNumber: week,
        trainingDay,
        completed: false,
      });
      setActiveSession(session);
      setExercises([]);
      setSetsByExercise({});
      await loadSessions();
    } catch (error) {
      console.error("Start workout failed", error);
      Alert.alert("Error", "Could not start workout. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  const openSession = async (session: WorkoutSession) => {
    setSaving(true);
    try {
      setActiveSession(session);
      await loadSessionDetails(session);
    } catch (error) {
      console.error("Load session failed", error);
      Alert.alert("Error", "Could not load workout session.");
    } finally {
      setSaving(false);
    }
  };

  const addExerciseByName = async (planEx: PlanExercise | { name: string }) => {
    if (!activeSession) return;
    const defId = resolveDefinitionId(planEx.name);

    setSaving(true);
    try {
      const entry = await createExerciseEntry({
        workoutSessionId: activeSession.id,
        exerciseDefinitionId: defId,
        orderIndex: exercises.length + 1,
        exerciseNotes: (planEx as PlanExercise).prescription,
      });
      setExercises((prev) => [...prev, entry]);
      setSetsByExercise((prev) => ({ ...prev, [entry.id]: [] }));
      setSelectedExerciseId(entry.id);
    } catch (error) {
      console.error("Add exercise failed", error);
      Alert.alert("Error", "Could not add exercise.");
    } finally {
      setSaving(false);
    }
  };

  const logSet = async () => {
    if (!selectedExerciseId) {
      Alert.alert("Select exercise", "Add or select an exercise first.");
      return;
    }

    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
      Alert.alert("Invalid set", "Enter valid weight and reps.");
      return;
    }

    const existing = setsByExercise[selectedExerciseId] ?? [];
    const setNumber = existing.length + 1;
    const rirValue = rir.trim() ? parseInt(rir, 10) : undefined;

    setSaving(true);
    try {
      const setEntry = await createSetEntry({
        exerciseEntryId: selectedExerciseId,
        setNumber,
        weight: w,
        reps: r,
        rir: rirValue,
      });
      setSetsByExercise((prev) => ({
        ...prev,
        [selectedExerciseId]: [...existing, setEntry],
      }));
      setWeight("");
      setReps("");
      setRir("");
    } catch (error) {
      console.error("Log set failed", error);
      Alert.alert("Error", "Could not log set.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!activeSession) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workout Log</Text>
        <Text style={styles.hint}>Log only working sets. Use RIR for reps in reserve.</Text>

        <View style={styles.innerCard}>
            <Text style={styles.sectionLabel}>Start new session</Text>

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={workoutDate}
              onChangeText={setWorkoutDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Training day (from your plan)</Text>
            <View style={styles.chipRow}>
              {dayOptions.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.chip,
                    trainingDay === day && styles.chipActive,
                  ]}
                  onPress={() => setTrainingDay(day)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      trainingDay === day && styles.chipTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Week number</Text>
            <TextInput
              style={styles.input}
              value={weekNumber}
              onChangeText={setWeekNumber}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#888"
            />

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={startWorkout}
              disabled={saving}
            >
              <Text style={styles.btnPrimaryText}>
                {saving ? "Starting…" : "Start workout"}
              </Text>
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent sessions</Text>
        {sessions.length === 0 ? (
          <Text style={styles.muted}>No workouts yet.</Text>
        ) : (
          sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              onPress={() => openSession(session)}
              style={styles.logItem}
            >
              <Text style={styles.cardTitle}>
                {session.trainingDay} — Week {session.weekNumber}
              </Text>
              <Text style={styles.muted}>{session.workoutDate}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{activeSession.trainingDay}</Text>
          <Text style={styles.muted}>
            Week {activeSession.weekNumber} · {activeSession.workoutDate}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => {
            setActiveSession(null);
            setExercises([]);
            setSetsByExercise({});
          }}
        >
          <Text style={styles.btnSecondaryText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Exercises for this day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(planExercisesForDay.length
          ? planExercisesForDay
          : EXERCISE_DEFINITIONS.map((d) => ({ name: d.name }))
        ).map((ex) => (
          <TouchableOpacity
            key={ex.name}
            style={styles.exerciseChip}
            onPress={() => addExerciseByName(ex)}
            disabled={saving}
          >
            <Text style={styles.exerciseChipText}>{ex.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {exercises.map((exercise) => {
        const sets = setsByExercise[exercise.id] ?? [];
        const isSelected = selectedExerciseId === exercise.id;

        return (
          <View
            key={exercise.id}
            style={[styles.logItem, isSelected && styles.cardSelected]}
          >
              <TouchableOpacity onPress={() => setSelectedExerciseId(exercise.id)}>
                <Text style={styles.cardTitle}>{exercise.exerciseName}</Text>
                <Text style={styles.muted}>
                  {sets.length} set{sets.length === 1 ? "" : "s"} logged
                </Text>
              </TouchableOpacity>

              {sets.map((set) => (
                <Text key={set.id} style={styles.setLine}>
                  Set {set.setNumber}: {set.weight} kg × {set.reps} reps
                  {set.isPr ? " · PR" : ""}
                </Text>
              ))}
          </View>
        );
      })}

      <View style={styles.innerCard}>
          <Text style={styles.cardTitle}>Log set</Text>
          <Text style={styles.muted}>
            {selectedExerciseId
              ? exercises.find((e) => e.id === selectedExerciseId)
                  ?.exerciseName ?? "Exercise selected"
              : "Select an exercise card above"}
          </Text>

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="60"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Reps</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="8"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>RIR (optional)</Text>
          <TextInput
            style={styles.input}
            value={rir}
            onChangeText={setRir}
            keyboardType="number-pad"
            placeholder="2"
            placeholderTextColor="#888"
          />

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={logSet}
            disabled={saving || !selectedExerciseId}
          >
            <Text style={styles.btnPrimaryText}>
              {saving ? "Saving…" : "Save set"}
            </Text>
          </TouchableOpacity>
      </View>

      <View style={styles.spacing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: 24 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
  },
  innerCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  hint: { color: colors.muted, fontSize: 14, marginBottom: 12 },
  sectionLabel: { color: colors.text, fontWeight: "600", marginBottom: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  cardSelected: { borderColor: colors.accent },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  label: { color: colors.muted, marginTop: 10, marginBottom: 6, fontSize: 12 },
  muted: { color: colors.muted, fontSize: 14 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextActive: { color: colors.accentText, fontWeight: "600" },
  exerciseChip: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  exerciseChipText: { color: colors.text, fontSize: 13 },
  setLine: { color: colors.text, marginTop: 6, fontSize: 14 },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  btnPrimaryText: { color: colors.accentText, fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnSecondaryText: { color: colors.text },
  logItem: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  spacing: { height: 16 },
});
