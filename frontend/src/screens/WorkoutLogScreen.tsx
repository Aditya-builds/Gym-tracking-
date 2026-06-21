import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { getExercisesForDay, getWorkoutPlan, PlanDay, WorkoutPlan } from "../api/planApi";
import { SetEntry } from "../api/workoutApi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ScreenHeader from "../components/ui/ScreenHeader";
import TextField from "../components/ui/TextField";
import {
  ensureTodaySession,
  prepareExerciseLogging,
  saveSet,
} from "../services/todayWorkoutService";
import { theme } from "../theme/colors";

type Step = "days" | "exercises" | "log";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function weekNumberDefault() {
  return Math.min(8, Math.max(1, Math.ceil(new Date().getDate() / 7)));
}

type Props = {
  successMessage?: string | null;
  onDismissSuccessMessage?: () => void;
};

export default function WorkoutLogScreen({
  successMessage,
  onDismissSuccessMessage,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>("days");
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseOrderIndex, setExerciseOrderIndex] = useState(1);
  const [nextSetNumber, setNextSetNumber] = useState(1);
  const [loggedSets, setLoggedSets] = useState<SetEntry[]>([]);

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("2");
  const [feeling, setFeeling] = useState("");
  const [setSavedMessage, setSetSavedMessage] = useState<string | null>(null);

  const activeSuccessMessage = successMessage ?? setSavedMessage;

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      setPlan(await getWorkoutPlan());
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (!activeSuccessMessage) return;
    const timer = setTimeout(() => {
      onDismissSuccessMessage?.();
      setSetSavedMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeSuccessMessage, onDismissSuccessMessage]);

  const successBanner =
    activeSuccessMessage != null && activeSuccessMessage.length > 0 ? (
      <View style={styles.successBanner}>
        <Text style={styles.successBannerText}>✓ {activeSuccessMessage}</Text>
      </View>
    ) : null;

  const planDays = plan?.days ?? [];
  const dayExercises = selectedDay
    ? getExercisesForDay(plan, selectedDay.label)
    : [];

  const openDay = (day: PlanDay) => {
    setSelectedDay(day);
    setStep("exercises");
  };

  const openExercise = async (name: string, orderIndex: number) => {
    if (!selectedDay) return;
    setSelectedExercise(name);
    setExerciseOrderIndex(orderIndex);
    setWeight("");
    setReps("");
    setRir("2");
    setFeeling("");
    setStep("log");

    try {
      const week = weekNumberDefault();
      await ensureTodaySession(week, selectedDay.label);
      const result = await prepareExerciseLogging(
        week,
        selectedDay.label,
        name,
        plan,
        orderIndex
      );
      setLoggedSets(result.sets);
      setNextSetNumber(result.nextSetNumber);
    } catch {
      Alert.alert("Error", "Could not load exercise — is the backend running?");
    }
  };

  const submitSet = async () => {
    if (!selectedDay || !selectedExercise) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const rirVal = parseInt(rir, 10);
    if (Number.isNaN(w) || w < 0 || Number.isNaN(r) || r < 1) {
      Alert.alert("Check inputs", "Enter valid weight and reps.");
      return;
    }

    setSaving(true);
    try {
      const savedSetNumber = nextSetNumber;
      await saveSet(selectedExercise, plan, exerciseOrderIndex, {
        setNumber: savedSetNumber,
        isBodyweight: false,
        weightKg: w,
        reps: r,
        rir: Number.isNaN(rirVal) ? 0 : Math.min(5, Math.max(0, rirVal)),
        notes: feeling.trim() || undefined,
      });
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSetSavedMessage(
        `Set ${savedSetNumber} saved — ${w} kg × ${r} reps for ${selectedExercise}. Pick another exercise or tap it again for your next set.`
      );
      setSelectedExercise(null);
      setLoggedSets([]);
      setWeight("");
      setReps("");
      setRir("2");
      setFeeling("");
      setStep("exercises");
    } catch {
      Alert.alert("Error", "Could not save set.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!planDays.length) {
    return (
      <View>
        {successBanner}
        <ScreenHeader
          title="Workout"
          subtitle="Create your plan first, then come back here to log sets."
        />
        <Card glow>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptyText}>
            Open the Plan tab to choose your training days and exercises.
          </Text>
        </Card>
      </View>
    );
  }

  if (step === "days") {
    return (
      <View>
        {successBanner}
        <ScreenHeader
          title="Start workout"
          subtitle="Pick today's training day from your plan."
        />
        <View style={styles.grid}>
          {planDays.map((day) => (
            <TouchableOpacity
              key={day.dayNumber}
              style={styles.dayCard}
              onPress={() => openDay(day)}
              activeOpacity={0.85}
            >
              <Text style={styles.dayNum}>Day {day.dayNumber}</Text>
              <Text style={styles.dayTitle}>{day.title || day.label}</Text>
              <Text style={styles.dayMeta}>
                {getExercisesForDay(plan, day.label).length} exercises
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (step === "exercises" && selectedDay) {
    return (
      <View>
        {successBanner}
        <ScreenHeader
          title={selectedDay.title || selectedDay.label}
          subtitle="Select an exercise to log sets."
        />
        <Button
          label="← All training days"
          variant="ghost"
          onPress={() => {
            setStep("days");
            setSelectedDay(null);
          }}
          style={{ marginBottom: 12 }}
        />
        {dayExercises.map((exercise, index) => (
          <TouchableOpacity
            key={exercise.name}
            style={styles.exerciseCard}
            onPress={() => openExercise(exercise.name, index + 1)}
            activeOpacity={0.85}
          >
            <View style={styles.exerciseIcon}>
              <Text style={styles.exerciseIconText}>
                {exercise.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseHint}>Tap to log sets</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (step === "log" && selectedExercise && selectedDay) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={selectedExercise}
          subtitle={`${selectedDay.title} · ${todayIso()} · Set ${nextSetNumber}`}
        />
        <Button
          label="← Back to exercises"
          variant="ghost"
          onPress={() => setStep("exercises")}
          style={{ marginBottom: 12 }}
        />

        <Card glow style={styles.logCard}>
          <View style={styles.row2}>
            <View style={styles.half}>
              <TextField
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.half}>
              <TextField
                label="Reps"
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="8"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>RIR (reps in reserve)</Text>
          <View style={styles.rirRow}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.rirBtn, rir === String(n) && styles.rirBtnActive]}
                onPress={() => setRir(String(n))}
              >
                <Text
                  style={[
                    styles.rirText,
                    rir === String(n) && styles.rirTextActive,
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextField
            label="How did it feel?"
            value={feeling}
            onChangeText={setFeeling}
            placeholder="Strong, shaky, easy…"
            multiline
            style={styles.feelingInput}
          />

          <Button label="Save set" onPress={submitSet} loading={saving} />
        </Card>

        {loggedSets.length > 0 ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={styles.historyTitle}>Today's sets</Text>
            {loggedSets.map((s) => (
              <View key={s.id} style={styles.historyRow}>
                <Text style={styles.historyMain}>
                  Set {s.setNumber}: {s.weight} kg × {s.reps}
                  {s.rir != null ? ` · RIR ${s.rir}` : ""}
                  {s.isPr ? " · PR" : ""}
                </Text>
                {s.notes ? (
                  <Text style={styles.historyNote}>"{s.notes}"</Text>
                ) : null}
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loader: { padding: 48, alignItems: "center" },
  successBanner: {
    backgroundColor: theme.colors.accentGlow,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successBannerText: {
    color: theme.colors.text,
    fontWeight: "600",
    lineHeight: 22,
  },
  emptyTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: { color: theme.colors.textSecondary, lineHeight: 22 },
  grid: { gap: 12 },
  dayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.lg,
  },
  dayNum: {
    ...theme.typography.label,
    color: theme.colors.primary,
    marginBottom: 6,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  dayMeta: {
    color: theme.colors.textMuted,
    marginTop: 6,
    fontSize: 13,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.md,
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.accentGlow,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  exerciseIconText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 18,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  exerciseHint: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: theme.colors.textMuted,
    fontSize: 28,
    fontWeight: "300",
  },
  logCard: { marginBottom: 8 },
  row2: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  fieldLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  rirRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  rirBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  rirBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rirText: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 15,
  },
  rirTextActive: { color: theme.colors.primaryText },
  feelingInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  historyTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginBottom: 12,
  },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  historyMain: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  historyNote: {
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    marginTop: 4,
    fontSize: 13,
  },
});
