import apiClient from "./apiClient";
import { getExercisesBySession, getWorkoutSessions } from "./workoutApi";

export interface ExerciseProgressPoint {
  exerciseName: string;
  weight: number;
  reps: number;
  volume: number;
  estimatedOneRepMax: number;
  createdAt: string;
}

export interface WeeklyVolumePoint {
  weekNumber: number;
  totalVolume: number;
}

export type ExerciseEntryOption = {
  id: number;
  exerciseName: string;
  weekNumber: number;
  trainingDay: string;
  workoutDate: string;
};

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

/** Latest exercise entry per lift name — for analytics picker. */
export const listRecentExerciseEntries = async (): Promise<
  ExerciseEntryOption[]
> => {
  const sessions = await getWorkoutSessions();
  const sorted = [...sessions].sort((a, b) =>
    b.workoutDate.localeCompare(a.workoutDate)
  );

  const byName = new Map<string, ExerciseEntryOption>();

  for (const session of sorted) {
    const entries = await getExercisesBySession(session.id);
    for (const entry of entries) {
      const existing = byName.get(entry.exerciseName);
      if (!existing || entry.id > existing.id) {
        byName.set(entry.exerciseName, {
          id: entry.id,
          exerciseName: entry.exerciseName,
          weekNumber: session.weekNumber,
          trainingDay: session.trainingDay,
          workoutDate: session.workoutDate,
        });
      }
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName)
  );
};
