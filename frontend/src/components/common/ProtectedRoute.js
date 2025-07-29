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

  // شاشة التحميل
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
        <Box>جاري التحقق من الصلاحيات...</Box>
      </Box>
    );
  }

  // إعادة توجيه لتسجيل الدخول
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // فحص صلاحيات المدير
  if (adminOnly && !isAdmin()) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="error">هذه الصفحة متاحة للمديرين فقط</Alert>
      </Box>
    );
  }

  // فحص الصلاحيات المطلوبة
  if (requiredPermissions.length > 0) {
    const hasRequired = requireAny
      ? hasAnyPermission(...requiredPermissions)
      : hasAllPermissions(...requiredPermissions);

    if (!hasRequired) {
      return (
        <Box sx={{ p: 3, textAlign: "center" }}>
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

  // فحص تغيير كلمة المرور
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
      <Box sx={{ p: 3, textAlign: "center" }}>
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

  // فحص حالة الحساب
  if (user.profile) {
    const profile = user.profile;

    // حساب مقفل
    if (profile.is_account_locked) {
      return (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Alert severity="error">
            حسابك مقفل مؤقتاً. يرجى التواصل مع الإدارة
          </Alert>
        </Box>
      );
    }

    // حساب منتهي الصلاحية
    if (profile.account_expires_at) {
      const expiryDate = new Date(profile.account_expires_at);
      const now = new Date();

      if (now > expiryDate) {
        return (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Alert severity="error">
              انتهت صلاحية حسابك. يرجى التواصل مع الإدارة
            </Alert>
          </Box>
        );
      }

      // تحذير انتهاء الصلاحية قريباً
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && location.pathname === "/") {
        return (
          <Box>
            <Alert severity="warning" sx={{ m: 2 }}>
              تنبيه: سينتهي حسابك خلال {daysUntilExpiry} أيام
            </Alert>
            {children}
          </Box>
        );
      }
    }
  }

  return children;
};

export default ProtectedRoute;
