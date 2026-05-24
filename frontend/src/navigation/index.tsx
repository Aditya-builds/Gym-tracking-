/**
 * Alternate bottom-tab navigator (Dashboard, Workout, Measurements, Analytics).
 * The app entry uses AppNavigator → MainScreen with AppShell pills instead.
 * Import this from App.tsx if you prefer native bottom tabs.
 */
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "../theme/colors";

import DashboardScreen from "../screens/DashboardScreen";
import TodayScreen from "../screens/TodayScreen";
import WorkoutScreen from "../screens/WorkoutScreen";
import MeasurementScreen from "../screens/MeasurementScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Log" component={WorkoutScreen} />
      <Tab.Screen name="Measurements" component={MeasurementScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}
