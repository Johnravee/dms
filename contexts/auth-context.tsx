import { auth, db } from "@/config/firebase";
import { requestNotificationPermission } from "@/utils/notifications";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  User as FirebaseUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  register: (
    email: string,
    password: string,
    role?: "user" | "admin",
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to fetch user data from Firestore
const fetchUserFromFirestore = async (
  uid: string,
  email: string,
): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: uid,
        email: email,
        role: data.role || "user",
      };
    }
  } catch (error) {
    console.error("Error fetching user from Firestore:", error);
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // Fetch user data from Firestore
          const firestoreUser = await fetchUserFromFirestore(
            firebaseUser.uid,
            firebaseUser.email || "",
          );
          setUser(firestoreUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const register = async (
    email: string,
    password: string,
    role: "user" | "admin" = "user",
  ) => {
    // Validation
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Save user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        role: role,
        createdAt: serverTimestamp(),
      });

      setUser({
        id: userCredential.user.uid,
        email: email,
        role: role,
      });

      // Request notification permission and auto-register FCM immediately
      await requestNotificationPermission(userCredential.user.uid);
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Email already in use");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password is too weak");
      } else {
        throw new Error(error.message || "Registration failed");
      }
    }
  };

  const login = async (email: string, password: string) => {
    // Validation
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Fetch user data from Firestore
      const firestoreUser = await fetchUserFromFirestore(
        userCredential.user.uid,
        userCredential.user.email || "",
      );

      if (firestoreUser) {
        setUser(firestoreUser);
        // Auto-register FCM immediately when user logs in
        await requestNotificationPermission(userCredential.user.uid);
      } else {
        // If user doesn't exist in Firestore, create default entry
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "user",
          createdAt: serverTimestamp(),
        });

        setUser({
          id: userCredential.user.uid,
          email: userCredential.user.email || "",
          role: "user",
        });
        // Auto-register FCM immediately when user logs in
        await requestNotificationPermission(userCredential.user.uid);
      }
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === "auth/user-not-found") {
        throw new Error("Email not found");
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      } else {
        throw new Error(error.message || "Login failed");
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  };
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    // Validation
    if (!currentPassword || !newPassword) {
      throw new Error("Current and new passwords are required");
    }
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }
    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error("User not authenticated");
      }

      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === "auth/wrong-password") {
        throw new Error("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        throw new Error("New password is too weak");
      } else if (error.code === "auth/requires-recent-login") {
        throw new Error(
          "Please logout and login again before changing password",
        );
      } else {
        throw new Error(error.message || "Failed to change password");
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        register,
        login,
        logout,
        changePassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
