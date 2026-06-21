import apiClient from "./apiClient";

export interface ExerciseProgressPoint {
  exerciseName: string;
  weight: number;
  reps: number;
  volume: number;
  estimatedOneRepMax: number;
  createdAt: string;
  workoutDate?: string;
  weekNumber?: number;
  trainingDay?: string;
  setNumber?: number;
  notes?: string;
}

export interface WeeklyVolumePoint {
  weekNumber: number;
  totalVolume: number;
}

export const getExerciseProgress = async (
  exerciseEntryId: number
): Promise<ExerciseProgressPoint[]> => {
  const response = await apiClient.get(
    `/api/analytics/exercise/${exerciseEntryId}`
  );
  return response.data;
};

export const getWeeklyVolume = async (
  exerciseEntryId: number
): Promise<WeeklyVolumePoint[]> => {
  const response = await apiClient.get(
    `/api/analytics/volume/${exerciseEntryId}`
  );
  return response.data;
};

export const getProgressByExerciseName = async (
  exerciseName: string,
  trainingDay?: string
): Promise<ExerciseProgressPoint[]> => {
  const response = await apiClient.get("/api/analytics/by-name", {
    params: {
      name: exerciseName,
      ...(trainingDay ? { trainingDay } : {}),
    },
  });
  return response.data;
};

export const getWeeklyVolumeByExerciseName = async (
  exerciseName: string,
  trainingDay?: string
): Promise<WeeklyVolumePoint[]> => {
  const response = await apiClient.get("/api/analytics/volume-by-name", {
    params: {
      name: exerciseName,
      ...(trainingDay ? { trainingDay } : {}),
    },
  });
  return response.data;
};

/** Best weight per workout date — for progress charts. */
export function bestWeightBySession(
  points: ExerciseProgressPoint[]
): { label: string; value: number }[] {
  const byDate = new Map<string, number>();

  for (const point of points) {
    const date = point.workoutDate ?? point.createdAt?.slice(0, 10) ?? "?";
    const weight = Number(point.weight) || 0;
    byDate.set(date, Math.max(byDate.get(date) ?? 0, weight));
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label: label.slice(5), value }));
}

/** Best estimated 1RM per workout date. */
export function bestE1rmBySession(
  points: ExerciseProgressPoint[]
): { label: string; value: number }[] {
  const byDate = new Map<string, number>();

  for (const point of points) {
    const date = point.workoutDate ?? point.createdAt?.slice(0, 10) ?? "?";
    const e1rm = Number(point.estimatedOneRepMax) || 0;
    byDate.set(date, Math.max(byDate.get(date) ?? 0, e1rm));
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label: label.slice(5), value }));
}
