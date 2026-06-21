import { ChartPoint } from "../components/ProgressChart";
import { WeeklySummaryWeek } from "../api/dashboardApi";

export function weeklyFieldToChart(
  weeks: WeeklySummaryWeek[],
  field: "bodyWeight" | "totalVolume" | "waist"
): ChartPoint[] {
  return [...weeks]
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .filter((w) => w[field] != null && !Number.isNaN(Number(w[field])))
    .map((w) => ({
      label: `W${w.weekNumber}`,
      value: Number(w[field]),
    }));
}

export function measurementWeightChart(
  measurements: Array<{ measurementDate: string; bodyWeight?: number }>
): ChartPoint[] {
  return [...measurements]
    .filter((m) => m.bodyWeight != null && !Number.isNaN(Number(m.bodyWeight)))
    .sort((a, b) => a.measurementDate.localeCompare(b.measurementDate))
    .map((m) => ({
      label: m.measurementDate.slice(5),
      value: Number(m.bodyWeight),
    }));
}
