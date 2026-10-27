"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, tokenStore, ApiError } from "./api";
import type { AuthResponse, AuthUser, RegisterData } from "./types";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  function applyAuth({ token, ...u }: AuthResponse) {
    tokenStore.set(token);
    setUser(u);
  }

  // On page load: if a token is saved, ask the backend who we are
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api<AuthResponse>("/auth/me")
      .then(applyAuth)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) tokenStore.clear();
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    applyAuth(res);
  }

  async function register(data: RegisterData) {
    const res = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    applyAuth(res);
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}