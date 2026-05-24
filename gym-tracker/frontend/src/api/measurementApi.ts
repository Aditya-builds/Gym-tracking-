import apiClient from "./apiClient";

export interface CreateMeasurementPayload {
  measurementDate: string;
  weekNumber: number;
  bodyWeight?: number;
  waistNavel?: number;
  waistSmallest?: number;
  hips?: number;
  thigh?: number;
  chest?: number;
  shoulders?: number;
  arm?: number;
  notes?: string;
}

export const createMeasurement = async (payload: CreateMeasurementPayload) => {
  const response = await apiClient.post("/api/measurements", payload);
  return response.data;
};

export const getMeasurements = async () => {
  const response = await apiClient.get("/api/measurements");
  return response.data;
};

export const getLatestMeasurement = async () => {
  const response = await apiClient.get("/api/measurements/latest");
  return response.data;
};
