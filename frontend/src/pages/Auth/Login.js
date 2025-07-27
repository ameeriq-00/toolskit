import React, { useState } from "react";
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
  Paper,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle as UserIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  FlightTakeoff as PlaneIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(true);

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
          "linear-gradient(135deg, #0a0a0a 0%, #1a2332 50%, #0a0a0a 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 60% 80%, rgba(0, 255, 136, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: "none",
        },
      }}
    >
      {/* World Map Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='map' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M10,10 L20,15 L30,10 L40,20 L50,15 L60,25 L70,20 L80,30 L90,25' stroke='%23ffffff' stroke-width='0.5' fill='none' opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23map)'/%3E%3C/svg%3E")`,
          opacity: 0.3,
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 2 }}>
        {/* Main Login Card */}
        <Card
          sx={{
            background:
              "linear-gradient(145deg, rgba(26, 35, 50, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 255, 136, 0.2)",
            borderRadius: 4,
            boxShadow: "0 25px 60px rgba(0, 255, 136, 0.15)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Connection Status Bar */}
          <Box
            sx={{
              background: isConnected
                ? "linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)"
                : "linear-gradient(90deg, #ff4444 0%, #cc3333 100%)",
              color: "#000",
              py: 1,
              px: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              fontWeight: "bold",
              letterSpacing: "0.05em",
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#000",
                mr: 1,
                animation: isConnected ? "pulse 2s infinite" : "none",
                "@keyframes pulse": {
                  "0%": { opacity: 1 },
                  "50%": { opacity: 0.5 },
                  "100%": { opacity: 1 },
                },
              }}
            />
            // {isConnected ? "CONNECTED" : "DISCONNECTED"}
          </Box>

          <CardContent sx={{ p: 6 }}>
            

            {/* Logo/Brand Section */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  color: "#00ff88",
                  fontWeight: "bold",
                  fontSize: "2.5rem",
                  letterSpacing: "0.1em",
                  textShadow: "0 0 20px rgba(0, 255, 136, 0.5)",
                  mb: 1,
                }}
              >
                راصد
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1rem" }}
              >
                منصة التحليل المتقدمة للاتصالات
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    background: "rgba(255, 23, 68, 0.1)",
                    border: "1px solid rgba(255, 23, 68, 0.3)",
                    color: "#ff1744",
                  }}
                >
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
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255, 255, 255, 0.05)",
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "#00ff88",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#00ff88",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                  "& .MuiInputBase-input": {
                    color: "#fff",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserIcon sx={{ color: "#00ff88" }} />
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
                sx={{
                  mb: 4,
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255, 255, 255, 0.05)",
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "#00ff88",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#00ff88",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                  "& .MuiInputBase-input": {
                    color: "#fff",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#00ff88" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={loading}
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Login Button Circle */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 120,
                    height: 120,
                  }}
                >
                  {/* Animated Border */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: "50%",
                      background:
                        "conic-gradient(from 0deg, #00ff88, #00cc6a, #00ff88)",
                      padding: "2px",
                      animation: loading ? "spin 2s linear infinite" : "none",
                      "@keyframes spin": {
                        from: { transform: "rotate(0deg)" },
                        to: { transform: "rotate(360deg)" },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "linear-gradient(145deg, #1a2332, #0a0a0a)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        type="submit"
                        disabled={loading || !username || !password}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          background: loading
                            ? "rgba(255, 255, 255, 0.1)"
                            : "linear-gradient(45deg, #00ff88 0%, #00cc6a 100%)",
                          color: loading ? "#fff" : "#000",
                          border: "none",
                          minWidth: "auto",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: !loading ? "scale(1.05)" : "none",
                            boxShadow: !loading
                              ? "0 0 25px rgba(0, 255, 136, 0.6)"
                              : "none",
                          },
                          "&:disabled": {
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "rgba(255, 255, 255, 0.5)",
                          },
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} sx={{ color: "#fff" }} />
                        ) : (
                          <PlaneIcon
                            sx={{ fontSize: 28, transform: "rotate(45deg)" }}
                          />
                        )}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Stop Button */}
              
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.5)" }}
              >
                🔒 نظام محمي ومشفر • الإصدار 1.0.0
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;