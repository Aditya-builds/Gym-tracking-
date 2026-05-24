import React, { useState } from "react";
import AppShell, { TabId } from "../components/AppShell";
import DashboardScreen from "./DashboardScreen";
import TodayScreen from "./TodayScreen";
import WorkoutScreen from "./WorkoutScreen";
import AnalyticsScreen from "./AnalyticsScreen";
import MeasurementScreen from "./MeasurementScreen";
import WeeklySummaryScreen from "./WeeklySummaryScreen";
import BackupScreen from "./BackupScreen";

export default function MainScreen() {
  const [tab, setTab] = useState<TabId>("dashboard");

  return (
    <AppShell activeTab={tab} onTabChange={setTab}>
      {tab === "dashboard" && <DashboardScreen />}
      {tab === "today" && <TodayScreen />}
      {tab === "log" && <WorkoutScreen />}
      {tab === "analytics" && <AnalyticsScreen />}
      {tab === "measurements" && <MeasurementScreen />}
      {tab === "summary" && <WeeklySummaryScreen />}
      {tab === "backup" && <BackupScreen />}
    </AppShell>
  );
}
