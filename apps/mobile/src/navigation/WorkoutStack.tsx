import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { WorkoutStackParamList } from "./types";
import WorkoutScreen from "../screens/WorkoutScreen";
import ActiveWorkoutScreen from "../screens/ActiveWorkoutScreen";
import ExerciseSetsScreen from "../screens/ExerciseSetsScreen";
import ExerciseDetailsScreen from "../screens/ExerciseDetailsScreen";
import MyPlanScreen from "../screens/MyPlanScreen";
import AvailableEquipmentScreen from "../screens/AvailableEquipmentScreen";
import CreateProgramScreen from "../screens/CreateProgramScreen";
import AllExerciseScreen from "../screens/AllExerciseScreen";

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#080A14" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="WorkoutMain" component={WorkoutScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen name="ExerciseSets" component={ExerciseSetsScreen} />
      <Stack.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
      <Stack.Screen name="MyPlan" component={MyPlanScreen} />
      <Stack.Screen name="AvailableEquipment" component={AvailableEquipmentScreen} />
      <Stack.Screen name="CreateProgram" component={CreateProgramScreen} />
      <Stack.Screen
        name="AllExercise"
        component={AllExerciseScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack.Navigator>
  );
}
