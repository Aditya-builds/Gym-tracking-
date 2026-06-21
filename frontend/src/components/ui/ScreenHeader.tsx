import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme/colors";

type Props = {
  title: string;
  subtitle?: string;
  step?: { current: number; total: number };
};

export default function ScreenHeader({ title, subtitle, step }: Props) {
  return (
    <View style={styles.wrap}>
      {step ? (
        <View style={styles.stepRow}>
          {Array.from({ length: step.total }).map((_, i) => (
            <View
              key={i}
              style={[styles.stepDot, i < step.current && styles.stepDotActive]}
            />
          ))}
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.lg },
  stepRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderSubtle,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
});
