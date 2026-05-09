import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/auth-context";
import {
  disableNotifications,
  enableNotifications,
  isNotificationEnabled,
} from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface ProfileSection {
  title: string;
  items: ProfileItem[];
}

interface ProfileItem {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  showArrow?: boolean;
}

export default function ProfileScreen() {
  const { user, logout, changePassword } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [adminRequestStatus, setAdminRequestStatus] = useState<
    "idle" | "pending" | "approved" | "rejected"
  >("idle");
  const [requestingAdminAccess, setRequestingAdminAccess] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check notification status on mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      const enabled = await isNotificationEnabled();
      setNotificationsEnabled(enabled);
    };
    checkNotificationStatus();
  }, []);

  useEffect(() => {
    const loadAdminRequestStatus = async () => {
      if (!user?.id || user.role === "admin") {
        setAdminRequestStatus("approved");
        return;
      }

      try {
        const requestDoc = await getDoc(doc(db, "admin_requests", user.id));
        if (requestDoc.exists()) {
          const data = requestDoc.data();
          setAdminRequestStatus(data.status || "pending");
        } else {
          setAdminRequestStatus("idle");
        }
      } catch (error) {
        console.error("Error loading admin request status:", error);
      }
    };

    void loadAdminRequestStatus();
  }, [user?.id, user?.role]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert("Success", "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePasswordModal(false);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to change password. Please try again.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleNotifications = () => {
    if (notificationsEnabled) {
      Alert.alert("Notifications", "Notifications are enabled", [
        {
          text: "Disable",
          onPress: async () => {
            await disableNotifications();
            setNotificationsEnabled(false);
            Alert.alert("Disabled", "Notifications have been turned off.");
          },
          style: "destructive",
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      Alert.alert(
        "Enable Notifications?",
        "Get alerts for air quality changes and sensor updates.",
        [
          {
            text: "Enable",
            onPress: async () => {
              const granted = await enableNotifications();
              if (granted) {
                setNotificationsEnabled(true);
                Alert.alert("Success", "Notifications enabled!");
              } else {
                Alert.alert(
                  "Permission Denied",
                  "Please enable notifications in settings.",
                );
              }
            },
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
    }
  };

  const handleRequestAdminAccess = () => {
    if (!user?.id || !user?.email) {
      Alert.alert("Error", "You must be logged in to request admin access.");
      return;
    }

    Alert.alert("Request Admin Access", "Send a request to become an admin?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Request",
        onPress: async () => {
          try {
            setRequestingAdminAccess(true);
            await setDoc(doc(db, "admin_requests", user.id), {
              uid: user.id,
              email: user.email,
              status: "pending",
              requestedAt: serverTimestamp(),
              reviewedAt: null,
              reviewedBy: null,
            });
            setAdminRequestStatus("pending");
            Alert.alert(
              "Request Sent",
              "Your admin request has been submitted.",
            );
          } catch (error) {
            console.error("Error requesting admin access:", error);
            Alert.alert(
              "Error",
              "Failed to submit admin request. Please try again.",
            );
          } finally {
            setRequestingAdminAccess(false);
          }
        },
      },
    ]);
  };

  const accountItems: ProfileItem[] = [
    { icon: "mail", label: "Email", value: user?.email },
    {
      icon: "shield-checkmark",
      label: "Role",
      value: user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : "User",
    },
  ];

  const settingsItems: ProfileItem[] = [
    {
      icon: "lock-closed",
      label: "Change Password",
      onPress: handleChangePassword,
      showArrow: true,
    },
    {
      icon: "notifications",
      label: "Notifications",
      value: notificationsEnabled ? "On" : "Off",
      onPress: handleNotifications,
      showArrow: true,
    },
  ];

  const requestItems: ProfileItem[] =
    user?.role === "admin"
      ? []
      : [
          {
            icon: "shield-checkmark",
            label: "Admin Access",
            value:
              adminRequestStatus === "pending"
                ? "Pending approval"
                : adminRequestStatus === "approved"
                  ? "Approved"
                  : adminRequestStatus === "rejected"
                    ? "Rejected"
                    : "Tap to request",
            onPress:
              adminRequestStatus === "pending" || requestingAdminAccess
                ? undefined
                : handleRequestAdminAccess,
            color:
              adminRequestStatus === "pending"
                ? "bg-yellow-100"
                : adminRequestStatus === "approved"
                  ? "bg-green-100"
                  : adminRequestStatus === "rejected"
                    ? "bg-red-100"
                    : "bg-blue-100",
            showArrow: adminRequestStatus === "idle",
          },
        ];

  const sections: ProfileSection[] = [
    {
      title: "Account Information",
      items: accountItems,
    },
    {
      title: "Settings",
      items: settingsItems,
    },
    ...(requestItems.length
      ? [
          {
            title: "Admin Access",
            items: requestItems,
          },
        ]
      : []),
  ];

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-24"
    >
      <View className="px-4 pt-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">Profile</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Manage your account and settings
          </Text>
        </View>

        {/* User Profile Card */}
        <View className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm">
          <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
            <View className="items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white bg-opacity-20">
                <Ionicons name="person" size={40} color="#030303" />
              </View>
              <Text className="text-lg font-bold text-gray-700">
                {user?.email?.split("@")[0] || "User"}
              </Text>
              <Text className="mt-1 text-sm text-blue-500">{user?.email}</Text>
            </View>
          </View>

          <View className="flex-row gap-4 border-t border-gray-200 px-6 py-4">
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-blue-600">Admin</Text>
              <Text className="mt-1 text-xs text-gray-600">Status</Text>
            </View>
            <View className="border-l border-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-blue-600">Active</Text>
              <Text className="mt-1 text-xs text-gray-600">Account</Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={index} className="mb-6">
            <Text className="mb-3 text-sm font-semibold uppercase text-gray-600">
              {section.title}
            </Text>

            <View className="overflow-hidden rounded-lg bg-white shadow-sm">
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                  className={`flex-row items-center justify-between border-b border-gray-100 px-4 py-4 ${
                    itemIndex === section.items.length - 1 ? "border-b-0" : ""
                  } ${item.onPress ? "active:bg-blue-50" : ""}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`rounded-full p-2 ${
                        item.color || "bg-blue-100"
                      }`}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={
                          item.color === "bg-red-100" ? "#dc2626" : "#3b82f6"
                        }
                      />
                    </View>
                    <View>
                      <Text className="text-base font-medium text-gray-900">
                        {item.label}
                      </Text>
                      {item.value && (
                        <Text className="mt-0.5 text-xs text-gray-500">
                          {item.value}
                        </Text>
                      )}
                    </View>
                  </View>

                  {item.showArrow && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* About Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold uppercase text-gray-600">
            About
          </Text>

          <View className="overflow-hidden rounded-lg bg-white shadow-sm">
            <View className="border-b border-gray-100 px-4 py-4">
              <View className="flex-row items-center gap-3">
                <View className="rounded-full bg-purple-100 p-2">
                  <Ionicons name="information" size={18} color="#a855f7" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    App Version
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    Dust Monitoring System v1.0.0
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 rounded-lg bg-red-50 p-4 active:bg-red-100"
        >
          <Ionicons name="log-out" size={20} color="#dc2626" />
          <Text className="text-lg font-semibold text-red-600">Logout</Text>
        </Pressable>

        {/* Additional Info */}
        <View className="mt-8 rounded-lg bg-blue-50 p-4">
          <View className="flex-row gap-3">
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View className="flex-1">
              <Text className="font-semibold text-blue-900">
                Account Security
              </Text>
              <Text className="mt-1 text-sm text-blue-800">
                Your account is secure. All data is encrypted and protected.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isChangingPassword) {
            setShowChangePasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
      >
        <View className="flex-1 justify-center bg-black bg-opacity-50 px-4">
          <View className="rounded-lg bg-white p-6">
            {/* Modal Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">
                Change Password
              </Text>
              <Pressable
                onPress={() => {
                  if (!isChangingPassword) {
                    setShowChangePasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }
                }}
                disabled={isChangingPassword}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            {/* Current Password Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Current Password
              </Text>
              <View className="flex-row items-center rounded-lg border border-gray-300 bg-gray-50 px-3">
                <TextInput
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!isChangingPassword}
                  className="flex-1 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
                <Pressable
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isChangingPassword}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#6b7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* New Password Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                New Password
              </Text>
              <View className="flex-row items-center rounded-lg border border-gray-300 bg-gray-50 px-3">
                <TextInput
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!isChangingPassword}
                  className="flex-1 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
                <Pressable
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  disabled={isChangingPassword}
                >
                  <Ionicons
                    name={showNewPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#6b7280"
                  />
                </Pressable>
              </View>
              <Text className="mt-1 text-xs text-gray-500">
                Minimum 6 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Confirm Password
              </Text>
              <View className="flex-row items-center rounded-lg border border-gray-300 bg-gray-50 px-3">
                <TextInput
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isChangingPassword}
                  className="flex-1 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isChangingPassword}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#6b7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  if (!isChangingPassword) {
                    setShowChangePasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }
                }}
                disabled={isChangingPassword}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-100 py-3 active:bg-gray-200"
              >
                <Text className="text-center font-semibold text-gray-700">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleChangePasswordSubmit}
                disabled={isChangingPassword}
                className="flex-1 flex-row items-center justify-center rounded-lg bg-blue-600 py-3 active:bg-blue-700"
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="font-semibold text-white">
                    Change Password
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
