import React, { useCallback, useState } from "react";
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

export default function DashboardScreen() {
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [summary, setSummary] = useState<WeeklySummaryWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [dashboardData, summaryData] = await Promise.all([
        getDashboard(),
        getWeeklySummary(),
      ]);
      setDashboard(dashboardData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Dashboard load failed", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const prs = dashboard?.latestPRMessages ?? [];

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.hint}>8-week block overview — workouts, body, and PRs.</Text>

      <View style={styles.statsRow}>
        <StatCard
          label="Sessions"
          value={String(dashboard?.totalWorkoutSessions ?? 0)}
          sub={`${dashboard?.completedSessions ?? 0} completed`}
        />
        <StatCard
          label="Completion"
          value={`${dashboard?.completionPercentage?.toFixed(0) ?? 0}%`}
        />
        <StatCard label="PRs" value={String(dashboard?.totalPRs ?? 0)} />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Weight"
          value={dashboard?.latestWeight != null ? `${dashboard.latestWeight} kg` : "—"}
        />
        <StatCard
          label="Waist"
          value={dashboard?.latestWaist != null ? `${dashboard.latestWaist} cm` : "—"}
        />
        <StatCard
          label="Hips"
          value={dashboard?.latestHips != null ? `${dashboard.latestHips} cm` : "—"}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent PRs</Text>
        {prs.length ? (
          prs.map((pr, index) => (
            <Text key={index} style={styles.prLine}>
              • {pr}
            </Text>
          ))
        ) : (
          <Text style={styles.empty}>No PRs logged yet — hit a new best on the Log tab.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Weekly snapshot</Text>
      {summary.length ? (
        summary.slice(0, 4).map((week) => (
          <View key={week.weekNumber} style={styles.weekCard}>
            <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
            <Text style={styles.weekLine}>
              Weight {week.bodyWeight ?? "—"} kg · Waist {week.waist ?? "—"} · Volume{" "}
              {week.totalVolume ?? "—"}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>Log measurements and sets to see weekly trends.</Text>
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  loader: { padding: 32, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  hint: { color: colors.muted, fontSize: 14, marginBottom: 16 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  stat: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.accent },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },
  statSub: { fontSize: 10, color: colors.muted, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 8 },
  prLine: { color: colors.text, fontSize: 14, marginBottom: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  weekCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  weekTitle: { color: colors.accent, fontWeight: "700", marginBottom: 4 },
  weekLine: { color: colors.text, fontSize: 13 },
  empty: { color: colors.muted, fontSize: 14, fontStyle: "italic" },
  refreshBtn: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  refreshText: { color: colors.accent, fontWeight: "600" },
});
