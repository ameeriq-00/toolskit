import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="primary">
          جاري التحقق من الصلاحيات...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          يرجى الانتظار
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check admin permission if required
  if (adminOnly && !user.is_staff) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          p: 3,
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          غير مصرح
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          ليس لديك صلاحية للوصول إلى هذه الصفحة
        </Typography>
        <Typography variant="body2" color="text.secondary">
          هذه الصفحة مخصصة للمديرين فقط
        </Typography>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;