import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  bestE1rmBySession,
  bestWeightBySession,
  ExerciseProgressPoint,
  getProgressByExerciseName,
  getWeeklyVolumeByExerciseName,
  WeeklyVolumePoint,
} from "../api/analyticsApi";
import { getExercisesForDay, getWorkoutPlan, PlanDay, WorkoutPlan } from "../api/planApi";
import ProgressChart from "../components/ProgressChart";
import { colors } from "../theme/colors";

export default function AnalyticsScreen() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExerciseProgressPoint[]>([]);
  const [volume, setVolume] = useState<WeeklyVolumePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planDays = plan?.days ?? [];
  const dayExercises = useMemo(
    () => getExercisesForDay(plan, selectedDay?.label ?? ""),
    [plan, selectedDay]
  );

  const loadPlan = useCallback(async () => {
    try {
      setError(null);
      const loaded = await getWorkoutPlan();
      setPlan(loaded);
      const days = loaded?.days ?? [];
      setSelectedDay((prev) => {
        if (prev && days.some((d) => d.label === prev.label)) return prev;
        return days[0] ?? null;
      });
    } catch {
      setError("Could not load plan — set up your plan first.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadProgress = useCallback(async (dayLabel: string, exerciseName: string) => {
    setDetailLoading(true);
    try {
      const [prog, vol] = await Promise.all([
        getProgressByExerciseName(exerciseName, dayLabel),
        getWeeklyVolumeByExerciseName(exerciseName, dayLabel),
      ]);
      setProgress(prog);
      setVolume(vol);
    } catch {
      setProgress([]);
      setVolume([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (!selectedDay) {
      setSelectedExercise(null);
      return;
    }
    const exercises = getExercisesForDay(plan, selectedDay.label);
    setSelectedExercise((prev) => {
      if (prev && exercises.some((e) => e.name === prev)) return prev;
      return exercises[0]?.name ?? null;
    });
  }, [plan, selectedDay]);

  useEffect(() => {
    if (selectedDay && selectedExercise) {
      loadProgress(selectedDay.label, selectedExercise);
    } else {
      setProgress([]);
      setVolume([]);
    }
  }, [selectedDay, selectedExercise, loadProgress]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPlan();
    if (selectedDay && selectedExercise) {
      loadProgress(selectedDay.label, selectedExercise);
    }
  };

  const weightChart = useMemo(() => bestWeightBySession(progress), [progress]);
  const e1rmChart = useMemo(() => bestE1rmBySession(progress), [progress]);
  const maxVol = Math.max(...volume.map((v) => Number(v.totalVolume) || 0), 1);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.hint}>
        Pick a training day, then an exercise, to see your progress graph.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!planDays.length ? (
        <Text style={styles.empty}>
          No plan yet. Use the Plan tab to add training days and exercises.
        </Text>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Training day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {planDays.map((day) => (
              <TouchableOpacity
                key={day.dayNumber}
                style={[
                  styles.chip,
                  selectedDay?.label === day.label && styles.chipActive,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDay?.label === day.label && styles.chipTextActive,
                  ]}
                >
                  {day.title || day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedDay ? (
            <>
              <Text style={styles.sectionLabel}>Exercise on {selectedDay.title || "this day"}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {dayExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.name}
                    style={[
                      styles.chip,
                      selectedExercise === exercise.name && styles.chipActive,
                    ]}
                    onPress={() => setSelectedExercise(exercise.name)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedExercise === exercise.name && styles.chipTextActive,
                      ]}
                    >
                      {exercise.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : null}

          {!dayExercises.length && selectedDay ? (
            <Text style={styles.empty}>No exercises on this day in your plan.</Text>
          ) : null}
        </>
      )}

      {detailLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
      ) : null}

      {selectedExercise && !detailLoading ? (
        <>
          <View style={styles.card}>
            <ProgressChart
              title="Best weight per session"
              points={weightChart}
              unit="kg"
              emptyMessage="No logged sets for this exercise on this day yet."
            />
          </View>

          <View style={styles.card}>
            <ProgressChart
              title="Estimated 1RM trend"
              points={e1rmChart}
              unit="kg"
              emptyMessage="Log sets to build your strength curve."
            />
          </View>

          {volume.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Weekly volume</Text>
              {volume.map((v) => {
                const pct = Math.round((Number(v.totalVolume) / maxVol) * 100);
                return (
                  <View key={v.weekNumber} style={styles.barRow}>
                    <Text style={styles.barLabel}>W{v.weekNumber}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.barValue}>{v.totalVolume}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {progress.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Set history</Text>
              {progress.map((p, i) => (
                <View key={i} style={styles.setRow}>
                  <Text style={styles.setMain}>
                    {p.workoutDate ?? "—"} · {p.weight} kg × {p.reps}
                  </Text>
              <Text style={styles.setSub}>
                W{p.weekNumber ?? "?"} · Vol {Number(p.volume).toFixed(0)} · e1RM{" "}
                {Number(p.estimatedOneRepMax).toFixed(1)}
                {p.notes ? ` · "${p.notes}"` : ""}
              </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  loader: { padding: 32, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  hint: { color: colors.muted, fontSize: 14, marginBottom: 12 },
  error: { color: colors.error, marginBottom: 12 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  chipScroll: { marginBottom: 12, maxHeight: 48 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
    backgroundColor: colors.inputBg,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.accentText },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  barLabel: { width: 28, color: colors.muted, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.inputBg,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 5 },
  barValue: { width: 48, textAlign: "right", color: colors.text, fontSize: 12 },
  setRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  setMain: { color: colors.text, fontWeight: "600", fontSize: 15 },
  setSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { color: colors.muted, fontStyle: "italic", marginTop: 8 },
});
