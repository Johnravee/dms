import { AlertProvider } from "@/contexts/alert-context";
import { AuthProvider } from "@/contexts/auth-context";
import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(dashboard)" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </AlertProvider>
      <StatusBar hidden />
    </AuthProvider>
  );
}
