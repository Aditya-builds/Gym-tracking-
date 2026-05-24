import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import {
  DashboardOverview,
  getDashboard,
  getWeeklySummary,
  WeeklySummaryWeek,
} from "../api/dashboardApi";
import { colors } from "../theme/colors";

export default function WeeklySummaryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [summary, setSummary] = useState<WeeklySummaryWeek[]>([]);

  const load = async () => {
    try {
      const [d, s] = await Promise.all([getDashboard(), getWeeklySummary()]);
      setDashboard(d);
      setSummary(s);
    } catch (e) {
      console.error("Weekly summary load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />;
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>Weekly Summary</Text>
        <Text style={styles.hint}>
          Full week-by-week breakdown — training volume and key lifts.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {dashboard?.completionPercentage?.toFixed(0) ?? 0}%
            </Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{dashboard?.latestWeight ?? "—"}</Text>
            <Text style={styles.statLabel}>Weight kg</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{dashboard?.latestWaist ?? "—"}</Text>
            <Text style={styles.statLabel}>Waist</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{dashboard?.totalPRs ?? 0}</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>

        {summary.length ? (
          summary.map((week) => (
            <View key={week.weekNumber} style={styles.weekCard}>
              <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
              <Text style={styles.weekLine}>Weight: {week.bodyWeight ?? "—"} kg</Text>
              <Text style={styles.weekLine}>
                Waist: {week.waist ?? "—"} · Hips: {week.hips ?? "—"} · Thigh:{" "}
                {week.thigh ?? "—"}
              </Text>
              <Text style={styles.weekLine}>Volume: {week.totalVolume ?? "—"}</Text>
              <Text style={styles.weekLine}>Squat: {week.bestSquat ?? "—"}</Text>
              <Text style={styles.weekLine}>Hip thrust: {week.bestHipThrust ?? "—"}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>
            No weekly data yet. Log workouts on the Log tab and measurements weekly.
          </Text>
        )}

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setRefreshing(true);
            load();
          }}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  hint: { color: colors.muted, marginBottom: 16, fontSize: 14 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  stat: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.accent },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },
  weekCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  weekTitle: { color: colors.accent, fontWeight: "700", marginBottom: 6 },
  weekLine: { color: colors.text, fontSize: 14, marginBottom: 2 },
  empty: { color: colors.muted, fontStyle: "italic" },
  refreshBtn: { alignSelf: "center", marginTop: 12, padding: 10 },
  refreshText: { color: colors.accent, fontWeight: "600" },
});
