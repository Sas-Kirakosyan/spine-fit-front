import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import type { MainTabsParamList } from "./types";
import WorkoutStack from "./WorkoutStack";
import ProgressStack from "./ProgressStack";
import HistoryScreen from "../screens/HistoryScreen";
import AIScreen from "../screens/AIScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator<MainTabsParamList>();

function WorkoutIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18.5 6h-13" />
      <Path d="M5.5 6V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      <Path d="M7 10h2v9H7z" />
      <Path d="M15 10h2v9h-2z" />
      <Path d="M11 10h2v9h-2z" />
    </Svg>
  );
}

function ProgressIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="18" y1="20" x2="18" y2="10" />
      <Line x1="12" y1="20" x2="12" y2="4" />
      <Line x1="6" y1="20" x2="6" y2="14" />
    </Svg>
  );
}

function HistoryIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

function AIIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.card.primary,
          borderTopColor: colors.border.secondary,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="WorkoutTab"
        component={WorkoutStack}
        options={{
          tabBarLabel: "Workout",
          tabBarIcon: ({ color, size }) => <WorkoutIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressStack}
        options={{
          tabBarLabel: "Progress",
          tabBarIcon: ({ color, size }) => <ProgressIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => <HistoryIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AIScreen}
        options={{
          tabBarLabel: "AI",
          tabBarIcon: ({ color, size }) => <AIIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
