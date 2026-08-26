"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserRole } from "./types/portal";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  mrn?: string;
  department?: string;
  hospital?: string;
  deviceId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem("dithar_session", JSON.stringify(data.user));
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore network errors and fallback to local storage
    }

    // Fallback to local storage if API didn't return cookie
    const session = typeof window !== "undefined" ? localStorage.getItem("dithar_session") : null;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUser(parsed);
      } catch (e) {
        console.error("Invalid session data");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // refreshSession awaits a fetch before touching state, so this doesn't cascade
    // synchronous renders; it's the standard fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSession();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("dithar_session", JSON.stringify(userData));
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/me", { method: "DELETE" });
    } catch {
      // ignore
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("dithar_session");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
