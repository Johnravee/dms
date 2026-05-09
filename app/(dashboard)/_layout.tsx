import FloatingTab from "@/components/floating-tab";
import AdminRequestsScreen from "@/components/admin-requests-screen";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { View } from "react-native";
import ControlsScreen from "./controls";
import DashboardScreen from "./dashboard";
import DevicesScreen from "./devices";
import HistoryScreen from "./history";
import ProfileScreen from "./profile";

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();
  const userRole = user?.role || "user";

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen />;
      case "controls":
        // Only admins can access controls
        return userRole === "admin" ? <ControlsScreen /> : <DashboardScreen />;
      case "history":
        // Only admins can access history
        return userRole === "admin" ? <HistoryScreen /> : <DashboardScreen />;
      case "admin-requests":
        return userRole === "admin" ? (
          <AdminRequestsScreen />
        ) : (
          <DashboardScreen />
        );
      case "profile":
        return <ProfileScreen />;
      case "devices":
        // Only admins can access devices
        return userRole === "admin" ? <DevicesScreen /> : <DashboardScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View className="relative flex-1">
      {renderScreen()}
      <FloatingTab
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={userRole as "user" | "admin"}
      />
    </View>
  );
}
