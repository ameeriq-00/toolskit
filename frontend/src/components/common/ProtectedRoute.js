import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  requiredPermissions = [],
  requireAny = false,
  adminOnly = false,
}) => {
  const {
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    needsPasswordChange,
  } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Box sx={{ textAlign: "center" }}>جاري التحقق من الصلاحيات...</Box>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin access is required
  if (adminOnly && !isAdmin()) {
    return (
      <Box sx={{ padding: 3, textAlign: "center" }}>
        <Alert severity="error">هذه الصفحة متاحة للمديرين فقط</Alert>
      </Box>
    );
  }

  // Check permissions if specified
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAny
      ? hasAnyPermission(...requiredPermissions)
      : hasAllPermissions(...requiredPermissions);

    if (!hasRequiredPermissions) {
      return (
        <Box sx={{ padding: 3, textAlign: "center" }}>
          <Alert severity="warning">
            ليس لديك الصلاحيات المطلوبة للوصول إلى هذه الصفحة
            <br />
            <small>
              الصلاحيات المطلوبة:{" "}
              {requiredPermissions.join(requireAny ? " أو " : " و ")}
            </small>
          </Alert>
        </Box>
      );
    }
  }

  // Check if password change is required (except for certain routes)
  const passwordChangeExemptRoutes = [
    "/my-security",
    "/change-password",
    "/settings",
  ];
  const isExemptRoute = passwordChangeExemptRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (needsPasswordChange() && !isExemptRoute) {
    return (
      <Box sx={{ padding: 3, textAlign: "center" }}>
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => (window.location.href = "/my-security")}
            >
              تغيير الآن
            </Button>
          }
        >
          يجب تغيير كلمة المرور قبل الوصول للنظام
        </Alert>
      </Box>
    );
  }

  // Account status checks
  if (user.profile) {
    const profile = user.profile;

    // Check if account is locked
    if (profile.is_account_locked) {
      return (
        <Box sx={{ padding: 3, textAlign: "center" }}>
          <Alert severity="error">
            حسابك مقفل مؤقتاً. يرجى المحاولة لاحقاً أو التواصل مع الإدارة
          </Alert>
        </Box>
      );
    }

    // Check if account is expired
    if (profile.account_expires_at) {
      const expiryDate = new Date(profile.account_expires_at);
      const now = new Date();

      if (now > expiryDate) {
        return (
          <Box sx={{ padding: 3, textAlign: "center" }}>
            <Alert severity="error">
              انتهت صلاحية حسابك. يرجى التواصل مع الإدارة
            </Alert>
          </Box>
        );
      }

      // Show warning if account expires soon (within 7 days)
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && location.pathname === "/") {
        // Show warning only on dashboard
        return (
          <Box>
            <Alert severity="warning" sx={{ margin: 2 }}>
              تنبيه: سينتهي حسابك خلال {daysUntilExpiry} أيام
            </Alert>
            {children}
          </Box>
        );
      }
    }
  }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;
