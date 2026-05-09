import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

export interface SensorHistoryLog {
  id: string;
  pm25: number;
  gas: number;
  humidity: number;
  temperature: number;
  timestamp: string;
}

const CACHE_KEY = "sensorHistoryCache";
const CACHE_EXPIRY_KEY = "sensorHistoryCacheExpiry";

export const useSensorHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<SensorHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only set up listeners when user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    // Load cached data first
    const loadCachedData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setHistory(parsed);
          console.log("✅ Loaded cached history:", parsed.length, "records");
        }
      } catch (error) {
        console.warn("Error loading cache:", error);
      }
    };

    loadCachedData();
    setLoading(true);

    const historyRef = collection(db, "sensorHistory");

    // Query sorted by timestamp, newest first
    const q = query(historyRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const historyList: SensorHistoryLog[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          historyList.push({
            id: doc.id,
            pm25: data.pm25 || 0,
            gas: data.gas || 0,
            humidity: data.humidity || 0,
            temperature: data.temperature || 0,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        });

        setHistory(historyList);

        // Cache the data
        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(historyList));
          await AsyncStorage.setItem(
            CACHE_EXPIRY_KEY,
            new Date().getTime().toString(),
          );
          console.log("✅ Cached history:", historyList.length, "records");
        } catch (cacheError) {
          console.warn("Error caching data:", cacheError);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching sensor history:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  // Function to log current sensor data
  const logSensorData = useCallback(
    async (sensorData: {
      pm25: number;
      gas: number;
      humidity: number;
      temperature: number;
    }) => {
      try {
        const historyRef = collection(db, "sensorHistory");
        await addDoc(historyRef, {
          pm25: sensorData.pm25,
          gas: sensorData.gas,
          humidity: sensorData.humidity,
          temperature: sensorData.temperature,
          timestamp: new Date().toISOString(),
        });
        console.log("Sensor data logged to Firestore successfully");
      } catch (err) {
        console.error("Error logging sensor data:", err);
      }
    },
    [],
  );

  return {
    history,
    loading,
    logSensorData,
  };
};
