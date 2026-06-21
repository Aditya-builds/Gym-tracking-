import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getWorkoutPlan, importWorkoutPlan } from "../api/planApi";
import {
  buildWorkoutPlanFromDrafts,
  DayDraft,
  planToDayDrafts,
  resizeDayDrafts,
} from "../utils/buildWorkoutPlan";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Chip from "../components/ui/Chip";
import ScreenHeader from "../components/ui/ScreenHeader";
import TextField from "../components/ui/TextField";
import { theme } from "../theme/colors";

const MAX_DAYS = 7;

type Props = {
  onPlanSaved?: () => void;
};

export default function PlanBuilderScreen({ onPlanSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [planName, setPlanName] = useState("My Program");
  const [dayCount, setDayCount] = useState(3);
  const [days, setDays] = useState<DayDraft[]>(() => resizeDayDrafts([], 3));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plan = await getWorkoutPlan();
      if (plan?.days?.length) {
        setPlanName(plan.planName ?? "My Program");
        setDayCount(plan.days.length);
        setDays(planToDayDrafts(plan));
        setStep(2);
      }
    } catch {
      /* fresh start */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pickDays = (count: number) => {
    setDayCount(count);
    setDays(resizeDayDrafts(days, count));
  };

  const updateDay = (index: number, title: string) => {
    setDays((current) =>
      current.map((day, i) => (i === index ? { ...day, title } : day))
    );
  };

  const updateExercise = (dayIndex: number, exIndex: number, name: string) => {
    setDays((current) =>
      current.map((day, i) => {
        if (i !== dayIndex) return day;
        const exercises = day.exercises.map((ex, j) =>
          j === exIndex ? { name } : ex
        );
        return { ...day, exercises };
      })
    );
  };

  const addExercise = (dayIndex: number) => {
    setDays((current) =>
      current.map((day, i) =>
        i === dayIndex
          ? { ...day, exercises: [...day.exercises, { name: "" }] }
          : day
      )
    );
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    setDays((current) =>
      current.map((day, i) => {
        if (i !== dayIndex) return day;
        const exercises = day.exercises.filter((_, j) => j !== exIndex);
        return { ...day, exercises: exercises.length ? exercises : [{ name: "" }] };
      })
    );
  };

  const savePlan = async () => {
    const hasExercise = days.some((d) =>
      d.exercises.some((e) => e.name.trim())
    );
    if (!hasExercise) {
      Alert.alert("Add exercises", "Add at least one exercise to your plan.");
      return;
    }
    setSaving(true);
    try {
      await importWorkoutPlan(buildWorkoutPlanFromDrafts(planName, 8, days));
      onPlanSaved?.();
    } catch {
      Alert.alert("Error", "Could not save — is the backend running?");
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

  if (step === 1) {
    return (
      <View>
        <ScreenHeader
          step={{ current: 1, total: 2 }}
          title="Build your split"
          subtitle="How many days per week do you train? You'll add exercise names next — no sets or weights here."
        />

        <TextField
          label="Program name"
          value={planName}
          onChangeText={setPlanName}
          placeholder="e.g. Upper / Lower"
        />

        <Text style={styles.sectionTitle}>Training days per week</Text>
        <View style={styles.dayGrid}>
          {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.dayTile, dayCount === n && styles.dayTileActive]}
              onPress={() => pickDays(n)}
            >
              <Text
                style={[styles.dayNum, dayCount === n && styles.dayNumActive]}
              >
                {n}
              </Text>
              <Text
                style={[
                  styles.daySub,
                  dayCount === n && styles.daySubActive,
                ]}
              >
                {n === 1 ? "day" : "days"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Next — add exercises"
          onPress={() => {
            setDays(resizeDayDrafts(days, dayCount));
            setStep(2);
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <ScreenHeader
        step={{ current: 2, total: 2 }}
        title="Your exercises"
        subtitle="Name each day and list the lifts you'll perform. Weight, reps & RIR are logged when you train."
      />

      <Button
        label="← Change training days"
        variant="ghost"
        onPress={() => setStep(1)}
        style={{ marginBottom: 8 }}
      />

      <ScrollView style={styles.dayScroll} nestedScrollEnabled>
        {days.map((day, dayIndex) => (
          <Card key={dayIndex} style={styles.dayCard}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day {dayIndex + 1}</Text>
            </View>
            <TextField
              label="Day name"
              value={day.title}
              onChangeText={(v) => updateDay(dayIndex, v)}
              placeholder="Legs, Push, Pull…"
            />
            {day.exercises.map((exercise, exIndex) => (
              <View key={exIndex} style={styles.exerciseRow}>
                <TextField
                  label={exIndex === 0 ? "Exercises" : undefined}
                  value={exercise.name}
                  onChangeText={(v) => updateExercise(dayIndex, exIndex, v)}
                  placeholder="Exercise name"
                  style={styles.exerciseInput}
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeExercise(dayIndex, exIndex)}
                >
                  <Text style={styles.removeText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Button
              label="+ Add exercise"
              variant="secondary"
              onPress={() => addExercise(dayIndex)}
            />
          </Card>
        ))}
      </ScrollView>

      <Button label="Save workout plan" onPress={savePlan} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { padding: 48, alignItems: "center" },
  sectionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  dayTile: {
    width: "30%",
    minWidth: 96,
    flexGrow: 1,
    aspectRatio: 1.1,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  dayTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.accentGlow,
  },
  dayNum: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.textSecondary,
  },
  dayNumActive: { color: theme.colors.primary },
  daySub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  daySubActive: { color: theme.colors.primary },
  dayScroll: { maxHeight: 440, marginBottom: theme.spacing.md },
  dayCard: { marginBottom: theme.spacing.md },
  dayBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.sm,
  },
  dayBadgeText: {
    color: theme.colors.primaryText,
    fontWeight: "700",
    fontSize: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  exerciseInput: { flex: 1 },
  removeBtn: {
    width: 44,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  removeText: {
    color: theme.colors.error,
    fontSize: 28,
    fontWeight: "300",
  },
});
