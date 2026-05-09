import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

interface AdminRequest {
  id: string;
  uid: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requestedAt?: any;
  reviewedAt?: any;
  reviewedBy?: string | null;
}

export default function AdminRequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "admin_requests"),
      orderBy("requestedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextRequests: AdminRequest[] = [];
        snapshot.forEach((requestDoc) => {
          const data = requestDoc.data() as Omit<AdminRequest, "id">;
          nextRequests.push({
            id: requestDoc.id,
            uid: data.uid,
            email: data.email,
            status: data.status || "pending",
            requestedAt: data.requestedAt,
            reviewedAt: data.reviewedAt,
            reviewedBy: data.reviewedBy || null,
          });
        });

        setRequests(nextRequests);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading admin requests:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );

  const reviewedRequests = useMemo(
    () => requests.filter((request) => request.status !== "pending"),
    [requests],
  );

  const handleDecision = async (
    request: AdminRequest,
    status: "approved" | "rejected",
  ) => {
    try {
      setUpdatingId(request.id);

      await updateDoc(doc(db, "admin_requests", request.id), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.id || null,
      });

      if (status === "approved") {
        await updateDoc(doc(db, "users", request.uid), {
          role: "admin",
        });
      }
    } catch (error) {
      console.error("Error updating admin request:", error);
      Alert.alert("Error", `Failed to ${status} request. Please try again.`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-24"
    >
      <View className="px-4 pt-8">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">
            Admin Requests
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            Review and approve access requests
          </Text>
        </View>

        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Pending
          </Text>
          <Text className="mt-1 text-3xl font-bold text-gray-900">
            {pendingRequests.length}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">
            Pending Requests
          </Text>

          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <View
                key={request.id}
                className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <View className="mb-3 flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {request.email}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">
                      UID: {request.uid}
                    </Text>
                  </View>
                  <View className="rounded-full bg-yellow-100 px-3 py-1">
                    <Text className="text-xs font-semibold text-yellow-700">
                      Pending
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleDecision(request, "approved")}
                    disabled={updatingId === request.id}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 active:bg-green-100"
                  >
                    {updatingId === request.id ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#16a34a"
                        />
                        <Text className="font-semibold text-green-700">
                          Approve
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => handleDecision(request, "rejected")}
                    disabled={updatingId === request.id}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 active:bg-red-100"
                  >
                    {updatingId === request.id ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#dc2626"
                        />
                        <Text className="font-semibold text-red-700">
                          Reject
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View className="rounded-2xl bg-white p-6">
              <Text className="text-center text-gray-500">
                No pending admin requests.
              </Text>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">
            Reviewed Requests
          </Text>

          {reviewedRequests.length > 0 ? (
            reviewedRequests.map((request) => (
              <View
                key={request.id}
                className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {request.email}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">
                      Reviewed by: {request.reviewedBy || "Unknown"}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${
                      request.status === "approved"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        request.status === "approved"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {request.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="rounded-2xl bg-white p-6">
              <Text className="text-center text-gray-500">
                No reviewed requests yet.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}