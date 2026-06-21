import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import SetLoggerModal from "../components/SetLoggerModal";
import { getWorkoutPlan, WorkoutPlan } from "../api/planApi";
import { getWorkoutSessions } from "../api/workoutApi";
import {
  deloadTargetLabel,
  exerciseKey,
  getTodayPlanDays,
  isDeloadWeek,
  TodayExercise,
  TodayPlanDay,
  totalWeeks,
  weekdayToDayIndex,
  weekFromBlockStart,
} from "../utils/planUtils";
import {
  ensureTodaySession,
  formatLastSet,
  getLastSet,
  getNextSetNumber,
  LastSetSummary,
  refreshLastSets,
} from "../services/todayWorkoutService";
import { todayColors } from "../theme/todayColors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mapLastSetsToExerciseIds(
  days: TodayPlanDay[],
  lastByName: Record<string, LastSetSummary>
): Record<string, LastSetSummary> {
  const mapped: Record<string, LastSetSummary> = {};
  for (const day of days) {
    for (const section of day.sections) {
      for (const exercise of section.exercises) {
        const last = lastByName[exerciseKey(exercise.name)];
        if (last) mapped[exercise.id] = last;
      }
    }
  }
  return mapped;
}

type ExerciseRowProps = {
  exercise: TodayExercise;
  deload: boolean;
  lastLabel: string;
  onLog: () => void;
};

function ExerciseRow({ exercise, deload, lastLabel, onLog }: ExerciseRowProps) {
  const target = deload ? deloadTargetLabel(exercise.target) : exercise.target;

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseMain}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseTarget}>{target}</Text>
        {exercise.cue ? <Text style={styles.exerciseCue}>{exercise.cue}</Text> : null}
        <Text style={styles.lastSet}>{lastLabel}</Text>
      </View>
      <TouchableOpacity
        style={styles.logBtn}
        onPress={onLog}
        accessibilityLabel={`Log set for ${exercise.name}`}
        activeOpacity={0.85}
      >
        <Text style={styles.logBtnText}>LOG</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TodayScreen() {
  const pagerRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(SCREEN_WIDTH - 64);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [lastSets, setLastSets] = useState<Record<string, LastSetSummary>>({});
  const [loggerExercise, setLoggerExercise] = useState<TodayExercise | null>(null);
  const [loggerOrderIndex, setLoggerOrderIndex] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);

  const planDays = useMemo(() => getTodayPlanDays(plan), [plan]);
  const maxWeeks = totalWeeks(plan);
  const deload = isDeloadWeek(currentWeek);
  const activeDay = planDays[dayIndex] ?? planDays[0];

  const mapLastSetsById = useCallback(
    (lastByName: Record<string, LastSetSummary>, days = planDays) =>
      mapLastSetsToExerciseIds(days, lastByName),
    [planDays]
  );

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedPlan, sessions] = await Promise.all([
        getWorkoutPlan(),
        getWorkoutSessions(),
      ]);
      setPlan(loadedPlan);

      const days = getTodayPlanDays(loadedPlan);
      const weeks = totalWeeks(loadedPlan);
      const initialDayIndex = weekdayToDayIndex(new Date(), days.length);
      setDayIndex(initialDayIndex);

      const earliest = sessions.map((session) => session.workoutDate).sort()[0];
      const blockStart = earliest ? new Date(earliest) : new Date();
      const week = weekFromBlockStart(blockStart, new Date(), weeks);
      setCurrentWeek(week);

      const names = days.flatMap((day) =>
        day.sections.flatMap((section) =>
          section.exercises.map((exercise) => exercise.name)
        )
      );

      if (days.length > 0) {
        const dayLabel = days[initialDayIndex]?.label ?? days[0].label;
        await ensureTodaySession(week, dayLabel);
      }

      if (names.length > 0) {
        const lastByName = await refreshLastSets(names);
        setLastSets(mapLastSetsToExerciseIds(days, lastByName));
      }
    } catch {
      setError("Could not load plan — is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const syncSessionAndLastSets = useCallback(async () => {
    if (!activeDay) return;
    try {
      await ensureTodaySession(currentWeek, activeDay.label);
      const names = activeDay.sections.flatMap((section) =>
        section.exercises.map((exercise) => exercise.name)
      );
      const lastByName = await refreshLastSets(names);
      setLastSets((prev) => ({ ...prev, ...mapLastSetsById(lastByName) }));
    } catch {
      setError("Could not sync workout session.");
    }
  }, [activeDay, currentWeek, mapLastSetsById]);

  useEffect(() => {
    if (!loading && activeDay) {
      syncSessionAndLastSets();
    }
  }, [activeDay?.label, currentWeek, loading, syncSessionAndLastSets]);

  const openLogger = (exercise: TodayExercise, orderIndex: number) => {
    setLoggerExercise(exercise);
    setLoggerOrderIndex(orderIndex);
    setModalVisible(true);
  };

  const onSetSaved = (exerciseId: string, summary: LastSetSummary) => {
    setLastSets((prev) => ({ ...prev, [exerciseId]: summary }));
  };

  const goToDay = (index: number) => {
    if (planDays.length === 0) return;
    const clamped = Math.max(0, Math.min(planDays.length - 1, index));
    setDayIndex(clamped);
    pagerRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
  };

  const onPagerScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / pageWidth);
    if (idx !== dayIndex) setDayIndex(idx);
  };

  const swipeGesture = Gesture.Pan().onEnd((e) => {
    if (e.translationX < -40) goToDay(dayIndex + 1);
    else if (e.translationX > 40) goToDay(dayIndex - 1);
  });

  const weekLabel = useMemo(() => {
    const phase =
      currentWeek >= 7 ? "Deload" : currentWeek >= 5 ? "Peak" : "Build";
    return `Week ${currentWeek} · ${phase}`;
  }, [currentWeek]);

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={todayColors.accent} />
      </View>
    );
  }

  if (error || planDays.length === 0) {
    return (
      <View style={styles.root}>
        <Text style={styles.errorText}>
          {error ?? "No workout plan loaded. Import a plan from the Backup tab."}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadPlan}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={styles.root}
      onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
    >
      {deload ? (
        <View style={styles.deloadBanner}>
          <Text style={styles.deloadBannerText}>
            DELOAD — reduce weight 40–50% or half sets
          </Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <View>
          <Text style={styles.todayTitle}>Today</Text>
          <Text style={styles.weekMeta}>{weekLabel}</Text>
        </View>
        <View style={styles.weekStepper}>
          <TouchableOpacity
            style={styles.weekBtn}
            onPress={() => setCurrentWeek((week) => Math.max(1, week - 1))}
            accessibilityLabel="Previous week"
          >
            <Text style={styles.weekBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.weekNum}>W{currentWeek}</Text>
          <TouchableOpacity
            style={styles.weekBtn}
            onPress={() =>
              setCurrentWeek((week) => Math.min(maxWeeks, week + 1))
            }
            accessibilityLabel="Next week"
          >
            <Text style={styles.weekBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dayPicker}>
        <TouchableOpacity
          style={styles.dayArrow}
          onPress={() => goToDay(dayIndex - 1)}
          disabled={dayIndex === 0}
        >
          <Text style={styles.dayArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dayCenter}>
          <Text style={styles.dayLabel}>{activeDay.label}</Text>
          <Text style={styles.autoHint}>
            Auto: {DAY_NAMES[weekdayToDayIndex(new Date(), planDays.length)]} workout · swipe or arrows to change
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dayArrow}
          onPress={() => goToDay(dayIndex + 1)}
          disabled={dayIndex === planDays.length - 1}
        >
          <Text style={styles.dayArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dots}>
        {planDays.map((day, index) => (
          <TouchableOpacity
            key={day.dayNumber}
            style={[styles.dot, index === dayIndex && styles.dotActive]}
            onPress={() => goToDay(index)}
          />
        ))}
      </View>

      <GestureDetector gesture={swipeGesture}>
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPagerScrollEnd}
          style={styles.pager}
          contentContainerStyle={styles.pagerContent}
        >
          {planDays.map((day) => (
            <ScrollView
              key={day.dayNumber}
              style={{ width: pageWidth }}
              contentContainerStyle={styles.dayScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {day.sections.map((section, sectionIndex) => (
                <View key={`${day.dayNumber}-${sectionIndex}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.name}</Text>
                  {section.exercises.map((exercise, index) => (
                    <ExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      deload={deload}
                      lastLabel={formatLastSet(
                        lastSets[exercise.id] ??
                          getLastSet(exercise.name) ??
                          null
                      )}
                      onLog={() => openLogger(exercise, index + 1)}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          ))}
        </ScrollView>
      </GestureDetector>

      <SetLoggerModal
        visible={modalVisible}
        exercise={loggerExercise}
        plan={plan}
        orderIndex={loggerOrderIndex}
        lastSet={
          loggerExercise
            ? lastSets[loggerExercise.id] ??
              getLastSet(loggerExercise.name) ??
              null
            : null
        }
        setNumber={
          loggerExercise
            ? getNextSetNumber(loggerExercise.name)
            : 1
        }
        deload={deload}
        onClose={() => setModalVisible(false)}
        onSaved={onSetSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: todayColors.bg,
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: todayColors.border,
  },
  centered: {
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: todayColors.muted,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    alignSelf: "center",
    backgroundColor: todayColors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  deloadBanner: {
    backgroundColor: todayColors.deloadBanner,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  deloadBannerText: {
    color: "#1a1400",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: todayColors.text,
  },
  weekMeta: { color: todayColors.muted, marginTop: 2, fontSize: 14 },
  weekStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: todayColors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: todayColors.border,
  },
  weekBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  weekBtnText: { color: todayColors.text, fontSize: 22, fontWeight: "300" },
  weekNum: {
    color: todayColors.accent,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "center",
  },
  dayPicker: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dayArrow: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dayArrowText: { color: todayColors.accent, fontSize: 28, fontWeight: "300" },
  dayCenter: { flex: 1, alignItems: "center" },
  dayLabel: {
    color: todayColors.text,
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  autoHint: {
    color: todayColors.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: todayColors.border,
  },
  dotActive: { backgroundColor: todayColors.accent, width: 20 },
  pager: { maxHeight: Platform.OS === "web" ? 520 : 480 },
  pagerContent: { alignItems: "flex-start" },
  dayScroll: { paddingBottom: 24 },
  section: { marginBottom: 16 },
  sectionTitle: {
    color: todayColors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  exerciseCard: {
    backgroundColor: todayColors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: todayColors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseMain: { flex: 1 },
  exerciseName: {
    color: todayColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseTarget: { color: todayColors.muted, fontSize: 13, marginTop: 4 },
  exerciseCue: { color: todayColors.accent, fontSize: 12, marginTop: 6 },
  lastSet: { color: todayColors.muted, fontSize: 12, marginTop: 8 },
  logBtn: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: todayColors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  logBtnText: { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
});
