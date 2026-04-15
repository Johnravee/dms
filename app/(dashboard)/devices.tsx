import { useSensorData } from "@/hooks/useSensorData";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
export default function DevicesScreen() {
  const { devices, fanStatus, loading } = useSensorData();

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-24"
    >
      <View className="px-4 pt-8">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">Controls</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Manage your sensors and devices
          </Text>
        </View>

        {/* Fan Status Card */}
        <View className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-gray-900">
                Fan Status
              </Text>
              <Text className="mt-1 text-sm text-gray-500">
                {fanStatus ? "Currently On" : "Currently Off"}
              </Text>
            </View>
            <View
              className={`h-12 w-12 items-center justify-center rounded-full ${
                fanStatus ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={fanStatus ? "text-2xl" : "text-2xl text-gray-400"}
              >
                {fanStatus ? "✓" : "○"}
              </Text>
            </View>
          </View>
        </View>

        {/* Devices List */}
        <View>
          <Text className="mb-4 text-lg font-semibold text-gray-900">
            All Devices
          </Text>
          {loading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : devices.length > 0 ? (
            devices.map((device) => (
              <View
                key={device.id}
                className="mb-3 flex-row items-center rounded-lg bg-white p-4 shadow-sm"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {device.name}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-500">
                    {device.type} • {device.status}
                  </Text>
                </View>
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    device.isOn ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={
                      device.isOn
                        ? "text-lg text-green-600"
                        : "text-lg text-gray-400"
                    }
                  >
                    {device.isOn ? "ON" : "OFF"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="rounded-lg bg-white p-6">
              <Text className="text-center text-gray-500">
                No devices found. Check your Realtime Database setup.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
