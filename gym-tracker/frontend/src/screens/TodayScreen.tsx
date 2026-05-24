import React, { useCallback, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import SetLoggerModal from "../components/SetLoggerModal";
import {
  WORKOUT_PLAN,
  PlanDay,
  PlanExercise,
  weekdayToDayIndex,
  isDeloadWeek,
  deloadTargetLabel,
  TOTAL_WEEKS,
} from "../data/workoutPlan";
import {
  formatLastSet,
  getLastSet,
  getNextSetNumber,
  LastSetSummary,
} from "../services/setLogStore";
import { todayColors } from "../theme/todayColors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function weekFromBlockStart(blockStart: Date, today: Date = new Date()): number {
  const ms = today.getTime() - blockStart.getTime();
  const weeks = Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(TOTAL_WEEKS, Math.max(1, weeks));
}

type ExerciseRowProps = {
  exercise: PlanExercise;
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
  const [dayIndex, setDayIndex] = useState(() => weekdayToDayIndex());
  const [currentWeek, setCurrentWeek] = useState(() =>
    weekFromBlockStart(new Date(2026, 3, 27))
  );
  const [lastSets, setLastSets] = useState<Record<string, LastSetSummary>>({});
  const [loggerExercise, setLoggerExercise] = useState<PlanExercise | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const deload = isDeloadWeek(currentWeek);
  const activeDay: PlanDay = WORKOUT_PLAN[dayIndex] ?? WORKOUT_PLAN[0];

  const refreshLastSets = useCallback(() => {
    const map: Record<string, LastSetSummary> = {};
    for (const day of WORKOUT_PLAN) {
      for (const section of day.sections) {
        for (const ex of section.exercises) {
          const last = getLastSet(ex.id);
          if (last) map[ex.id] = last;
        }
      }
    }
    setLastSets(map);
  }, []);

  React.useEffect(() => {
    refreshLastSets();
  }, [refreshLastSets]);

  const openLogger = (exercise: PlanExercise) => {
    setLoggerExercise(exercise);
    setModalVisible(true);
  };

  const onSetSaved = (exerciseId: string, summary: LastSetSummary) => {
    setLastSets((prev) => ({ ...prev, [exerciseId]: summary }));
  };

  const goToDay = (index: number) => {
    const clamped = Math.max(0, Math.min(WORKOUT_PLAN.length - 1, index));
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
            onPress={() => setCurrentWeek((w) => Math.max(1, w - 1))}
            accessibilityLabel="Previous week"
          >
            <Text style={styles.weekBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.weekNum}>W{currentWeek}</Text>
          <TouchableOpacity
            style={styles.weekBtn}
            onPress={() => setCurrentWeek((w) => Math.min(TOTAL_WEEKS, w + 1))}
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
            Auto: {DAY_NAMES[weekdayToDayIndex()]} workout · swipe or arrows to change
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dayArrow}
          onPress={() => goToDay(dayIndex + 1)}
          disabled={dayIndex === WORKOUT_PLAN.length - 1}
        >
          <Text style={styles.dayArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dots}>
        {WORKOUT_PLAN.map((d, i) => (
          <TouchableOpacity
            key={d.dayNumber}
            style={[styles.dot, i === dayIndex && styles.dotActive]}
            onPress={() => goToDay(i)}
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
          {WORKOUT_PLAN.map((day) => (
            <ScrollView
              key={day.dayNumber}
              style={{ width: pageWidth }}
              contentContainerStyle={styles.dayScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {day.sections.map((section) => (
                <View key={section.name} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.name}</Text>
                  {section.exercises.map((exercise) => (
                    <ExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      deload={deload}
                      lastLabel={formatLastSet(lastSets[exercise.id] ?? null)}
                      onLog={() => openLogger(exercise)}
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
        lastSet={loggerExercise ? lastSets[loggerExercise.id] ?? null : null}
        setNumber={
          loggerExercise ? getNextSetNumber(loggerExercise.id) : 1
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
