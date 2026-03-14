import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Exercise } from "@spinefit/shared";

export type AuthStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
};

export type WorkoutStackParamList = {
  WorkoutMain: undefined;
  ActiveWorkout: undefined;
  ExerciseSets: { exercise: Exercise; mode: "preWorkout" | "activeWorkout" };
  ExerciseDetails: { exercise: Exercise };
  MyPlan: undefined;
  AvailableEquipment: undefined;
  CreateProgram: undefined;
  AllExercise: { returnTo: "workout" | "createProgram" };
};

export type ProgressStackParamList = {
  ProgressMain: undefined;
  ExerciseProgress: { exerciseId: number };
  Settings: undefined;
};

export type HistoryStackParamList = {
  HistoryMain: undefined;
};

export type AIStackParamList = {
  AIMain: undefined;
};

export type MainTabsParamList = {
  WorkoutTab: NavigatorScreenParams<WorkoutStackParamList>;
  ProgressTab: NavigatorScreenParams<ProgressStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
  AITab: NavigatorScreenParams<AIStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabsParamList>;
};
