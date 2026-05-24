import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { exportBackup, importWorkoutPlan, importWorkoutPlanText } from "../api/planApi";
import { colors } from "../theme/colors";

const SAMPLE_PLAN = `{
  "planName": "8-Week Recomp",
  "weeks": 8,
  "trainingDays": ["Push", "Pull", "Legs"],
  "daySchedule": {
    "Push": ["Incline Dumbbell Press", "Overhead Press"],
    "Pull": ["Lat Pulldown", "Chest Supported Row"],
    "Legs": ["Back Squat", "Barbell Hip Thrust"]
  }
}`;

export default function BackupScreen() {
  const [planJson, setPlanJson] = useState("");
  const [status, setStatus] = useState("");

  const handleImportPlan = async () => {
    try {
      const raw = planJson.trim();
      if (!raw) {
        Alert.alert("Error", "Paste your plan text or JSON first.");
        return;
      }
      if (raw.startsWith("{")) {
        await importWorkoutPlan(JSON.parse(raw));
      } else if (/day\s*\d/i.test(raw)) {
        const plan = await importWorkoutPlanText(raw);
        setStatus(`Parsed ${plan.days?.length ?? 0} training days from text.`);
      } else {
        await importWorkoutPlan(JSON.parse(raw));
      }
      setStatus("Workout plan imported successfully.");
      Alert.alert("Success", "Workout plan uploaded — check Workouts tab.");
    } catch {
      Alert.alert("Error", "Invalid plan or API unavailable.");
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportBackup();
      setStatus(`Exported ${JSON.stringify(data).length} bytes from API.`);
      if (Platform.OS === "web") {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "gym-backup.json";
        a.click();
      } else {
        Alert.alert("Exported", "Backup fetched from API (see console).");
        console.log(data);
      }
    } catch {
      Alert.alert("Error", "Could not export — is the backend running?");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Backup &amp; Plan</Text>
      <Text style={styles.hint}>
        Paste your full plan text (DAY 1 – BACK + BICEPS…) or JSON. Parser extracts days and exercises.
      </Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={handleExport}>
        <Text style={styles.btnPrimaryText}>Download backup from API</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Workout plan JSON</Text>
      <TextInput
        style={styles.textarea}
        multiline
        value={planJson}
        onChangeText={setPlanJson}
        placeholder="Paste DAY 1 – BACK + BICEPS… or JSON plan"
        placeholderTextColor={colors.muted}
      />

      <TouchableOpacity style={styles.btnPrimary} onPress={handleImportPlan}>
        <Text style={styles.btnPrimaryText}>Upload workout plan</Text>
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      {Platform.OS === "web" ? (
        <Text style={styles.webTip}>
          On web, open http://localhost:3000 for the full file upload UI matching the design mockup.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 },
  hint: { color: colors.muted, marginBottom: 16, fontSize: 14, lineHeight: 20 },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6, marginTop: 12 },
  textarea: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    color: colors.text,
    padding: 12,
    minHeight: 160,
    textAlignVertical: "top",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  btnPrimaryText: { color: colors.accentText, fontWeight: "700", fontSize: 16 },
  status: { color: colors.muted, marginTop: 12, fontSize: 13 },
  webTip: { color: colors.muted, marginTop: 16, fontSize: 12 },
});
