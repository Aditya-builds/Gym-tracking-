import apiClient from "./apiClient";

export interface CreateWorkoutSessionPayload {
  workoutDate: string;
  weekNumber: number;
  trainingDay: string;
  durationMinutes?: number;
  energyLevel?: number;
  completed?: boolean;
  sessionNotes?: string;
}

export interface WorkoutSession {
  id: number;
  workoutDate: string;
  weekNumber: number;
  trainingDay: string;
  durationMinutes?: number;
  energyLevel?: number;
  completed?: boolean;
  sessionNotes?: string;
  createdAt?: string;
}

export interface CreateExerciseEntryPayload {
  workoutSessionId: number;
  exerciseDefinitionId: number;
  orderIndex?: number;
  exerciseNotes?: string;
}

export interface ExerciseEntry {
  id: number;
  workoutSessionId: number;
  exerciseDefinitionId: number;
  exerciseName: string;
  orderIndex?: number;
  exerciseNotes?: string;
}

export interface CreateSetEntryPayload {
  exerciseEntryId: number;
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
}

export interface SetEntry {
  id: number;
  exerciseEntryId: number;
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  isPr?: boolean;
  volume?: number;
  estimatedOneRepMax?: number;
  createdAt?: string;
}

/** Matches backend seed.json key lifts catalog */
export const EXERCISE_DEFINITIONS = [
  { id: 1, name: "Pull-up" },
  { id: 2, name: "Lat Pulldown" },
  { id: 3, name: "Chest Supported Row" },
  { id: 4, name: "Back Squat" },
  { id: 5, name: "Romanian Deadlift" },
  { id: 6, name: "Leg Press" },
  { id: 7, name: "Bulgarian Split Squat" },
  { id: 8, name: "Barbell Hip Thrust" },
  { id: 9, name: "Incline Dumbbell Press" },
  { id: 10, name: "Overhead Press" },
] as const;

export const TRAINING_DAYS = [
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
] as const;

export const createWorkoutSession = async (
  payload: CreateWorkoutSessionPayload
): Promise<WorkoutSession> => {
  const response = await apiClient.post("/api/workouts", payload);
  return response.data;
};

export const getWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  const response = await apiClient.get("/api/workouts");
  return response.data;
};

export const createExerciseEntry = async (
  payload: CreateExerciseEntryPayload
): Promise<ExerciseEntry> => {
  const response = await apiClient.post("/api/exercises", payload);
  return response.data;
};

export const getExercisesBySession = async (
  sessionId: number
): Promise<ExerciseEntry[]> => {
  const response = await apiClient.get(
    `/api/exercises/session/${sessionId}`
  );
  return response.data;
};

export const createSetEntry = async (
  payload: CreateSetEntryPayload
): Promise<SetEntry> => {
  const response = await apiClient.post("/api/sets", payload);
  return response.data;
};

export const getSetsByExercise = async (
  exerciseEntryId: number
): Promise<SetEntry[]> => {
  const response = await apiClient.get(
    `/api/sets/exercise/${exerciseEntryId}`
  );
  return response.data;
};
