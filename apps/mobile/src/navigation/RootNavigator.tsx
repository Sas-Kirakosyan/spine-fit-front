import { useEffect, useState } from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { navigationRef } from "./navigationRef";
import { supabase } from "../lib/supabase";
import { PageLoader } from "../components/common/PageLoader";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<"Auth" | "Main" | null>(
    null
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInitialRoute(session ? "Main" : "Auth");
    });
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      if (!navigationRef.isReady()) return;
      // Only kick the user out of the Main stack. A sign-out that happens
      // while already in the Auth stack (e.g. the password-recovery flow
      // signs out after updating the password) must not reset navigation.
      const state = navigationRef.getRootState();
      const currentRoot = state?.routes[state.index]?.name;
      if (currentRoot === "Main") {
        navigationRef.resetRoot({ index: 0, routes: [{ name: "Auth" }] });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!initialRoute) {
    return (
      <View className="flex-1 bg-[#080A14]">
        <PageLoader />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#080A14" },
      }}
    >
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}
