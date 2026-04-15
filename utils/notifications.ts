import { db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Get Expo push token for Firebase FCM
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log("Must use physical device for push notifications");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("Project ID is not set in app.json");
      return null;
    }

    console.log("Getting Expo push token with projectId:", projectId);

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log(
      "✅ Successfully obtained Expo push token:",
      token?.substring(0, 20) + "...",
    );
    return token;
  } catch (error) {
    console.error("❌ Error getting Expo push token:", error);
    if (error instanceof Error) {
      // Parse Firebase error and provide helpful guidance
      if (
        error.message.includes("FirebaseApp") ||
        error.message.includes("not initialized")
      ) {
        console.warn(
          "⚠️  Firebase not initialized. Ensure:\n" +
            "1. google-services.json is present in project root\n" +
            "2. Package name in app.json matches google-services.json\n" +
            "3. Google Play Services is installed on device\n" +
            "4. Run: npx expo prebuild --clean && npx eas build --platform android --local",
        );
      } else if (error.message.includes("permission")) {
        console.warn("⚠️  Notification permission denied");
      }
    }
    return null;
  }
};

/**
 * Request permission for push notifications and register FCM token immediately
 */
export const requestNotificationPermission = async (
  userId?: string,
): Promise<boolean> => {
  try {
    console.log("🔔 [NOTIF] Requesting notification permission...");

    // Request permission from user
    const { granted } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    console.log("🔔 [NOTIF] Permission granted:", granted);

    if (granted) {
      // Save permission status
      await AsyncStorage.setItem("notificationsEnabled", "true");
      console.log("🔔 [NOTIF] Notifications enabled");

      // If user ID provided, register FCM immediately
      if (userId) {
        console.log("🔔 [NOTIF] Registering FCM immediately for user:", userId);
        await registerForFCMNotifications(userId);
      }

      return true;
    } else {
      await AsyncStorage.setItem("notificationsEnabled", "false");
      console.log("🔔 [NOTIF] Permission denied");
      return false;
    }
  } catch (error) {
    console.error("❌ [NOTIF] Error requesting permission:", error);
    // Don't fail registration - allow app to continue
    return false;
  }
};

/**
 * Register for FCM notifications (for use with Firebase backend)
 * Call this after user authentication
 */
export const registerForFCMNotifications = async (
  userId: string,
): Promise<void> => {
  try {
    console.log("🔔 Starting FCM registration for user:", userId);

    const enabled = await isNotificationEnabled();
    console.log("🔔 Notifications enabled:", enabled);
    if (!enabled) {
      console.log("🔔 Notifications not enabled, skipping FCM registration");
      return;
    }

    const token = await getExpoPushToken();

    if (!token) {
      console.warn(
        "⚠️  Failed to get Expo push token. FCM registration skipped. " +
          "The app will still work, but push notifications may not be available.",
      );
      return;
    }

    // Save token locally
    await AsyncStorage.setItem("fcmToken", token);
    await AsyncStorage.setItem("fcmUserId", userId);
    console.log("🔔 Token saved to AsyncStorage");

    // Sync token to Firestore user document
    try {
      console.log("🔔 [NOTIF] Attempting to update Firestore user:", userId);

      await updateDoc(doc(db, "users", userId), {
        fcmToken: token,
        tokenUpdatedAt: serverTimestamp(),
        deviceType: Platform.OS,
        notificationsEnabled: true,
      });
      console.log("✅ [NOTIF] FCM token synced to Firestore for user:", userId);
    } catch (firestoreError) {
      console.warn(
        "⚠️  [NOTIF] Could not sync FCM token to Firestore (app still works):",
        firestoreError instanceof Error
          ? firestoreError.message
          : firestoreError,
      );
      // Continue even if Firestore sync fails, token is still saved locally
    }

    console.log("✅ FCM registration completed for user:", userId);
  } catch (error) {
    console.error(
      "❌ Error registering for FCM:",
      error instanceof Error ? error.message : error,
    );
    // Don't throw - allow app to continue even if FCM fails
  }
};

/**
 * Handle incoming FCM notification
 */
export const setupNotificationListeners = (): (() => void) => {
  // Listen for notifications when app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      // Handle notification received while app is in foreground
    },
  );

  // Listen for notification responses (when user taps notification)
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      const data = response.notification.request.content.data as Record<
        string,
        any
      >;

      // Handle different notification types
      if (data?.type === "pollution_alert") {
        // Navigate to dashboard
        console.log("Pollution alert:", data.pm25);
      } else if (data?.type === "device_alert") {
        // Navigate to controls
        console.log("Device alert:", data.deviceName);
      } else if (data?.type === "system_alert") {
        // Navigate to alerts
        console.log("System alert:", data.message);
      }
    });

  // Cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
};

/**
 * Check if notifications are enabled
 */
export const isNotificationEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem("notificationsEnabled");
    if (enabled === null) {
      const settings = await Notifications.getPermissionsAsync();
      return settings.granted;
    }
    return enabled === "true";
  } catch (error) {
    console.error("Error checking notification status:", error);
    return false;
  }
};

/**
 * Disable notifications
 */
export const disableNotifications = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem("notificationsEnabled", "false");
    // TODO: Send to backend to disable notifications for this device
  } catch (error) {
    console.error("Error disabling notifications:", error);
  }
};

/**
 * Enable notifications
 */
export const enableNotifications = async (): Promise<boolean> => {
  return requestNotificationPermission();
};

/**
 * Send a test notification (local only for testing)
 */
export const sendTestNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 Dust Monitoring System",
        body: "Test notification - FCM is configured!",
        data: { type: "test" },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
  }
};

/**
 * Get saved FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("fcmToken");
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

/**
 * Get device info for FCM registration
 */
export const getDeviceInfo = () => {
  return {
    platform: Platform.OS,
    isDevice: Device.isDevice,
    osVersion: Device.osVersion,
    deviceName: Device.deviceName,
    modelName: Device.modelName,
  };
};
