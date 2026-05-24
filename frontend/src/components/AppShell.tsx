import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

export type TabId =
  | "dashboard"
  | "today"
  | "log"
  | "analytics"
  | "measurements"
  | "summary"
  | "backup";

const TABS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "today", label: "Today" },
  { id: "log", label: "Log" },
  { id: "analytics", label: "Analytics" },
  { id: "measurements", label: "Measurements" },
  { id: "summary", label: "Summary" },
  { id: "backup", label: "Backup" },
];

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
};

export default function AppShell({ activeTab, onTabChange, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Gym Progress Tracker</Text>
        <Text style={styles.subtitle}>
          8-week blocks: plan, log, analytics, and weekly trends. Syncs to Quarkus API.
        </Text>
        <View style={styles.badges}>
          <Text style={styles.badge}>Focus: V-taper, glutes & thighs, slimmer waist</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => onTabChange(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerBlock: { paddingHorizontal: 16, paddingTop: 8 },
  bodyScroll: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 6 },
  subtitle: { color: colors.muted, marginBottom: 10, lineHeight: 20, fontSize: 14 },
  badges: { marginBottom: 12 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
  },
  tabScroll: { marginBottom: 8, maxHeight: 48 },
  tabs: { flexDirection: "row", gap: 8, paddingRight: 16 },
  tab: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.muted, fontSize: 14 },
  tabTextActive: { color: colors.accentText, fontWeight: "600" },
});
