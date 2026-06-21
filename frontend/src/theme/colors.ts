/** Modern fitness-app design tokens (Strong / Hevy inspired). */
export const theme = {
  colors: {
    bg: "#09090B",
    bgElevated: "#111114",
    surface: "#18181B",
    surfaceHover: "#27272A",
    border: "#3F3F46",
    borderSubtle: "#27272A",
    text: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryText: "#FFFFFF",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    accentGlow: "rgba(99, 102, 241, 0.15)",
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    hero: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5 },
    title: { fontSize: 22, fontWeight: "700" as const },
    subtitle: { fontSize: 15, fontWeight: "600" as const },
    body: { fontSize: 15, fontWeight: "400" as const },
    caption: { fontSize: 13, fontWeight: "500" as const },
    label: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
    },
  },
};

/** Legacy alias — screens still importing colors.ts */
export const colors = {
  bg: theme.colors.bg,
  card: theme.colors.surface,
  cardBorder: theme.colors.borderSubtle,
  text: theme.colors.text,
  muted: theme.colors.textSecondary,
  accent: theme.colors.primary,
  accentText: theme.colors.primaryText,
  inputBg: theme.colors.bgElevated,
  pillBg: theme.colors.surfaceHover,
  error: theme.colors.error,
};
