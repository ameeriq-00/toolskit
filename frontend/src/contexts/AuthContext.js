import React, { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = await apiService.getUserInfo();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      await apiService.login(credentials);
      const userData = await apiService.getUserInfo();
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      };
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
