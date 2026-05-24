import apiClient from "./apiClient";

export interface DashboardOverview {
  totalWorkoutSessions: number;
  completedSessions: number;
  completionPercentage: number;
  latestWeight?: number;
  latestWaist?: number;
  latestHips?: number;
  totalPRs: number;
  latestPRMessages?: string[];
}

export interface WeeklySummaryWeek {
  weekNumber: number;
  bodyWeight?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  totalVolume?: number;
  bestSquat?: number;
  bestHipThrust?: number;
}

export const getDashboard = async (): Promise<DashboardOverview> => {
  const response = await apiClient.get("/api/dashboard");
  return response.data;
};

export const getWeeklySummary = async (): Promise<WeeklySummaryWeek[]> => {
  const response = await apiClient.get("/api/summary/weekly");
  return response.data;
};
