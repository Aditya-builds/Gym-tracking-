import React, { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { theme } from "../theme/colors";

export type ChartPoint = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  points: ChartPoint[];
  unit?: string;
  emptyMessage?: string;
  height?: number;
};

const PADDING = 14;
const LABEL_HEIGHT = 18;

export default function ProgressChart({
  title,
  points,
  unit = "kg",
  emptyMessage = "No data yet — log sets to see progress.",
  height = 140,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(260, Math.min(windowWidth - 64, 360));

  const layout = useMemo(() => {
    if (!points.length) return null;

    const values = points.map((p) => p.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const plotHeight = height - PADDING * 2;

    const coords = points.map((point, index) => {
      const x =
        points.length === 1
          ? chartWidth / 2
          : PADDING + (index / (points.length - 1)) * (chartWidth - PADDING * 2);
      const y = PADDING + (1 - (point.value - min) / range) * plotHeight;
      return { x, y, label: point.label, value: point.value };
    });

    return {
      coords,
      max,
      min,
      polyline: coords.map((c) => `${c.x},${c.y}`).join(" "),
      svgHeight: height + LABEL_HEIGHT,
    };
  }, [points, chartWidth, height]);

  if (!points.length || !layout) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>{emptyMessage}</Text>
      </View>
    );
  }

  const { coords, max, polyline, svgHeight } = layout;
  const latest = points[points.length - 1].value;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartRow}>
        <View style={styles.plotWrap}>
          <Svg width={chartWidth} height={svgHeight}>
            <Line
              x1={PADDING}
              y1={height - PADDING}
              x2={chartWidth - PADDING}
              y2={height - PADDING}
              stroke={theme.colors.borderSubtle}
              strokeWidth={1}
            />
            <Line
              x1={PADDING}
              y1={PADDING}
              x2={PADDING}
              y2={height - PADDING}
              stroke={theme.colors.borderSubtle}
              strokeWidth={1}
            />
            {points.length > 1 ? (
              <Polyline
                points={polyline}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {coords.map((c, index) => (
              <React.Fragment key={`${c.label}-${index}`}>
                <Circle
                  cx={c.x}
                  cy={c.y}
                  r={5}
                  fill={theme.colors.primary}
                  stroke={theme.colors.bg}
                  strokeWidth={2}
                />
                <SvgText
                  x={c.x}
                  y={height + 12}
                  fill={theme.colors.textMuted}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {c.label}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>
        <View style={styles.yAxis}>
          <Text style={styles.axisText}>{max.toFixed(0)}</Text>
          <Text style={styles.axisText}>{layout.min.toFixed(0)}</Text>
        </View>
      </View>
      <Text style={styles.peak}>
        Peak: {max.toFixed(1)} {unit}
        {points.length > 1 ? ` · Latest: ${latest.toFixed(1)} ${unit}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
  },
  empty: {
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    fontSize: 14,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  plotWrap: {
    flex: 1,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: "hidden",
  },
  yAxis: {
    width: 32,
    height: 140,
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  axisText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: "right",
  },
  peak: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
});
