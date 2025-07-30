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
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle as UserIcon,
  Lock as LockIcon,
  FlightTakeoff as PlaneIcon,
  Security,
  Warning,
  WifiOff,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [animateElements, setAnimateElements] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // تتبع حالة الاتصال والرسوم المتحركة
  useEffect(() => {
    const timer = setTimeout(() => setAnimateElements(true), 100);

    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // تحديث البيانات
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "password" && value) {
      setPasswordStrength(calculatePasswordStrength(value));
    } else if (field === "password") {
      setPasswordStrength(null);
    }
  };

  // حساب قوة كلمة المرور
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;

    return {
      score,
      label: score < 50 ? "ضعيف" : score < 75 ? "متوسط" : "قوي",
      color: score < 50 ? "error" : score < 75 ? "warning" : "success",
    };
  };

  // تسجيل الدخول
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError("لا يوجد اتصال بالإنترنت");
      return;
    }

    if (!formData.username.trim() || !formData.password) {
      setError("جميع الحقول مطلوبة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(formData);

      if (result.success) {
        const user = result.data.user;

        // التحقق من تغيير كلمة المرور
        if (user.must_change_password) {
          navigate("/change-password", {
            state: { from: location.state?.from || "/" },
          });
          return;
        }

        // التحقق من انتهاء الحساب
        if (user.profile?.account_expires_at) {
          const daysLeft = Math.ceil(
            (new Date(user.profile.account_expires_at) - new Date()) /
              (1000 * 60 * 60 * 24)
          );

          if (daysLeft <= 7) {
            setError(`تنبيه: سينتهي حسابك خلال ${daysLeft} أيام`);
            setTimeout(() => navigate(location.state?.from || "/"), 3000);
            return;
          }
        }

        navigate(location.state?.from || "/");
      } else {
        setError(result.error);
        setLoginAttempts((prev) => prev + 1);
        setRemainingAttempts((prev) => Math.max(0, prev - 1));

        // استخراج عدد المحاولات المتبقية من رسالة الخطأ
        if (result.error.includes("محاولة")) {
          const match = result.error.match(/محاولة (\d+)\/(\d+)/);
          if (match) {
            const current = parseInt(match[1]);
            const max = parseInt(match[2]);
            setRemainingAttempts(max - current);
          }
        }
      }
    } catch {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      setLoginAttempts((prev) => prev + 1);
      setRemainingAttempts((prev) => Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  };

  // مستوى الأمان
  const getSecurityLevel = () => {
    if (loginAttempts === 0)
      return { level: "عادي", color: "success", icon: Security };
    if (loginAttempts <= 2)
      return { level: "مراقب", color: "warning", icon: Warning };
    return { level: "عالي", color: "error", icon: Warning };
  };

  const securityLevel = getSecurityLevel();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        p: isMobile ? 1 : 0,
        // خلفية أمنية وعسكرية محدثة
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.03) 0%, transparent 70%),
          radial-gradient(circle at 80% 20%, rgba(0, 255, 136, 0.05) 0%, transparent 70%),
          radial-gradient(circle at 40% 90%, rgba(0, 255, 136, 0.04) 0%, transparent 70%),
          linear-gradient(135deg, #0a0a0a 0%, #1a2332 30%, #0f1419 70%, #0a0a0a 100%)
        `,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          // خلفية شبكة سايبر
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            radial-gradient(circle at 30% 40%, rgba(0, 255, 136, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 70% 60%, rgba(0, 255, 136, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px, 50px 50px, 100px 100px, 150px 150px",
          animation: "cyber-move 20s linear infinite",
          pointerEvents: "none",
          "@keyframes cyber-move": {
            "0%": { transform: "translate(0, 0)" },
            "100%": { transform: "translate(20px, 20px)" },
          },
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          // خطوط عسكرية متحركة
          background: `
            linear-gradient(45deg, transparent 30%, rgba(0, 255, 136, 0.02) 35%, rgba(0, 255, 136, 0.02) 65%, transparent 70%),
            linear-gradient(-45deg, transparent 30%, rgba(0, 255, 136, 0.015) 35%, rgba(0, 255, 136, 0.015) 65%, transparent 70%)
          `,
          backgroundSize: "200px 200px",
          animation: "military-scan 15s linear infinite",
          pointerEvents: "none",
          "@keyframes military-scan": {
            "0%": {
              transform: "translateX(-100px) translateY(-100px)",
              opacity: 0.3,
            },
            "50%": {
              opacity: 0.8,
            },
            "100%": {
              transform: "translateX(100px) translateY(100px)",
              opacity: 0.3,
            },
          },
        },
      }}
    >
      {/* مؤشرات أمنية متحركة في الزوايا */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          width: 3,
          height: 40,
          background: "linear-gradient(180deg, #00ff88, transparent)",
          animation: "security-blink 3s ease-in-out infinite",
          "@keyframes security-blink": {
            "0%, 100%": { opacity: 0.3 },
            "50%": { opacity: 1 },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 40,
          height: 3,
          background: "linear-gradient(90deg, #00ff88, transparent)",
          animation: "security-blink 3s ease-in-out infinite 1s",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: 20,
          width: 40,
          height: 3,
          background: "linear-gradient(-90deg, #00ff88, transparent)",
          animation: "security-blink 3s ease-in-out infinite 2s",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 3,
          height: 40,
          background: "linear-gradient(0deg, #00ff88, transparent)",
          animation: "security-blink 3s ease-in-out infinite 0.5s",
        }}
      />

      {/* مؤشر عدم الاتصال */}
      {!isConnected && (
        <Slide direction="down" in>
          <Alert
            severity="error"
            icon={<WifiOff />}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              borderRadius: 0,
            }}
          >
            لا يوجد اتصال بالإنترنت
          </Alert>
        </Slide>
      )}

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 2 }}>
        <Fade in={animateElements} timeout={800}>
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
            {/* شريط حالة الاتصال */}
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
                justifyContent: "space-between",
                fontSize: isMobile ? "0.8rem" : "0.9rem",
                fontWeight: "bold",
                letterSpacing: "0.05em",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
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
                {isConnected ? "CONNECTED • SECURE" : "DISCONNECTED"}
              </Box>

              {/* مؤشر الأمان */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <securityLevel.icon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                  {securityLevel.level}
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: isMobile ? 4 : 6 }}>
              {/* الشعار والعلامة التجارية */}
              <Slide direction="down" in={animateElements} timeout={600}>
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  {/* الشعار */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "h4" : "h3"}
                      sx={{
                        color: "#00ff88",
                        fontWeight: "bold",
                        fontSize: isMobile ? "2rem" : "2.5rem",
                        letterSpacing: "0.1em",
                        textShadow: "0 0 20px rgba(0, 255, 136, 0.5)",
                      }}
                    >
                      راصد
                    </Typography>
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: isMobile ? "0.9rem" : "1rem",
                      mb: 1,
                    }}
                  >
                    منصة التحليل المتقدمة للاتصالات
                  </Typography>

                  {/* مؤشر الحماية */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Chip
                      label="🔐 ENCRYPTED"
                      size="small"
                      sx={{
                        backgroundColor: "rgba(0, 255, 136, 0.1)",
                        color: "#00ff88",
                        fontSize: "0.7rem",
                      }}
                    />
                    <Chip
                      label="🛡️ SECURED"
                      size="small"
                      sx={{
                        backgroundColor: "rgba(0, 255, 136, 0.1)",
                        color: "#00ff88",
                        fontSize: "0.7rem",
                      }}
                    />
                  </Box>
                </Box>
              </Slide>

              {/* نموذج تسجيل الدخول */}
              <Slide direction="up" in={animateElements} timeout={800}>
                <Box component="form" onSubmit={handleSubmit}>
                  {/* تحذيرات المحاولات */}
                  {loginAttempts > 0 && (
                    <Alert
                      severity={remainingAttempts <= 2 ? "error" : "warning"}
                      sx={{
                        mb: 3,
                        background:
                          remainingAttempts <= 2
                            ? "rgba(255, 23, 68, 0.1)"
                            : "rgba(255, 152, 0, 0.1)",
                        border:
                          remainingAttempts <= 2
                            ? "1px solid rgba(255, 23, 68, 0.3)"
                            : "1px solid rgba(255, 152, 0, 0.3)",
                      }}
                    >
                      {remainingAttempts > 0
                        ? `تبقى ${remainingAttempts} محاولة قبل قفل الحساب`
                        : "تم استنفاد جميع المحاولات"}
                    </Alert>
                  )}

                  {/* تحذير الخطأ */}
                  {error && (
                    <Alert
                      severity={error.includes("تنبيه") ? "warning" : "error"}
                      sx={{
                        mb: 3,
                        background: error.includes("تنبيه")
                          ? "rgba(255, 152, 0, 0.1)"
                          : "rgba(255, 23, 68, 0.1)",
                        border: error.includes("تنبيه")
                          ? "1px solid rgba(255, 152, 0, 0.3)"
                          : "1px solid rgba(255, 23, 68, 0.3)",
                      }}
                      onClose={() => setError("")}
                    >
                      {error}
                    </Alert>
                  )}

                  {/* حقل اسم المستخدم */}
                  <TextField
                    fullWidth
                    label="اسم المستخدم"
                    value={formData.username}
                    onChange={(e) => updateFormData("username", e.target.value)}
                    required
                    disabled={loading || remainingAttempts === 0}
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
                        "&.Mui-focused": {
                          color: "#00ff88",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#fff",
                        direction: "ltr",
                        fontSize: isMobile ? "1rem" : "1.1rem",
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

                  {/* حقل كلمة المرور */}
                  <Box>
                    <TextField
                      fullWidth
                      label="كلمة المرور"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        updateFormData("password", e.target.value)
                      }
                      required
                      disabled={loading || remainingAttempts === 0}
                      sx={{
                        mb: passwordStrength ? 1 : 4,
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
                          "&.Mui-focused": {
                            color: "#00ff88",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: "#fff",
                          fontSize: isMobile ? "1rem" : "1.1rem",
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
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              disabled={loading}
                              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* مؤشر قوة كلمة المرور */}
                    {passwordStrength && (
                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
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

                  {/* زر تسجيل الدخول الدائري */}
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mb: 3 }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: isMobile ? 100 : 120,
                        height: isMobile ? 100 : 120,
                      }}
                    >
                      {/* الحدود المتحركة */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          background:
                            "conic-gradient(from 0deg, #00ff88, #00cc6a, #00ff88)",
                          padding: "2px",
                          animation: loading
                            ? "spin 2s linear infinite"
                            : "none",
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
                            background:
                              "linear-gradient(145deg, #1a2332, #0a0a0a)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Button
                            type="submit"
                            disabled={
                              loading ||
                              !formData.username ||
                              !formData.password ||
                              !isConnected ||
                              remainingAttempts === 0
                            }
                            sx={{
                              width: isMobile ? 70 : 80,
                              height: isMobile ? 70 : 80,
                              borderRadius: "50%",
                              background: loading
                                ? "rgba(255, 255, 255, 0.1)"
                                : "linear-gradient(45deg, #00ff88 0%, #00cc6a 100%)",
                              color: loading ? "#fff" : "#000",
                              border: "none",
                              minWidth: "auto",
                              fontSize: isMobile ? "1rem" : "1.2rem",
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
                              <CircularProgress
                                size={isMobile ? 20 : 24}
                                sx={{ color: "#fff" }}
                              />
                            ) : (
                              <PlaneIcon
                                sx={{
                                  fontSize: isMobile ? 24 : 28,
                                  transform: "rotate(45deg)",
                                }}
                              />
                            )}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Slide>

              {/* التذييل */}
              <Fade in={animateElements} timeout={1200}>
                <Box sx={{ mt: 4, textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: isMobile ? "0.7rem" : "0.75rem",
                      mb: 1,
                      display: "block",
                    }}
                  >
                    🔒 نظام محمي ومشفر • راصد الإصدار 2.0
                  </Typography>

                  {/* معلومات التطوير */}
                  {process.env.NODE_ENV === "development" && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#ffc107",
                          fontFamily: "monospace",
                          fontSize: isMobile ? "0.65rem" : "0.7rem",
                        }}
                      >
                        🚧 بيئة التطوير - admin / Admin@123
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Fade>
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* شاشة التحميل الكاملة */}
      {loading && (
        <Fade in={loading}>
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              backdropFilter: "blur(5px)",
            }}
          >
            <Box
              sx={{
                backgroundColor: "rgba(15, 15, 15, 0.95)",
                p: isMobile ? 3 : 4,
                borderRadius: 2,
                border: "1px solid rgba(0, 255, 136, 0.3)",
                textAlign: "center",
                minWidth: isMobile ? "80%" : 300,
              }}
            >
              <CircularProgress sx={{ color: "#00ff88", mb: 2 }} />
              <Typography
                sx={{ color: "white", fontSize: isMobile ? "0.9rem" : "1rem" }}
              >
                جاري التحقق من بيانات الدخول...
              </Typography>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default Login;
