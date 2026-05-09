import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isLoggedIn ? (
    <Redirect href="/(dashboard)/dashboard" />
  ) : (
    <Redirect href="/login" />
  );
}
