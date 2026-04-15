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

interface LoginFormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const { login, isLoggedIn, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.replace("/(dashboard)/dashboard");
    }
  }, [isLoggedIn, authLoading]);

  const validateForm = () => {
    const newErrors: LoginFormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await login(email, password);
      router.replace("/(dashboard)/dashboard");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white ">
      <View className="gap-8 px-6 py-8 mt-10">
        {/* Logo */}
        <View className="pt-8 items-center rounded-sm">
          <LogoPlaceholder />
        </View>

        {/* Welcome Text */}
        <View className="gap-2">
          <Text className="text-center text-2xl font-bold text-gray-900">
            Welcome Back
          </Text>
          <Text className="text-center text-sm text-gray-600">
            Sign in to your account to continue
          </Text>
        </View>

        {/* Form */}
        <View className="gap-5">
          {/* Email Input */}
          <View>
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Email
            </Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: undefined });
              }}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              className={`rounded-lg border px-4 py-3 text-gray-800 ${
                errors.email
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            />
            {errors.email && (
              <Text className="mt-1 text-xs text-red-600">{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View>
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Password
            </Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: undefined });
              }}
              editable={!loading}
              secureTextEntry
              className={`rounded-lg border px-4 py-3 text-gray-800 ${
                errors.password
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            />
            {errors.password && (
              <Text className="mt-1 text-xs text-red-600">
                {errors.password}
              </Text>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || !email || !password}
            className={`w-full rounded-lg py-3 items-center ${
              loading || !email || !password ? "bg-blue-400" : "bg-blue-500"
            }`}
          >
            <Text className="text-lg font-semibold text-white">
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3">
          <View className="flex-1 border-t border-gray-300" />
          <Text className="text-sm text-gray-500">or</Text>
          <View className="flex-1 border-t border-gray-300" />
        </View>

        {/* Register Link */}
        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-sm text-gray-600">
            Don&apos;t have an account?
          </Text>
          <TouchableOpacity
            disabled={loading}
            onPress={() => router.push("/register")}
          >
            <Text className="font-semibold text-blue-500">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
