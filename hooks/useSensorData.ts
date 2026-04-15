import { rtdb } from "@/config/firebase";
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
  const [sensorData, setSensorData] = useState<SensorData>(DEFAULT_DATA);
  const [devices, setDevices] = useState<Device[]>([]);
  const [fanStatus, setFanStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to real-time updates from sensors/current
      const sensorRef = ref(rtdb, "sensors/current");

      const sensorUnsubscribe = onValue(
        sensorRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
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
        (error) => {
          console.error("Error fetching sensor data:", error);
          setError(error.message);
          setLoading(false);
        },
      );
      unsubscribers.push(sensorUnsubscribe);

      // Listen to real-time updates from devices
      const devicesRef = ref(rtdb, "devices");

      const devicesUnsubscribe = onValue(
        devicesRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const devicesList: Device[] = [];

            // Convert object to array
            Object.entries(data).forEach(([id, deviceData]: [string, any]) => {
              devicesList.push({
                id,
                name: deviceData.name || "",
                type: deviceData.type || "",
                status: deviceData.status || "unknown",
                isOn: deviceData.isOn || false,
                lastUpdated: deviceData.lastUpdated || new Date().toISOString(),
              });

              // Monitor fan status specifically
              if (deviceData.type === "fan") {
                setFanStatus(deviceData.isOn || false);
              }
            });

            setDevices(devicesList);
          } else {
            setDevices([]);
          }
        },
        (error) => {
          console.error("Error fetching devices:", error);
          setError(error.message);
        },
      );
      unsubscribers.push(devicesUnsubscribe);

      return () => unsubscribers.forEach((unsub) => unsub());
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, []);

  return {
    sensorData,
    devices,
    fanStatus,
    loading,
    error,
  };
};
