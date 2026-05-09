import { rtdb } from "@/config/firebase";
import { useSensorData } from "@/hooks/useSensorData";
import { Ionicons } from "@expo/vector-icons";
import { ref, update } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

export default function ControlsScreen() {
  const { sensorData, devices, fanStatus, loading } = useSensorData();
  const [updating, setUpdating] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState<boolean>(false);

  const fanDevice = devices.find((device) => device.id === "fan1");

  // Toggle fan on/off
  const handleFanToggle = useCallback(async (newStatus: boolean) => {
    try {
      setUpdating("fan");
      await update(ref(rtdb, "devices/fan1"), {
        isOn: newStatus,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error updating fan:", err);
      alert("Failed to update fan status");
    } finally {
      setUpdating(null);
    }
  }, []);

  const handleAutoModeToggle = async (enabled: boolean) => {
    try {
      setUpdating("auto-mode");
      await update(ref(rtdb, "devices/fan1"), {
        isAuto: enabled,
        mode: enabled ? "auto" : "manual",
        lastUpdated: new Date().toISOString(),
      });
      setAutoMode(enabled);
    } catch (err) {
      console.error("Error updating auto mode:", err);
      alert("Failed to update auto mode");
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    if (fanDevice?.isAuto !== undefined) {
      setAutoMode(Boolean(fanDevice.isAuto));
    } else if (fanDevice?.mode) {
      setAutoMode(fanDevice.mode === "auto");
    }
  }, [fanDevice?.isAuto, fanDevice?.mode]);

  useEffect(() => {
    if (!autoMode) {
      return;
    }

    const pm25 = Number(sensorData?.pm25) || 0;
    const gas = Number(sensorData?.gas) || 0;
    const isHazardous = pm25 >= 36 || gas >= 1001;
    const isSafe = pm25 <= 12 && gas <= 750;

    if (isHazardous && !fanStatus) {
      void handleFanToggle(true);
    }

    if (isSafe && fanStatus) {
      void handleFanToggle(false);
    }
  }, [autoMode, fanStatus, sensorData, handleFanToggle]);

  // Toggle any device on/off
  const handleDeviceToggle = async (deviceId: string, newStatus: boolean) => {
    try {
      setUpdating(deviceId);
      await update(ref(rtdb, `devices/${deviceId}`), {
        isOn: newStatus,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error updating device:", err);
      alert("Failed to update device status");
    } finally {
      setUpdating(null);
    }
  };

  // Reset all sensors
  const handleResetSensors = async () => {
    try {
      setUpdating("reset");
      await update(ref(rtdb, "sensors/current"), {
        pm25: 0,
        gas: 0,
        humidity: 0,
        temperature: 0,
        timestamp: new Date().toISOString(),
      });
      alert("Sensors reset successfully");
    } catch (err) {
      console.error("Error resetting sensors:", err);
      alert("Failed to reset sensors");
    } finally {
      setUpdating(null);
    }
  };

  // Turn all devices on
  const handleAllDevicesOn = async () => {
    try {
      setUpdating("all-on");
      const updates: { [key: string]: any } = {};
      devices.forEach((device) => {
        updates[`devices/${device.id}/isOn`] = true;
        updates[`devices/${device.id}/lastUpdated`] = new Date().toISOString();
      });
      await update(ref(rtdb), updates);
      alert("All devices turned on");
    } catch (err) {
      console.error("Error turning on all devices:", err);
      alert("Failed to turn on all devices");
    } finally {
      setUpdating(null);
    }
  };

  // Turn all devices off
  const handleAllDevicesOff = async () => {
    try {
      setUpdating("all-off");
      const updates: { [key: string]: any } = {};
      devices.forEach((device) => {
        updates[`devices/${device.id}/isOn`] = false;
        updates[`devices/${device.id}/lastUpdated`] = new Date().toISOString();
      });
      await update(ref(rtdb), updates);
      alert("All devices turned off");
    } catch (err) {
      console.error("Error turning off all devices:", err);
      alert("Failed to turn off all devices");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerClassName="pb-24"
      >
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </ScrollView>
    );
  }

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

        {/* Fan Control Section */}
        <View className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings" size={28} color="#3b82f6" />
              <View>
                <Text className="text-lg font-semibold text-gray-900">
                  Fan Control
                </Text>
                <Text className="text-sm text-gray-500">Main Fan</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="items-end">
                <Text className="text-sm font-medium text-gray-600">
                  {fanStatus ? "ON" : "OFF"}
                </Text>
                <Text className="text-xs text-gray-500">
                  Mode: {autoMode ? "Auto" : "Manual"}
                </Text>
              </View>
              <Switch
                value={fanStatus}
                onValueChange={handleFanToggle}
                disabled={updating === "fan" || autoMode}
                trackColor={{ false: "#ccc", true: "#3b82f6" }}
              />
            </View>
          </View>
          {/* Auto / Manual Toggle */}
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Automatic Mode</Text>
            <Switch
              value={autoMode}
              onValueChange={handleAutoModeToggle}
              disabled={updating === "auto-mode"}
              trackColor={{ false: "#ccc", true: "#3b82f6" }}
            />
          </View>
        </View>

        {/* Individual Device Controls */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">
            Device Controls
          </Text>
          {devices.map((device) => (
            <View
              key={device.id}
              className="mb-3 flex-row items-center justify-between rounded-lg bg-white p-4 shadow-sm"
            >
              <View className="flex-row flex-1 items-center gap-3">
                <Ionicons
                  name={device.type === "fan" ? "settings" : "radio"}
                  size={24}
                  color="#6b7280"
                />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    {device.name}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {device.type} • {device.status}
                  </Text>
                </View>
              </View>
              <Switch
                value={device.isOn}
                onValueChange={(newValue) =>
                  handleDeviceToggle(device.id, newValue)
                }
                disabled={updating === device.id}
                trackColor={{ false: "#ccc", true: "#3b82f6" }}
              />
            </View>
          ))}
        </View>

        {/* System Controls */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">
            System Controls
          </Text>

          {/* Bulk Control Buttons */}
          <View className="mb-3 flex-row gap-2">
            <Pressable
              onPress={handleAllDevicesOn}
              disabled={updating === "all-on"}
              className="flex-1 rounded-lg bg-green-50 p-4 active:bg-green-100"
            >
              {updating === "all-on" ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <>
                  <Ionicons
                    name="power"
                    size={20}
                    color="#16a34a"
                    style={{ marginBottom: 4 }}
                  />
                  <Text className="text-center text-xs font-medium text-green-700">
                    All On
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleAllDevicesOff}
              disabled={updating === "all-off"}
              className="flex-1 rounded-lg bg-red-50 p-4 active:bg-red-100"
            >
              {updating === "all-off" ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <>
                  <Ionicons
                    name="power-outline"
                    size={20}
                    color="#dc2626"
                    style={{ marginBottom: 4 }}
                  />
                  <Text className="text-center text-xs font-medium text-red-700">
                    All Off
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleResetSensors}
              disabled={updating === "reset"}
              className="flex-1 rounded-lg bg-blue-50 p-4 active:bg-blue-100"
            >
              {updating === "reset" ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <>
                  <Ionicons
                    name="refresh"
                    size={20}
                    color="#3b82f6"
                    style={{ marginBottom: 4 }}
                  />
                  <Text className="text-center text-xs font-medium text-blue-700">
                    Reset
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Status Info */}
          <View className="rounded-lg bg-blue-50 p-4">
            <Text className="text-xs font-medium text-blue-900">
              💡 Tip: Use system controls to manage all devices at once or reset
              sensor readings for testing
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
