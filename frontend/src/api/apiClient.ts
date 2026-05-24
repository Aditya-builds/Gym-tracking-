import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveBaseUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080";
  }
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "http://localhost:8080";
}

const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
