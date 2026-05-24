import apiClient from "./apiClient";

export interface PlanExercise {
  name: string;
  sectionName?: string;
  sets?: number;
  reps?: string;
  prescription?: string;
  notes?: string;
  loggable?: boolean;
}

export interface PlanSection {
  name: string;
  exercises: PlanExercise[];
}

export interface PlanDay {
  dayNumber: number;
  title: string;
  label: string;
  sections: PlanSection[];
}

export interface WorkoutPlan {
  planName?: string;
  weeks?: number;
  focus?: string;
  trainingDays?: string[];
  exercises?: { id?: number; exerciseName: string; muscleGroup?: string }[];
  daySchedule?: Record<string, string[]>;
  days?: PlanDay[];
  weekPhases?: string[];
}

export const importWorkoutPlanText = async (text: string): Promise<WorkoutPlan> => {
  const response = await apiClient.post("/api/plan/import/text", text, {
    headers: { "Content-Type": "text/plain" },
  });
  return response.data;
};

export function getExercisesForDay(plan: WorkoutPlan | null, dayLabel: string): PlanExercise[] {
  const day = plan?.days?.find((d) => d.label === dayLabel);
  if (!day?.sections) return [];
  return day.sections.flatMap((s) =>
    s.exercises.filter((e) => e.loggable !== false)
  );
}

export const getWorkoutPlan = async (): Promise<WorkoutPlan> => {
  const response = await apiClient.get("/api/plan");
  return response.data;
};

export const importWorkoutPlan = async (plan: WorkoutPlan) => {
  const response = await apiClient.post("/api/plan/import", plan);
  return response.data;
};

export const exportBackup = async () => {
  const response = await apiClient.get("/api/backup/export");
  return response.data;
};
