import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { theme } from "../../theme/colors";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  large?: boolean;
};

export default function Chip({ label, selected, onPress, large }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selected, large && styles.large]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bgElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginRight: 8,
    marginBottom: 8,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  text: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  textSelected: {
    color: theme.colors.primaryText,
  },
});
