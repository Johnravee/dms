import UserDashboardView from "@/components/user-dashboard-view";
import { useAuth } from "@/contexts/auth-context";
import { useSensorData } from "@/hooks/useSensorData";
// import { seedDatabase } from "@/scripts/seed-database";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function DashboardScreen() {
  const { sensorData, loading } = useSensorData();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error logging out");
    }
  };

  // const handleSeedDatabase = async () => {
  //   try {
  //     await seedDatabase();
  //     alert("Database seeded successfully!");
  //   } catch (err) {
  //     alert(
  //       "Error seeding database: " +
  //         (err instanceof Error ? err.message : "Unknown error"),
  //     );
  //   }
  // };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-24"
    >
      <View className="px-4 pt-8">
        {/* Header */}
        <View className="mb-8 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-900">Dashboard</Text>
            <Text className="mt-1 text-sm text-gray-500">
              Real-time Sensor Monitoring
            </Text>
          </View>
          <View className="flex-row gap-2">
            {/* <Pressable
              onPress={handleSeedDatabase}
              className="rounded-lg bg-blue-50 p-2 active:bg-blue-100"
            >
              <Ionicons name="flask" size={24} color="#3b82f6" />
            </Pressable> */}
            <Pressable
              onPress={handleLogout}
              className="rounded-lg bg-red-50 p-2 active:bg-red-100"
            >
              <Ionicons name="log-out" size={24} color="#dc2626" />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <UserDashboardView
            pm25={sensorData.pm25}
            gas={sensorData.gas}
            humidity={sensorData.humidity}
            temperature={sensorData.temperature}
            timestamp={sensorData.timestamp}
          />
        )}
      </View>
    </ScrollView>
  );
}
