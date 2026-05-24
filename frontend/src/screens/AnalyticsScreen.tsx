import React, { useCallback, useEffect, useState } from "react";
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
  ExerciseEntryOption,
  ExerciseProgressPoint,
  getExerciseProgress,
  getWeeklyVolume,
  listRecentExerciseEntries,
  WeeklyVolumePoint,
} from "../api/analyticsApi";
import { colors } from "../theme/colors";

export default function AnalyticsScreen() {
  const [exercises, setExercises] = useState<ExerciseEntryOption[]>([]);
  const [selected, setSelected] = useState<ExerciseEntryOption | null>(null);
  const [progress, setProgress] = useState<ExerciseProgressPoint[]>([]);
  const [volume, setVolume] = useState<WeeklyVolumePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    try {
      setError(null);
      const list = await listRecentExerciseEntries();
      setExercises(list);
      setSelected((prev) => prev ?? list[0] ?? null);
    } catch (e) {
      console.error("Analytics exercise list failed", e);
      setError("Could not load exercises — is the API running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDetail = useCallback(async (entry: ExerciseEntryOption) => {
    setDetailLoading(true);
    try {
      const [prog, vol] = await Promise.all([
        getExerciseProgress(entry.id),
        getWeeklyVolume(entry.id),
      ]);
      setProgress(prog);
      setVolume(vol);
    } catch (e) {
      console.error("Analytics detail failed", e);
      setProgress([]);
      setVolume([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    if (selected) loadDetail(selected);
  }, [selected, loadDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    loadExercises();
    if (selected) loadDetail(selected);
  };

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
      <Text style={styles.hint}>Strength trends and weekly volume per lift.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionLabel}>Select exercise</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {exercises.map((ex) => (
          <TouchableOpacity
            key={ex.id}
            style={[styles.chip, selected?.id === ex.id && styles.chipActive]}
            onPress={() => setSelected(ex)}
          >
            <Text style={[styles.chipText, selected?.id === ex.id && styles.chipTextActive]}>
              {ex.exerciseName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!exercises.length ? (
        <Text style={styles.empty}>
          No logged exercises yet. Use the Log tab to save sets, then return here.
        </Text>
      ) : null}

      {selected ? (
        <Text style={styles.meta}>
          W{selected.weekNumber} · {selected.trainingDay} · {selected.workoutDate}
        </Text>
      ) : null}

      {detailLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
      ) : null}

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
                {p.weight} kg × {p.reps}
              </Text>
              <Text style={styles.setSub}>
                Vol {p.volume?.toFixed?.(0) ?? p.volume} · e1RM{" "}
                {p.estimatedOneRepMax?.toFixed?.(1) ?? p.estimatedOneRepMax}
              </Text>
            </View>
          ))}
        </View>
      ) : selected && !detailLoading ? (
        <Text style={styles.empty}>No sets for this entry yet.</Text>
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
  meta: { color: colors.muted, fontSize: 12, marginBottom: 12 },
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
