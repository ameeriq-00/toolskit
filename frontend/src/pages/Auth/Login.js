import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountCircle as UserIcon,
  Lock as LockIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate(location.state?.from || "/");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 255, 136, 0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: 4,
            background: "linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)",
            border: "1px solid #333",
            borderRadius: 3,
            boxShadow: "0 20px 60px rgba(0, 255, 136, 0.2)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <CardContent>
            {/* Logo/Brand */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  letterSpacing: "0.1em",
                  textShadow: "0 0 20px rgba(0, 255, 136, 0.5)",
                  mb: 1,
                }}
              >
                ⚡ TELECOM OPS
              </Typography>
              <Typography variant="h6" color="text.secondary">
                منصة التحليل المتقدمة
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                نظام تحليل البيانات والاتصالات
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ textAlign: "center", mb: 3 }}
              >
                تسجيل الدخول
              </Typography>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Username Field */}
              <TextField
                fullWidth
                label="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="كلمة المرور"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                sx={{ mb: 4 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Login Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !username || !password}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <LoginIcon />
                }
                sx={{
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  textTransform: "none",
                  background:
                    "linear-gradient(45deg, #00ff88 0%, #00cc6a 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #00cc6a 0%, #00ff88 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 25px rgba(0, 255, 136, 0.4)",
                  },
                  "&:disabled": {
                    background: "#333",
                    color: "#666",
                  },
                }}
              >
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </Box>

            {/* Footer Info */}
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                نظام محمي ومشفر • الإصدار 1.0.0
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            🔒 جميع البيانات محمية ومشفرة
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;