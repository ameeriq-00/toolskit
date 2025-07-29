import React, { useState, useEffect } from "react";
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
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle as UserIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Check connection status
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);

    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError("لا يوجد اتصال بالإنترنت");
      return;
    }

    if (!username.trim() || !password) {
      setError("جميع الحقول مطلوبة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login({ username: username.trim(), password });

      if (result.success) {
        const userData = result.data.user;

        // Check if password change is required
        if (userData.must_change_password) {
          navigate("/change-password", {
            state: {
              from: location.state?.from || "/",
              forceChange: true,
              message: "يجب تغيير كلمة المرور قبل المتابعة",
            },
          });
          return;
        }

        // Check account expiry
        if (userData.profile?.account_expires_at) {
          const expiryDate = new Date(userData.profile.account_expires_at);
          const daysUntilExpiry = Math.ceil(
            (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiry <= 7) {
            // Show warning but allow login
            setError(`تنبيه: سينتهي حسابك خلال ${daysUntilExpiry} أيام`);
            setTimeout(() => {
              navigate(location.state?.from || "/");
            }, 3000);
            return;
          }
        }

        // Successful login
        navigate(location.state?.from || "/");
      } else {
        setError(result.error);
        setLoginAttempts((prev) => prev + 1);
        setRemainingAttempts((prev) => Math.max(0, prev - 1));

        // Parse remaining attempts from error message if available
        if (result.error.includes("محاولة")) {
          const match = result.error.match(/محاولة (\d+)\/(\d+)/);
          if (match) {
            const current = parseInt(match[1]);
            const max = parseInt(match[2]);
            setRemainingAttempts(max - current);
          }
        }
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      setLoginAttempts((prev) => prev + 1);
      setRemainingAttempts((prev) => Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameBlur = async () => {
    if (username.trim().length >= 3) {
      try {
        // You can add username validation here if needed
        setUsernameError("");
      } catch (error) {
        console.warn("Username validation failed:", error);
      }
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Basic password strength indicator (for user feedback only)
    if (newPassword.length > 0) {
      let strength = 0;
      if (newPassword.length >= 8) strength += 25;
      if (/[A-Z]/.test(newPassword)) strength += 25;
      if (/[a-z]/.test(newPassword)) strength += 25;
      if (/[0-9]/.test(newPassword)) strength += 25;

      setPasswordStrength({
        score: strength,
        label: strength < 50 ? "ضعيف" : strength < 75 ? "متوسط" : "قوي",
        color: strength < 50 ? "error" : strength < 75 ? "warning" : "success",
      });
    } else {
      setPasswordStrength(null);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const getSecurityLevel = () => {
    const attempts = loginAttempts;
    if (attempts === 0)
      return { level: "عادي", color: "success", icon: SecurityIcon };
    if (attempts <= 2)
      return { level: "مراقب", color: "warning", icon: WarningIcon };
    return { level: "عالي", color: "error", icon: WarningIcon };
  };

  const securityLevel = getSecurityLevel();

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
      {/* Connection Status */}
      {!isConnected && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "error.main",
            color: "white",
            padding: 1,
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          لا يوجد اتصال بالإنترنت
        </Box>
      )}

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "rgba(15, 15, 15, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            boxShadow: "0 20px 60px rgba(0, 255, 136, 0.2)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: "linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)",
              padding: 3,
              textAlign: "center",
              position: "relative",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: "#000",
                fontWeight: "bold",
                marginBottom: 1,
              }}
            >
              راصد
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#000",
                opacity: 0.8,
              }}
            >
              نظام التحليل المتقدم والأمان
            </Typography>

            {/* Security Level Indicator */}
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <securityLevel.icon
                sx={{
                  color: `${securityLevel.color}.main`,
                  fontSize: 20,
                }}
              />
              <Chip
                label={`أمان: ${securityLevel.level}`}
                size="small"
                color={securityLevel.color}
                variant="outlined"
                sx={{
                  backgroundColor: "rgba(0,0,0,0.1)",
                  color: "#000",
                  fontWeight: "bold",
                }}
              />
            </Box>
          </Box>

          <CardContent sx={{ padding: 4 }}>
            {/* Login Attempts Warning */}
            {loginAttempts > 0 && (
              <Alert
                severity={remainingAttempts <= 2 ? "error" : "warning"}
                sx={{ marginBottom: 2 }}
              >
                {remainingAttempts > 0
                  ? `تبقى ${remainingAttempts} محاولة(محاولات) قبل قفل الحساب`
                  : "تم استنفاد جميع المحاولات. سيتم قفل الحساب."}
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert
                severity={error.includes("تنبيه") ? "warning" : "error"}
                sx={{ marginBottom: 2 }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Username Field */}
                <TextField
                  fullWidth
                  label="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleUsernameBlur}
                  error={!!usernameError}
                  helperText={usernameError}
                  disabled={loading || remainingAttempts === 0}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserIcon sx={{ color: "#00ff88" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "rgba(0, 255, 136, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(0, 255, 136, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#00ff88",
                        },
                      },
                    },
                  }}
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-focused": {
                        color: "#00ff88",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "white",
                      direction: "ltr",
                    },
                  }}
                />

                {/* Password Field */}
                <Box>
                  <TextField
                    fullWidth
                    label="كلمة المرور"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading || remainingAttempts === 0}
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
                            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "rgba(0, 255, 136, 0.3)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(0, 255, 136, 0.5)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#00ff88",
                          },
                        },
                      },
                    }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        color: "rgba(255, 255, 255, 0.7)",
                        "&.Mui-focused": {
                          color: "#00ff88",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "white",
                      },
                    }}
                  />

                  {/* Password Strength Indicator */}
                  {passwordStrength && (
                    <Box sx={{ marginTop: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "rgba(255,255,255,0.7)" }}
                        >
                          قوة كلمة المرور
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              passwordStrength.color === "error"
                                ? "#f44336"
                                : passwordStrength.color === "warning"
                                ? "#ff9800"
                                : "#4caf50",
                          }}
                        >
                          {passwordStrength.label}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength.score}
                        color={passwordStrength.color}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "rgba(255,255,255,0.1)",
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Login Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !isConnected || remainingAttempts === 0}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <LoginIcon />
                    )
                  }
                  sx={{
                    background:
                      "linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)",
                    color: "#000",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    padding: "12px",
                    borderRadius: 2,
                    marginTop: 2,
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #00cc6a 0%, #00aa55 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 25px rgba(0, 255, 136, 0.4)",
                    },
                    "&:disabled": {
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(255, 255, 255, 0.3)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </Box>
            </form>

            {/* Security Notice */}
            <Box
              sx={{
                marginTop: 3,
                padding: 2,
                backgroundColor: "rgba(0, 255, 136, 0.05)",
                borderRadius: 2,
                border: "1px solid rgba(0, 255, 136, 0.2)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.6)",
                  display: "block",
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                🔒 نظام راصد محمي بأحدث معايير الأمان
                <br />
                جميع العمليات مُراقبة ومُسجلة لضمان الأمان
              </Typography>
            </Box>

            {/* Development Info */}
            {process.env.NODE_ENV === "development" && (
              <Box
                sx={{
                  marginTop: 2,
                  padding: 2,
                  backgroundColor: "rgba(255, 193, 7, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#ffc107",
                    display: "block",
                    textAlign: "center",
                    fontFamily: "monospace",
                  }}
                >
                  🚧 بيئة التطوير - للاختبار فقط
                  <br />
                  المدير الافتراضي: admin / Admin@123
                </Typography>
              </Box>
            )}

            {/* Footer Info */}
            <Box sx={{ marginTop: 3, textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.75rem",
                }}
              >
                راصد v2.0 - نظام التحليل المتقدم
                <br />© 2024 جميع الحقوق محفوظة
              </Typography>
            </Box>
          </CardContent>
        </Paper>

        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9998,
            }}
          >
            <Box
              sx={{
                backgroundColor: "rgba(15, 15, 15, 0.95)",
                padding: 4,
                borderRadius: 2,
                border: "1px solid rgba(0, 255, 136, 0.3)",
                textAlign: "center",
              }}
            >
              <CircularProgress sx={{ color: "#00ff88", marginBottom: 2 }} />
              <Typography sx={{ color: "white" }}>
                جاري التحقق من بيانات الدخول...
              </Typography>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Login;