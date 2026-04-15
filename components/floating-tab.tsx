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
    <View className="absolute bottom-6 left-4 right-4 flex-row items-end justify-center gap-4 rounded-full bg-white px-4 py-3 shadow-lg">
      {tabs.map((tab) => (
        <View key={tab.name} className="items-center justify-center">
          <Pressable
            onPress={() => onTabChange(tab.name)}
            className={`rounded-full p-3 ${
              activeTab === tab.name ? "bg-blue-500" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeTab === tab.name ? "#ffffff" : "#6b7280"}
            />
          </Pressable>
          <Text
            className={`mt-1 text-xs font-medium ${
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
