import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { WorkoutPlan } from "../api/planApi";
import { TodayExercise } from "../utils/planUtils";
import {
  deloadSuggestedWeightKg,
  LastSetSummary,
  saveSet,
} from "../services/todayWorkoutService";
import { todayColors } from "../theme/todayColors";

const WEIGHT_STEP = 2.5;
const MIN_TOUCH = 44;

type Props = {
  visible: boolean;
  exercise: TodayExercise | null;
  plan: WorkoutPlan | null;
  orderIndex: number;
  lastSet: LastSetSummary | null;
  setNumber: number;
  deload: boolean;
  onClose: () => void;
  onSaved: (exerciseId: string, summary: LastSetSummary) => void;
};

function Stepper({
  label,
  value,
  display,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: {
  label: string;
  value: string;
  display: string;
  onDec: () => void;
  onInc: () => void;
  decDisabled?: boolean;
  incDisabled?: boolean;
}) {
  return (
    <View style={styles.stepperBlock}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepBtn, decDisabled && styles.stepBtnDisabled]}
          onPress={onDec}
          disabled={decDisabled}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{display}</Text>
        <TouchableOpacity
          style={[styles.stepBtn, incDisabled && styles.stepBtnDisabled]}
          onPress={onInc}
          disabled={incDisabled}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.stepperHint}>{value}</Text>
    </View>
  );
}

export default function SetLoggerModal({
  visible,
  exercise,
  plan,
  orderIndex,
  lastSet,
  setNumber,
  deload,
  onClose,
  onSaved,
}: Props) {
  const [isBw, setIsBw] = useState(true);
  const [bwAddedKg, setBwAddedKg] = useState(0);
  const [weightKg, setWeightKg] = useState(0);
  const [reps, setReps] = useState(8);
  const [rir, setRir] = useState(2);
  const [saving, setSaving] = useState(false);

  const supportsBw = exercise?.bodyweight ?? false;

  useEffect(() => {
    if (!visible || !exercise) return;

    const base = lastSet;
    if (base) {
      setIsBw(base.isBodyweight);
      const w = deload
        ? deloadSuggestedWeightKg(base)
        : base.isBodyweight
          ? base.weightKg
          : base.weightKg;
      if (base.isBodyweight) {
        setBwAddedKg(w);
        setWeightKg(0);
      } else {
        setWeightKg(w);
        setBwAddedKg(0);
      }
      setReps(base.reps);
      setRir(Math.min(4, Math.max(0, base.rir)));
    } else {
      setIsBw(supportsBw);
      setBwAddedKg(0);
      setWeightKg(deload ? 20 : 40);
      setReps(8);
      setRir(2);
    }
  }, [visible, exercise, lastSet, deload, supportsBw]);

  const displayWeight = useMemo(() => {
    if (supportsBw && isBw) {
      return bwAddedKg > 0 ? `BW + ${bwAddedKg} kg` : "BW";
    }
    return `${weightKg} kg`;
  }, [supportsBw, isBw, bwAddedKg, weightKg]);

  const handleSave = async () => {
    if (!exercise || saving) return;
    setSaving(true);
    try {
      const summary = await saveSet(exercise.name, plan, orderIndex, {
        setNumber,
        isBodyweight: supportsBw && isBw,
        weightKg: supportsBw && isBw ? bwAddedKg : weightKg,
        reps,
        rir,
      });
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSaved(exercise.id, summary);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!exercise) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.target}>Target: {exercise.target}</Text>
          {exercise.cue ? <Text style={styles.cue}>{exercise.cue}</Text> : null}
          {deload ? (
            <Text style={styles.deloadHint}>
              Deload: aim ~50% of last weight · fewer working sets
            </Text>
          ) : null}

          <Text style={styles.setLabel}>Set #{setNumber}</Text>

          {supportsBw ? (
            <View style={styles.bwRow}>
              <TouchableOpacity
                style={[styles.bwToggle, isBw && styles.bwToggleActive]}
                onPress={() => setIsBw(true)}
              >
                <Text style={[styles.bwToggleText, isBw && styles.bwToggleTextActive]}>
                  BW
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bwToggle, !isBw && styles.bwToggleActive]}
                onPress={() => setIsBw(false)}
              >
                <Text style={[styles.bwToggleText, !isBw && styles.bwToggleTextActive]}>
                  kg
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {supportsBw && isBw ? (
            <Stepper
              label="Added weight (kg)"
              value="BW + plates"
              display={displayWeight}
              onDec={() => setBwAddedKg((v) => Math.max(0, +(v - WEIGHT_STEP).toFixed(1)))}
              onInc={() => setBwAddedKg((v) => +(v + WEIGHT_STEP).toFixed(1))}
              decDisabled={bwAddedKg <= 0}
            />
          ) : (
            <Stepper
              label="Weight"
              value={`±${WEIGHT_STEP} kg`}
              display={displayWeight}
              onDec={() =>
                setWeightKg((v) => Math.max(0, +(v - WEIGHT_STEP).toFixed(1)))
              }
              onInc={() => setWeightKg((v) => +(v + WEIGHT_STEP).toFixed(1))}
              decDisabled={!supportsBw && weightKg <= 0}
            />
          )}

          <Stepper
            label="Reps"
            value="±1"
            display={String(reps)}
            onDec={() => setReps((v) => Math.max(1, v - 1))}
            onInc={() => setReps((v) => v + 1)}
            decDisabled={reps <= 1}
          />

          <Text style={styles.stepperLabel}>RIR (0–4)</Text>
          <View style={styles.rirRow}>
            {[0, 1, 2, 3, 4].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.rirBtn, rir === n && styles.rirBtnActive]}
                onPress={() => setRir(n)}
              >
                <Text style={[styles.rirText, rir === n && styles.rirTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? "Saving…" : "Save set"}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: todayColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: todayColors.border,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: todayColors.muted,
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: todayColors.text },
  target: { color: todayColors.muted, marginTop: 4, fontSize: 14 },
  cue: {
    color: todayColors.accent,
    marginTop: 6,
    fontSize: 13,
    fontStyle: "italic",
  },
  deloadHint: {
    color: todayColors.deloadText,
    backgroundColor: todayColors.deloadBg,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    fontSize: 13,
  },
  setLabel: {
    color: todayColors.text,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    fontSize: 15,
  },
  bwRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  bwToggle: {
    minHeight: MIN_TOUCH,
    minWidth: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: todayColors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  bwToggleActive: {
    backgroundColor: todayColors.accent,
    borderColor: todayColors.accent,
  },
  bwToggleText: { color: todayColors.muted, fontWeight: "600" },
  bwToggleTextActive: { color: "#fff" },
  stepperBlock: { marginBottom: 16 },
  stepperLabel: {
    color: todayColors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 12,
    backgroundColor: todayColors.inputBg,
    borderWidth: 1,
    borderColor: todayColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: { color: todayColors.text, fontSize: 24, fontWeight: "300" },
  stepperValue: {
    color: todayColors.text,
    fontSize: 28,
    fontWeight: "700",
    minWidth: 120,
    textAlign: "center",
  },
  stepperHint: { color: todayColors.muted, fontSize: 11, marginTop: 4 },
  rirRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
  },
  rirBtn: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: todayColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: todayColors.inputBg,
  },
  rirBtnActive: {
    backgroundColor: todayColors.accent,
    borderColor: todayColors.accent,
  },
  rirText: { color: todayColors.muted, fontWeight: "600", fontSize: 16 },
  rirTextActive: { color: "#fff" },
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: todayColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: todayColors.muted, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    minHeight: MIN_TOUCH,
    borderRadius: 12,
    backgroundColor: todayColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
