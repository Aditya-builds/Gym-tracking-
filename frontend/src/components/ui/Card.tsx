import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../../theme/colors";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
};

export default function Card({ children, style, glow }: Props) {
  return (
    <View style={[styles.card, glow && styles.glow, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.md,
  },
  glow: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bgElevated,
  },
});
