import React, { useState } from "react";
import AppShell, { TabId } from "../components/AppShell";
import PlanBuilderScreen from "./PlanBuilderScreen";
import WorkoutLogScreen from "./WorkoutLogScreen";
import AnalyticsScreen from "./AnalyticsScreen";
import MoreScreen from "./MoreScreen";

export default function MainScreen() {
  const [tab, setTab] = useState<TabId>("plan");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null
  );

  const handlePlanSaved = () => {
    setSaveSuccessMessage(
      "Workout plan saved successfully! Pick a day to start logging."
    );
    setTab("workout");
  };

  return (
    <AppShell activeTab={tab} onTabChange={setTab}>
      {tab === "plan" && <PlanBuilderScreen onPlanSaved={handlePlanSaved} />}
      {tab === "workout" && (
        <WorkoutLogScreen
          successMessage={saveSuccessMessage}
          onDismissSuccessMessage={() => setSaveSuccessMessage(null)}
        />
      )}
      {tab === "progress" && <AnalyticsScreen />}
      {tab === "more" && <MoreScreen />}
    </AppShell>
  );
}
