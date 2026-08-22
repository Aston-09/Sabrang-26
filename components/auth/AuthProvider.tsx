"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { User, UserRole } from "@/lib/types";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  role: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  useEffect(() => {
    let unsubscribe = () => {};

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        (event.reason.message?.includes("Database is closing") ||
          event.reason.message?.includes("database is closing") ||
          event.reason.code === "failed-precondition")
      ) {
        event.preventDefault();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", handleUnhandledRejection);
    }

    // Check session fallback (e.g. demo mode or local admin)
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("sabrang_auth");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role) {
            setRole(parsed.role);
            setUserData(parsed);
            setLoading(false);
          }
        } catch {}
      }
    }

    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          setUser(user);
          if (user) {
            try {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              if (userDoc.exists()) {
                const data = userDoc.data() as User;
                setUserData(data);
                setRole(data.role);
              } else {
                // If user exists in Auth, grant admin role by default
                setRole("admin");
              }
            } catch (error: any) {
              setRole("admin");
            }
          } else if (!sessionStorage.getItem("sabrang_auth")) {
            setUserData(null);
            setRole(null);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Auth state observer warning:", error);
          if (!sessionStorage.getItem("sabrang_auth")) {
            setLoading(false);
          }
        },
      );
    } catch (err) {
      console.warn("Could not subscribe to Firebase auth state:", err);
      setLoading(false);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "unhandledrejection",
          handleUnhandledRejection,
        );
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
