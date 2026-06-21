import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import DashboardScreen from "./DashboardScreen";
import MeasurementScreen from "./MeasurementScreen";
import BackupScreen from "./BackupScreen";
import WeeklySummaryScreen from "./WeeklySummaryScreen";
import ScreenHeader from "../components/ui/ScreenHeader";
import Chip from "../components/ui/Chip";
import { theme } from "../theme/colors";

type MoreSection = "overview" | "body" | "summary" | "backup";

export default function MoreScreen() {
  const [section, setSection] = useState<MoreSection>("overview");

  return (
    <View>
      <ScreenHeader title="More" subtitle="Overview, measurements, and backup." />
      <View style={styles.chips}>
        {(
          [
            ["overview", "Overview"],
            ["body", "Body"],
            ["summary", "Summary"],
            ["backup", "Backup"],
          ] as const
        ).map(([id, label]) => (
          <Chip
            key={id}
            label={label}
            selected={section === id}
            onPress={() => setSection(id)}
          />
        ))}
      </View>
      {section === "overview" && <DashboardScreen />}
      {section === "body" && <MeasurementScreen />}
      {section === "summary" && <WeeklySummaryScreen />}
      {section === "backup" && <BackupScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.md,
  },
});
