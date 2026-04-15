import { db, rtdb } from "@/config/firebase";
import { ref, set } from "firebase/database";
import { addDoc, collection } from "firebase/firestore";

export const seedDatabase = async () => {
  try {
    console.log("🌱 Starting seed database...");

    // Seed Realtime Database
    console.log("📝 Seeding Realtime Database...");
    await set(ref(rtdb, "/"), {
      sensors: {
        current: {
          pm25: 45,
          gas: 120,
          humidity: 65,
          temperature: 24.5,
          timestamp: new Date().toISOString(),
        },
      },
      devices: {
        fan1: {
          name: "Main Fan",
          type: "fan",
          status: "active",
          isOn: true,
          lastUpdated: new Date().toISOString(),
        },
        dustSensor: {
          name: "Dust Sensor",
          type: "sensor",
          status: "active",
          isOn: true,
          lastUpdated: new Date().toISOString(),
        },
      },
    });
    console.log("✅ Realtime Database seeded successfully");

    // Seed Firestore
    console.log("📝 Seeding Firestore sensorHistory collection...");
    const historyRef = collection(db, "sensorHistory");

    // Base date: April 1, 2026
    const baseDate = new Date("2026-04-01").getTime();

    const logs = [
      // April 1 logs (0 to 4.5 hours ago)
      {
        pm25: 45,
        gas: 120,
        humidity: 65,
        temperature: 24.5,
        timestamp: new Date(baseDate).toISOString(),
      },
      {
        pm25: 42,
        gas: 118,
        humidity: 63,
        temperature: 24.2,
        timestamp: new Date(baseDate - 30 * 60000).toISOString(),
      },
      {
        pm25: 48,
        gas: 125,
        humidity: 67,
        temperature: 24.8,
        timestamp: new Date(baseDate - 60 * 60000).toISOString(),
      },
      {
        pm25: 50,
        gas: 130,
        humidity: 70,
        temperature: 25.1,
        timestamp: new Date(baseDate - 90 * 60000).toISOString(),
      },
      {
        pm25: 40,
        gas: 115,
        humidity: 62,
        temperature: 23.9,
        timestamp: new Date(baseDate - 120 * 60000).toISOString(),
      },
      {
        pm25: 55,
        gas: 135,
        humidity: 72,
        temperature: 25.5,
        timestamp: new Date(baseDate - 150 * 60000).toISOString(),
      },
      {
        pm25: 38,
        gas: 110,
        humidity: 60,
        temperature: 23.5,
        timestamp: new Date(baseDate - 180 * 60000).toISOString(),
      },
      {
        pm25: 52,
        gas: 128,
        humidity: 68,
        temperature: 24.9,
        timestamp: new Date(baseDate - 210 * 60000).toISOString(),
      },
      {
        pm25: 46,
        gas: 122,
        humidity: 66,
        temperature: 24.3,
        timestamp: new Date(baseDate - 240 * 60000).toISOString(),
      },
      {
        pm25: 44,
        gas: 119,
        humidity: 64,
        temperature: 24.1,
        timestamp: new Date(baseDate - 270 * 60000).toISOString(),
      },
      // March 25-29 logs (5-7 days ago)
      {
        pm25: 52,
        gas: 128,
        humidity: 68,
        temperature: 24.9,
        timestamp: new Date(baseDate - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        pm25: 48,
        gas: 125,
        humidity: 66,
        temperature: 24.5,
        timestamp: new Date(baseDate - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        pm25: 55,
        gas: 132,
        humidity: 70,
        temperature: 25.2,
        timestamp: new Date(baseDate - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        pm25: 41,
        gas: 118,
        humidity: 62,
        temperature: 24.1,
        timestamp: new Date(baseDate - 5.5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        pm25: 50,
        gas: 130,
        humidity: 69,
        temperature: 25.0,
        timestamp: new Date(baseDate - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    let count = 0;
    for (const log of logs) {
      try {
        const ref = await addDoc(historyRef, log);
        count++;
        console.log(`✅ Added log ${count}/${logs.length}: ${ref.id}`);
      } catch (err) {
        console.error(`❌ Failed to add log ${count + 1}:`, err);
        throw err;
      }
    }

    console.log(`✅ Seed complete: ${count} logs added!`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as any)?.code || "UNKNOWN";
    console.error("❌ SEED ERROR - Code:", code, "Message:", msg);
    throw new Error(`[${code}] ${msg}`);
  }
};
