import { LogoPlaceholder } from "@/components/logo-placeholder";
import { useAuth } from "@/contexts/auth-context";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, isLoggedIn, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.replace("/(dashboard)/dashboard");
    }
  }, [isLoggedIn, authLoading]);

  const handleRegister = async () => {
    try {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      setLoading(true);
      await register(email, password);
      Alert.alert("Success", "Account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(dashboard)/dashboard"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6 py-12">
        {/* Logo */}
        <View className="mb-8 mt-8">
          <LogoPlaceholder />
        </View>

        {/* Title */}
        <Text className="mb-2 text-center text-3xl font-bold text-gray-800">
          Create Account
        </Text>
        <Text className="mb-8 text-center text-gray-600">
          Sign up to get started
        </Text>

        {/* Email Input */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
          autoCapitalize="none"
          className="mb-4 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800"
        />

        {/* Password Input */}
        <TextInput
          placeholder="Password (min. 6 characters)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          secureTextEntry
          className="mb-4 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800"
        />

        {/* Confirm Password Input */}
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
          secureTextEntry
          className="mb-6 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800"
        />

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          className={`w-full rounded-lg py-3 ${
            loading ? "bg-blue-400" : "bg-blue-500"
          } items-center`}
        >
          <Text className="text-lg font-semibold text-white">
            {loading ? "Creating Account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity
            disabled={loading}
            onPress={() => router.push("/login")}
          >
            <Text className="font-semibold text-blue-500">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
