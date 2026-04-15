import { db } from "@/config/firebase";
import { useSensorHistory } from "@/hooks/useSensorHistory";
import { exportSensorHistoryPDF } from "@/utils/pdfGenerator";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function HistoryScreen() {
  const { history, loading } = useSensorHistory();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Delete data older than 7 days
  const handleDeleteOldData = async () => {
    Alert.alert(
      "Delete Old Data",
      "This will delete sensor history older than 7 days. Continue?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setDeleting(true);
              const sevenDaysAgo = new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000,
              ).toISOString();

              const q = query(
                collection(db, "sensorHistory"),
                where("timestamp", "<", sevenDaysAgo),
              );
              const snapshot = await getDocs(q);

              let deletedCount = 0;
              for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, "sensorHistory", docSnap.id));
                deletedCount++;
              }

              Alert.alert("Success", `Deleted ${deletedCount} old records`);
            } catch (err) {
              Alert.alert(
                "Error",
                `Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`,
              );
            } finally {
              setDeleting(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  // Export data as PDF
  const handleExportPDF = async () => {
    try {
      setExporting(true);

      if (history.length === 0) {
        Alert.alert("No Data", "No history data to export");
        return;
      }

      // Convert history data to PDF format
      const pdfData = history.map((log) => ({
        id: log.id,
        pm25: Number(log.pm25) || 0,
        gas: Number(log.gas) || 0,
        humidity: Number(log.humidity) || 0,
        temperature: Number(log.temperature) || 0,
        timestamp: String(log.timestamp),
      }));

      console.log("📊 Exporting PDF with", pdfData.length, "records");
      const result = await exportSensorHistoryPDF(pdfData);
      Alert.alert("✅ Success", result, [{ text: "OK", style: "default" }]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      Alert.alert("Export Error", errorMessage, [
        { text: "OK", style: "default" },
      ]);

      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
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
          <Text className="text-3xl font-bold text-gray-900">History</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Sensor data logged every 30 minutes
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="mb-6 flex-row gap-2">
          <Pressable
            onPress={handleExportPDF}
            disabled={exporting || history.length === 0}
            className="flex-1 rounded-lg bg-green-50 p-3 active:bg-green-100"
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <>
                <Ionicons
                  name="download"
                  size={20}
                  color="#16a34a"
                  style={{ marginBottom: 4 }}
                />
                <Text className="text-center text-xs font-medium text-green-700">
                  Export PDF
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleDeleteOldData}
            disabled={deleting || history.length === 0}
            className="flex-1 rounded-lg bg-red-50 p-3 active:bg-red-100"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <Ionicons
                  name="trash"
                  size={20}
                  color="#dc2626"
                  style={{ marginBottom: 4 }}
                />
                <Text className="text-center text-xs font-medium text-red-700">
                  Delete Old
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* History List */}
        {history.length > 0 ? (
          <View className="space-y-3">
            {history.map((log) => (
              <View key={log.id} className="rounded-lg bg-white p-4 shadow-sm">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-gray-600">
                    {formatDate(log.timestamp)}
                  </Text>
                  <View className="rounded-full bg-blue-50 px-2 py-1">
                    <Text className="text-xs font-medium text-blue-600">
                      Log Entry
                    </Text>
                  </View>
                </View>

                <View className="space-y-2">
                  {/* PM2.5 */}
                  <View className="flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
                    <View>
                      <Text className="text-xs text-gray-600">PM2.5</Text>
                      <Text className="text-lg font-semibold text-gray-900">
                        {log.pm25}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">µg/m³</Text>
                  </View>

                  {/* Gas */}
                  <View className="flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
                    <View>
                      <Text className="text-xs text-gray-600">Gas</Text>
                      <Text className="text-lg font-semibold text-gray-900">
                        {log.gas}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">ppm</Text>
                  </View>

                  {/* Humidity & Temperature */}
                  <View className="flex-row gap-2">
                    <View className="flex-1 rounded-lg bg-gray-50 p-3">
                      <Text className="text-xs text-gray-600">Humidity</Text>
                      <Text className="text-lg font-semibold text-gray-900">
                        {log.humidity}
                      </Text>
                      <Text className="text-xs text-gray-500">%</Text>
                    </View>
                    <View className="flex-1 rounded-lg bg-gray-50 p-3">
                      <Text className="text-xs text-gray-600">Temp</Text>
                      <Text className="text-lg font-semibold text-gray-900">
                        {log.temperature}
                      </Text>
                      <Text className="text-xs text-gray-500">°C</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="rounded-lg bg-white p-6">
            <Text className="text-center text-gray-500">
              No sensor history found. Data will be logged every 30 minutes.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
