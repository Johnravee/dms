import { SensorData } from "@/hooks/useSensorData";
import { Text, View } from "react-native";

type UserDashboardViewProps = SensorData;

export default function UserDashboardView({
  pm25,
  gas,
  humidity,
  temperature,
  timestamp,
}: UserDashboardViewProps) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  const getSensorStatus = (value: number, type: string) => {
    switch (type) {
      case "pm25":
        if (value >= 0 && value <= 35)
          return {
            status: "Safe",
            color: "bg-green-100",
            textColor: "text-green-600",
            percentage: value,
          };
        if (value > 35 && value <= 75)
          return {
            status: "Moderate",
            color: "bg-yellow-100",
            textColor: "text-yellow-600",
            percentage: value,
          };
        if (value > 75)
          return {
            status: "Hazardous",
            color: "bg-red-100",
            textColor: "text-red-600",
            percentage: value,
          };
      default:
        return {
          status: "Normal",
          color: "bg-blue-100",
          textColor: "text-blue-600",
          percentage: 0,
        };
    }
  };

  const pm25Status = getSensorStatus(pm25, "pm25");

  return (
    <View className="gap-6">
      {/* Last Updated */}
      <View className="rounded-lg bg-white p-4">
        <Text className="text-xs text-gray-500">Last Updated</Text>
        <Text className="mt-1 text-sm font-semibold text-gray-900">
          {formatTime(timestamp)}
        </Text>
      </View>

      {/* Dust Sensor - Primary */}
      <View className={`rounded-lg ${pm25Status.color} p-6`}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-sm text-gray-600">Dust Level</Text>
            <Text className={`mt-2 text-4xl font-bold ${pm25Status.textColor}`}>
              {pm25.toFixed(1)}
            </Text>
            <Text className="mt-1 text-xs text-gray-600">µg/m³</Text>
          </View>
          <View>
            <Text className={`text-sm font-semibold ${pm25Status.textColor}`}>
              {pm25Status.status}
            </Text>
            <Text className={`mt-2 text-2xl font-bold ${pm25Status.textColor}`}>
              {pm25Status.percentage.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="bg-white rounded-full h-2 overflow-hidden">
          <View
            className={`h-full ${
              pm25Status.percentage <= 30
                ? "bg-green-600"
                : pm25Status.percentage <= 60
                  ? "bg-yellow-600"
                  : "bg-red-600"
            }`}
            style={{ width: `${Math.min(pm25Status.percentage, 200)}%` }}
          />
        </View>
      </View>

      {/* Other Sensors Grid */}
      <View className="gap-4">
        {/* Gas */}
        <View className="rounded-lg bg-white p-4">
          <Text className="text-sm font-semibold text-gray-600">Gas Level</Text>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">{gas}</Text>
            <Text className="text-xs text-gray-500">ppm</Text>
          </View>
        </View>

        {/* Humidity & Temperature Row */}
        <View className="flex-row gap-4">
          <View className="flex-1 rounded-lg bg-white p-4">
            <Text className="text-sm font-semibold text-gray-600">
              Humidity
            </Text>
            <View className="mt-2">
              <Text className="text-2xl font-bold text-gray-900">
                {humidity.toFixed(1)}
              </Text>
              <Text className="text-xs text-gray-500">%</Text>
            </View>
          </View>

          <View className="flex-1 rounded-lg bg-white p-4">
            <Text className="text-sm font-semibold text-gray-600">
              Temperature
            </Text>
            <View className="mt-2">
              <Text className="text-2xl font-bold text-gray-900">
                {temperature.toFixed(1)}
              </Text>
              <Text className="text-xs text-gray-500">°C</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View className="rounded-lg bg-blue-50 p-4">
        <Text className="text-center text-xs text-gray-600">
          📊 Real-time sensor data is displayed above
        </Text>
      </View>
    </View>
  );
}
