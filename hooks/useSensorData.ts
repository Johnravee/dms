import { rtdb } from "@/config/firebase";
import { useAuth } from "@/contexts/auth-context";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

export interface SensorData {
  pm25: number;
  gas: number;
  humidity: number;
  temperature: number;
  timestamp: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  isOn: boolean;
  isAuto?: boolean;
  mode?: string;
  state?: boolean;
  lastUpdated: string;
}

const DEFAULT_DATA: SensorData = {
  pm25: 0,
  gas: 0,
  humidity: 0,
  temperature: 0,
  timestamp: new Date().toISOString(),
};

export const useSensorData = () => {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData>(DEFAULT_DATA);
  const [devices, setDevices] = useState<Device[]>([]);
  const [fanStatus, setFanStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only set up listeners when user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Listen to real-time updates from sensors/current (modular API)
      const sensorRef = ref(rtdb, "sensors/current");
      const sensorUnsubscribe = onValue(
        sensorRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setSensorData({
              pm25: data.pm25 || 0,
              gas: data.gas || 0,
              humidity: data.humidity || 0,
              temperature: data.temperature || 0,
              timestamp: data.timestamp || new Date().toISOString(),
            });
          } else {
            console.log("No sensor data found");
            setSensorData(DEFAULT_DATA);
          }
          setLoading(false);
        },
        (error: any) => {
          console.error("Error fetching sensor data:", error);
          setError(error.message);
          setLoading(false);
        },
      );

      // Listen to real-time updates from devices
      const devicesRef = ref(rtdb, "devices");
      const devicesUnsubscribe = onValue(
        devicesRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const devicesList: Device[] = [];
            Object.entries(data).forEach(([id, deviceData]: [string, any]) => {
              devicesList.push({
                id,
                name: deviceData.name || "",
                type: deviceData.type || "",
                status: deviceData.status || "unknown",
                isOn: deviceData.isOn || false,
                isAuto: deviceData.isAuto || false,
                mode: deviceData.mode || "manual",
                state: deviceData.state || false,
                lastUpdated: deviceData.lastUpdated || new Date().toISOString(),
              });

              if ((deviceData as any).type === "fan") {
                setFanStatus((deviceData as any).isOn || false);
              }
            });

            setDevices(devicesList);
          } else {
            setDevices([]);
          }
        },
        (error: any) => {
          console.error("Error fetching devices:", error);
          setError(error.message);
        },
      );

      return () => {
        sensorUnsubscribe();
        devicesUnsubscribe();
      };
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, [user]);

  return {
    sensorData,
    devices,
    fanStatus,
    loading,
    error,
  };
};
