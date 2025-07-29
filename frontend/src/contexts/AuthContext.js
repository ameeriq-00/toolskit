import React, { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [securityInfo, setSecurityInfo] = useState({});

  useEffect(() => {
    checkAuth();
    // Auto-refresh user info every 5 minutes
    const interval = setInterval(refreshUserInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = await apiService.getUserInfo();
        setUser(userData);
        setPermissions(userData.permissions || []);

        // Get security dashboard if user has permissions
        if (hasPermission("view_security_alerts") || userData.is_superuser) {
          loadSecurityInfo();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        logout();
      }
    }
    setLoading(false);
  };

  const refreshUserInfo = async () => {
    if (user && apiService.isAuthenticated()) {
      try {
        const userData = await apiService.getUserInfo();
        setUser(userData);
        setPermissions(userData.permissions || []);
      } catch (error) {
        console.warn("Failed to refresh user info:", error);
      }
    }
  };

  const loadSecurityInfo = async () => {
    try {
      const securityData = await apiService.getSecurityDashboard();
      setSecurityInfo(securityData.data || {});
    } catch (error) {
      console.warn("Failed to load security info:", error);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const userData = response.data.user;

      setUser(userData);
      setPermissions(userData.permissions || []);

      // Load security info for privileged users
      if (hasPermission("view_security_alerts") || userData.is_superuser) {
        loadSecurityInfo();
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: apiService.formatError(error),
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn("Logout request failed:", error);
    }

    setUser(null);
    setPermissions([]);
    setSecurityInfo({});
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await apiService.changeMyPassword(passwordData);
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        error: apiService.formatError(error),
      };
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...permissionsList) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return permissionsList.some((permission) =>
      permissions.includes(permission)
    );
  };

  const hasAllPermissions = (...permissionsList) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return permissionsList.every((permission) =>
      permissions.includes(permission)
    );
  };

  const isAdmin = () => {
    return user?.is_superuser || hasPermission("manage_system");
  };

  const canManageUsers = () => {
    return hasAnyPermission(
      "view_users",
      "create_users",
      "edit_users",
      "delete_users"
    );
  };

  const canAnalyzeData = () => {
    return hasAnyPermission("analyze_excel", "compare_sheets");
  };

  const canManageSites = () => {
    return hasAnyPermission("upload_sites", "manage_sites");
  };

  const canViewSecurity = () => {
    return hasAnyPermission("view_activities", "view_security_alerts");
  };

  const getFullName = () => {
    if (!user) return "";
    return (
      user.full_name ||
      `${user.first_name} ${user.last_name}`.trim() ||
      user.username
    );
  };

  const getRoleName = () => {
    return user?.role || "مستخدم";
  };

  const needsPasswordChange = () => {
    return user?.profile?.must_change_password || false;
  };

  const isAccountLocked = () => {
    return securityInfo?.account_status?.is_locked || false;
  };

  const getAccountExpiryDate = () => {
    return user?.profile?.account_expires_at;
  };

  const getLastLoginInfo = () => {
    return {
      date: user?.last_login,
      ip: user?.profile?.last_login_ip,
    };
  };

  const getSecurityStats = () => {
    return securityInfo?.security_stats || {};
  };

  const refreshSecurityInfo = () => {
    if (canViewSecurity()) {
      loadSecurityInfo();
    }
  };

  const reportSuspiciousActivity = async (
    description,
    activityType = "suspicious_activity"
  ) => {
    try {
      const response = await apiService.reportSuspiciousActivity({
        description,
        activity_type: activityType,
      });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        error: apiService.formatError(error),
      };
    }
  };

  const value = {
    // State
    user,
    loading,
    permissions,
    securityInfo,

    // Actions
    login,
    logout,
    changePassword,
    refreshUserInfo,
    refreshSecurityInfo,
    reportSuspiciousActivity,

    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    canManageUsers,
    canAnalyzeData,
    canManageSites,
    canViewSecurity,

    // User info
    getFullName,
    getRoleName,
    needsPasswordChange,
    isAccountLocked,
    getAccountExpiryDate,
    getLastLoginInfo,
    getSecurityStats,

    // Convenience
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Higher-order component for permission-based rendering
export const withPermission = (permission) => (Component) => {
  return (props) => {
    const { hasPermission } = useAuth();

    if (!hasPermission(permission)) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#666",
          }}
        >
          ليس لديك صلاحية للوصول لهذه الصفحة
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook for permission-based conditional rendering
export const usePermission = (permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Hook for multiple permissions
export const usePermissions = (...permissions) => {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(...permissions);
};
