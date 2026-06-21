import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme/colors";
import BottomNav from "./BottomNav";

export type TabId = "plan" | "workout" | "progress" | "more";

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
};

export default function AppShell({ activeTab, onTabChange, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <SafeAreaView edges={["bottom"]} style={styles.navSafe}>
        <BottomNav active={activeTab} onChange={onTabChange} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  navSafe: {
    backgroundColor: theme.colors.bgElevated,
  },
});
