import "./src/global.css";
import "./src/i18n/config";

import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import type { RootStackParamList } from "./src/navigation/types";

// Routes password-recovery links (spinefit://reset-password, or the exp://
// equivalent in Expo Go) from Supabase emails to the ResetPassword screen.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "spinefit://"],
  // The OAuth callback is consumed imperatively in signInWithGoogle; keep
  // React Navigation from acting on it.
  filter: (url) => !url.includes("auth-callback"),
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: "reset-password",
        },
      },
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
