import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setUser(data.data);
          localStorage.setItem("user", JSON.stringify(data.data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verify();
  }, []); // eslint-disable-line

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const { data } = await authAPI.register({ name, email, password, role });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // Permission helper — uses same map as backend
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    const perms = {
      viewer:  ["read:records", "read:dashboard"],
      analyst: ["read:records", "read:dashboard", "read:insights"],
      admin:   ["read:records", "read:dashboard", "read:insights",
                 "create:records", "update:records", "delete:records",
                 "create:users", "update:users", "delete:users", "read:users"],
    };
    return (perms[user.role] || []).includes(permission);
  }, [user]);

  const isAdmin   = user?.role === "admin";
  const isAnalyst = user?.role === "analyst" || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasPermission, isAdmin, isAnalyst }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
