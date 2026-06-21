import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { createMeasurement, getLatestMeasurement, getMeasurements } from "../api/measurementApi";
import { colors } from "../theme/colors";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function MeasurementScreen() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [date, setDate] = useState(todayIso());
  const [week, setWeek] = useState("1");
  const [weight, setWeight] = useState("");
  const [waistNavel, setWaistNavel] = useState("");
  const [waistSmall, setWaistSmall] = useState("");
  const [hips, setHips] = useState("");
  const [thigh, setThigh] = useState("");
  const [chest, setChest] = useState("");
  const [shoulders, setShoulders] = useState("");
  const [arm, setArm] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    try {
      const [data, latest] = await Promise.all([
        getMeasurements(),
        getLatestMeasurement().catch(() => null),
      ]);
      setList(data);
      if (latest) {
        setWeek(String(latest.weekNumber ?? 1));
        if (latest.bodyWeight != null) setWeight(String(latest.bodyWeight));
        if (latest.waistNavel != null) setWaistNavel(String(latest.waistNavel));
        if (latest.waistSmallest != null) setWaistSmall(String(latest.waistSmallest));
        if (latest.hips != null) setHips(String(latest.hips));
        if (latest.thigh != null) setThigh(String(latest.thigh));
        if (latest.chest != null) setChest(String(latest.chest));
        if (latest.shoulders != null) setShoulders(String(latest.shoulders));
        if (latest.arm != null) setArm(String(latest.arm));
      }
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const num = (v: string) => {
    const n = parseFloat(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const save = async () => {
    setLoading(true);
    try {
      await createMeasurement({
        measurementDate: date,
        weekNumber: parseInt(week, 10),
        bodyWeight: num(weight),
        waistNavel: num(waistNavel),
        waistSmallest: num(waistSmall),
        hips: num(hips),
        thigh: num(thigh),
        chest: num(chest),
        shoulders: num(shoulders),
        arm: num(arm),
        notes: notes || undefined,
      });
      Alert.alert("Saved", "Measurement recorded.");
      load();
    } catch {
      Alert.alert("Error", "Could not save — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Body Check</Text>
      <Text style={styles.hint}>Measure once per week — morning, fasted, same conditions.</Text>

      <View style={styles.row}>
        <Field label="Date" value={date} onChangeText={setDate} />
        <Field label="Week (1–8)" value={week} onChangeText={setWeek} keyboardType="number-pad" />
      </View>
      <View style={styles.row}>
        <Field label="Weight kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        <Field label="Waist navel" value={waistNavel} onChangeText={setWaistNavel} keyboardType="decimal-pad" />
      </View>
      <View style={styles.row}>
        <Field label="Waist smallest" value={waistSmall} onChangeText={setWaistSmall} keyboardType="decimal-pad" />
        <Field label="Hips / glutes" value={hips} onChangeText={setHips} keyboardType="decimal-pad" />
      </View>
      <View style={styles.row}>
        <Field label="Thigh" value={thigh} onChangeText={setThigh} keyboardType="decimal-pad" />
        <Field label="Chest" value={chest} onChangeText={setChest} keyboardType="decimal-pad" />
      </View>
      <View style={styles.row}>
        <Field label="Shoulders" value={shoulders} onChangeText={setShoulders} keyboardType="decimal-pad" />
        <Field label="Arm flexed" value={arm} onChangeText={setArm} keyboardType="decimal-pad" />
      </View>

      <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.btn} onPress={save} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.btnText}>Save measurement</Text>
        )}
      </TouchableOpacity>

      {list.map((m) => (
        <Text key={m.id} style={styles.log}>
          W{m.weekNumber} · {m.measurementDate} · {m.bodyWeight ?? "—"}kg · waist {m.waistNavel ?? "—"}
        </Text>
      ))}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.muted}
      />
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
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  hint: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  row: { flexDirection: "row", gap: 10 },
  field: { flex: 1, marginBottom: 10 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    color: colors.text,
    padding: 10,
  },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: colors.accentText, fontWeight: "700" },
  log: { color: colors.text, marginTop: 10, fontSize: 13 },
});
