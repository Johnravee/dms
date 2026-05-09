import { rtdb } from "@/config/firebase";
import { useAuth } from "@/contexts/auth-context";
import { SensorData, useSensorData } from "@/hooks/useSensorData";
import { useSensorHistory } from "@/hooks/useSensorHistory";
import {
  isNotificationEnabled,
  sendLocalAlertNotification,
} from "@/utils/notifications";
import { ref, update } from "firebase/database";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Pressable, Text, View } from "react-native";

type AlertLevel = "safe" | "moderate" | "hazardous";

interface AppAlert {
  title: string;
  message: string;
  level: AlertLevel;
  timestamp: string;
}

interface AlertContextType {
  currentAlert: AppAlert | null;
  dismissAlert: () => void;
  alertLevel: AlertLevel;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const getAlertLevel = (sensorData: SensorData): AppAlert | null => {
  const pm25 = Number(sensorData.pm25) || 0;
  const gas = Number(sensorData.gas) || 0;

  const pmHazard = pm25 >= 36;
  const gasHazard = gas >= 1001;

  if (pmHazard || gasHazard) {
    const parts: string[] = [];
    if (pmHazard) parts.push(`Dust level high: ${pm25.toFixed(1)} µg/m³`);
    if (gasHazard) parts.push(`Gas level high: ${gas.toFixed(1)} ppm`);

    return {
      title: "Hazardous Air Alert",
      message: parts.join("\n"),
      level: "hazardous",
      timestamp: new Date().toISOString(),
    };
  }

  return null;
};

const getDangerLevel = (level: AlertLevel) => {
  switch (level) {
    case "hazardous":
      return 2;
    case "moderate":
      return 1;
    default:
      return 0;
  }
};

const getAlertState = (sensorData: SensorData) => {
  const pm25 = Number(sensorData.pm25) || 0;
  const gas = Number(sensorData.gas) || 0;

  const pmLevel: AlertLevel =
    pm25 >= 36 ? "hazardous" : pm25 >= 13 ? "moderate" : "safe";
  const gasLevel: AlertLevel =
    gas >= 1001 ? "hazardous" : gas >= 751 ? "moderate" : "safe";

  const level: AlertLevel =
    pmLevel === "hazardous" || gasLevel === "hazardous"
      ? "hazardous"
      : pmLevel === "moderate" || gasLevel === "moderate"
        ? "moderate"
        : "safe";

  return {
    level,
    pm25,
    gas,
    maskWarning: level !== "safe",
    maskRequired: level === "hazardous",
    mask: level === "hazardous",
  };
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { sensorData } = useSensorData();
  const { logSensorData } = useSensorHistory();
  const [currentAlert, setCurrentAlert] = useState<AppAlert | null>(null);
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("safe");

  const lastAlertKeyRef = useRef<string>("");
  const latestSensorDataRef = useRef(sensorData);
  const lastNotificationTimeRef = useRef<number>(0); // Timestamp for 30m throttle

  const dismissAlert = () => setCurrentAlert(null);

  useEffect(() => {
    latestSensorDataRef.current = sensorData;
  }, [sensorData]);

  // Logging Logic (runs every 60s)
  useEffect(() => {
    if (!user) return;

    void logSensorData(latestSensorDataRef.current);
    const intervalId = setInterval(() => {
      void logSensorData(latestSensorDataRef.current);
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [logSensorData, user]);

  // Main Alert & Sync Logic
  useEffect(() => {
    const alertState = getAlertState(sensorData);
    const nextLevel: AlertLevel = alertState.level;
    setAlertLevel(nextLevel);

    // 1. Always sync status to RTDB (Real-time updates)
    const syncAlertsNode = async () => {
      try {
        await update(ref(rtdb, "alerts"), {
          dangerLevel: getDangerLevel(nextLevel),
          maskWarning: alertState.maskWarning,
          maskRequired: alertState.maskRequired,
          mask: alertState.mask,
        });
      } catch (error) {
        console.warn("Failed to sync alert state to RTDB:", error);
      }
    };
    void syncAlertsNode();

    // 2. Filter: Only run logic for HAZARDOUS levels
    if (nextLevel !== "hazardous") {
      lastAlertKeyRef.current = ""; // Reset key if levels drop
      return;
    }

    // 3. Throttle: Only proceed if 30 minutes (1,800,000ms) have passed
    const now = Date.now();
    const THIRTY_MINUTES = 30 * 60 * 1000;

    if (now - lastNotificationTimeRef.current < THIRTY_MINUTES) {
      return;
    }

    const alert = getAlertLevel(sensorData);
    if (!alert) return;

    // 4. Trigger Alert UI and set Throttle timestamp
    lastNotificationTimeRef.current = now;
    lastAlertKeyRef.current = `hazardous:${sensorData.pm25}:${sensorData.gas}`;
    setCurrentAlert(alert);

    // 5. Send Push Notification
    const sendNotification = async () => {
      try {
        if (await isNotificationEnabled()) {
          await sendLocalAlertNotification(alert.title, alert.message, {
            type: "system_alert",
            level: alert.level,
            pm25: sensorData.pm25,
            gas: sensorData.gas,
            timestamp: sensorData.timestamp,
          });
        }
      } catch (error) {
        console.warn("Failed to send local alert notification:", error);
      }
    };

    void sendNotification();
  }, [sensorData]);

  const value = useMemo(
    () => ({
      currentAlert,
      dismissAlert,
      alertLevel,
    }),
    [currentAlert, alertLevel],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Modal visible={currentAlert !== null} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-white p-6 shadow-lg">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                {currentAlert?.title || "Alert"}
              </Text>
              <View className="rounded-full px-3 py-1 bg-red-100">
                <Text className="text-xs font-semibold text-red-700">
                  Hazard
                </Text>
              </View>
            </View>
            <Text className="text-sm leading-5 text-gray-700 whitespace-pre-line">
              {currentAlert?.message}
            </Text>
            <View className="mt-5 flex-row justify-end gap-3">
              <Pressable
                onPress={dismissAlert}
                className="rounded-xl bg-slate-100 px-4 py-2"
              >
                <Text className="font-medium text-slate-700">Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAppAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAppAlert must be used within AlertProvider");
  }
  return context;
};
