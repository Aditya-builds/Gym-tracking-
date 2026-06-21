import React, { useCallback, useMemo, useState } from "react";
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
import { getMeasurements } from "../api/measurementApi";
import Card from "../components/ui/Card";
import ProgressChart from "../components/ProgressChart";
import ScreenHeader from "../components/ui/ScreenHeader";
import {
  measurementWeightChart,
  weeklyFieldToChart,
} from "../utils/dashboardCharts";
import { theme } from "../theme/colors";

export default function DashboardScreen() {
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [summary, setSummary] = useState<WeeklySummaryWeek[]>([]);
  const [measurements, setMeasurements] = useState<
    Array<{ measurementDate: string; bodyWeight?: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [dashboardData, summaryData, measurementData] = await Promise.all([
        getDashboard(),
        getWeeklySummary(),
        getMeasurements().catch(() => []),
      ]);
      setDashboard(dashboardData);
      setSummary(summaryData);
      setMeasurements(measurementData ?? []);
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

  const weightChart = useMemo(() => {
    const fromMeasurements = measurementWeightChart(measurements);
    if (fromMeasurements.length) return fromMeasurements;
    return weeklyFieldToChart(summary, "bodyWeight");
  }, [measurements, summary]);

  const volumeChart = useMemo(
    () => weeklyFieldToChart(summary, "totalVolume"),
    [summary]
  );

  const waistChart = useMemo(
    () => weeklyFieldToChart(summary, "waist"),
    [summary]
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const prs = dashboard?.latestPRMessages ?? [];

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <ScreenHeader
        title="Dashboard"
        subtitle="8-week block overview — workouts, body trends, and PRs."
      />

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
          value={
            dashboard?.latestWeight != null
              ? `${dashboard.latestWeight} kg`
              : "—"
          }
        />
        <StatCard
          label="Waist"
          value={
            dashboard?.latestWaist != null ? `${dashboard.latestWaist} cm` : "—"
          }
        />
        <StatCard
          label="Hips"
          value={
            dashboard?.latestHips != null ? `${dashboard.latestHips} cm` : "—"
          }
        />
      </View>

      <Text style={styles.sectionTitle}>Trends</Text>
      <Card style={styles.chartCard}>
        <ProgressChart
          title="Body weight"
          points={weightChart}
          unit="kg"
          emptyMessage="Log measurements to see your weight trend."
        />
      </Card>
      <Card style={styles.chartCard}>
        <ProgressChart
          title="Weekly training volume"
          points={volumeChart}
          unit="kg"
          emptyMessage="Log workout sets to see volume over time."
        />
      </Card>
      <Card style={styles.chartCard}>
        <ProgressChart
          title="Waist"
          points={waistChart}
          unit="cm"
          emptyMessage="Log waist measurements to see this trend."
        />
      </Card>

      <Card style={styles.prCard}>
        <Text style={styles.cardTitle}>Recent PRs</Text>
        {prs.length ? (
          prs.map((pr, index) => (
            <Text key={index} style={styles.prLine}>
              • {pr}
            </Text>
          ))
        ) : (
          <Text style={styles.empty}>
            No PRs logged yet — hit a new best on the Workout tab.
          </Text>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Weekly snapshot</Text>
      {summary.length ? (
        summary.slice(0, 4).map((week) => (
          <View key={week.weekNumber} style={styles.weekCard}>
            <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
            <Text style={styles.weekLine}>
              Weight {week.bodyWeight ?? "—"} kg · Waist {week.waist ?? "—"} ·
              Volume {week.totalVolume ?? "—"}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>
          Log measurements and sets to see weekly trends.
        </Text>
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
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  stat: {
    flex: 1,
    minWidth: 100,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  statSub: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  chartCard: { marginBottom: theme.spacing.sm },
  prCard: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.md },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  prLine: { color: theme.colors.text, fontSize: 14, marginBottom: 4 },
  weekCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  weekTitle: {
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: 4,
  },
  weekLine: { color: theme.colors.text, fontSize: 13 },
  empty: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
  },
  refreshBtn: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  refreshText: { color: theme.colors.primary, fontWeight: "600" },
});
