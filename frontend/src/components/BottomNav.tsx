import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../theme/colors";
import { TabId } from "./AppShell";

const NAV: { id: TabId; label: string; icon: string }[] = [
  { id: "plan", label: "Plan", icon: "◫" },
  { id: "workout", label: "Workout", icon: "▶" },
  { id: "progress", label: "Progress", icon: "↗" },
  { id: "more", label: "More", icon: "⋯" },
];

type Props = {
  active: TabId;
  onChange: (tab: TabId) => void;
};

export default function BottomNav({ active, onChange }: Props) {
  return (
    <View style={styles.bar}>
      {NAV.map((item) => {
        const selected = active === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => onChange(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Text style={[styles.icon, selected && styles.iconActive]}>
                {item.icon}
              </Text>
            </View>
            <Text style={[styles.label, selected && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgElevated,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconWrapActive: {
    backgroundColor: theme.colors.accentGlow,
  },
  icon: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  iconActive: {
    color: theme.colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  labelActive: {
    color: theme.colors.primary,
  },
});
