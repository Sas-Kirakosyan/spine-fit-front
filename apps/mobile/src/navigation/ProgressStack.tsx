import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProgressStackParamList } from "./types";
import ProgressScreen from "../screens/ProgressScreen";
import ExerciseProgressScreen from "../screens/ExerciseProgressScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export default function ProgressStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#080A14" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="ProgressMain" component={ProgressScreen} />
      <Stack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
