import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface FloatingTabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role?: "user" | "admin";
}

const allTabs = [
  { name: "dashboard", icon: "home", label: "Dashboard" },
  { name: "devices", icon: "phone-portrait", label: "Devices" },
  { name: "controls", icon: "settings", label: "Controls" },
  { name: "history", icon: "time", label: "History" },
  { name: "admin-requests", icon: "clipboard", label: "Requests" },
  { name: "profile", icon: "person", label: "Profile" },
];

export default function FloatingTab({
  activeTab,
  onTabChange,
  role = "admin",
}: FloatingTabProps) {
  // Filter tabs based on user role
  const tabs =
    role === "user"
      ? allTabs.filter((tab) => ["dashboard", "profile"].includes(tab.name))
      : allTabs;

  return (
    <View className="absolute bottom-5 left-3 right-3 flex-row items-end justify-between rounded-[28px] bg-white px-2 py-2 shadow-lg">
      {tabs.map((tab) => (
        <View
          key={tab.name}
          className="flex-1 items-center justify-center px-1"
        >
          <Pressable
            onPress={() => onTabChange(tab.name)}
            className={`rounded-full p-2 ${
              activeTab === tab.name ? "bg-blue-500" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.name ? "#ffffff" : "#6b7280"}
            />
          </Pressable>
          <Text
            numberOfLines={1}
            className={`mt-1 text-[10px] font-medium ${
              activeTab === tab.name ? "text-blue-600" : "text-gray-600"
            }`}
          >
            {tab.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
