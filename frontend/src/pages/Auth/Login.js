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
  Fingerprint, // الأيقونة الجديدة
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
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [animateElements, setAnimateElements] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

          if (daysLeft <= 7 && daysLeft > 0) {
            setError(`تنبيه: سينتهي حسابك خلال ${daysLeft} أيام`);
            setTimeout(() => navigate(location.state?.from || "/"), 3500);
            return;
          }
        }

        navigate(location.state?.from || "/");
      } else {
        setError(result.error);
        setLoginAttempts((prev) => prev + 1);

        // استخراج عدد المحاولات المتبقية
        if (result.error.includes("محاولة")) {
          const match = result.error.match(/محاولة (\d+)\/(\d+)/);
          if (match) {
            const current = parseInt(match[1]);
            const max = parseInt(match[2]);
            setRemainingAttempts(max - current);
          }
        } else {
          setRemainingAttempts((prev) => Math.max(0, prev - 1));
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        p: isMobile ? 1 : 2,
        // خلفية أمنية وعسكرية محدثة (كما كانت)
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
            "50%": { opacity: 0.8 },
            "100%": {
              transform: "translateX(100px) translateY(100px)",
              opacity: 0.3,
            },
          },
        },
      }}
    >
      {/* مؤشرات أمنية متحركة في الزوايا (كما كانت) */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          width: 3,
          height: 40,
          background: "linear-gradient(180deg, #00ff88, transparent)",
          animation: "security-blink 3s ease-in-out infinite",
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
      <style>{`@keyframes security-blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>

      {/* مؤشر عدم الاتصال */}
      {!isConnected && (
        <Slide direction="down" in={true}>
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
              justifyContent: "center",
            }}
          >
            لا يوجد اتصال بالإنترنت
          </Alert>
        </Slide>
      )}

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 2 }}>
        <Fade in={animateElements} timeout={800}>
          <Card
            sx={{
              background:
                "linear-gradient(145deg, rgba(26, 35, 50, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 255, 136, 0.2)",
              borderRadius: 4,
              boxShadow: "0 25px 60px rgba(0, 255, 136, 0.15)",
            }}
          >
            <CardContent sx={{ p: isMobile ? 3 : 4 }}>
              {/* الشعار والعلامة التجارية */}
              <Slide direction="down" in={animateElements} timeout={600}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  {/* مستطيل أخضر ناعم للوكو */}
                  <Box
                    sx={{
                      display: "inline-block",
                      p: 2,
                      mb: 2,
                      backgroundColor: "#00ff88",
                      borderRadius: 3, // حواف ناعمة
                      boxShadow: "0 8px 24px rgba(0, 255, 136, 0.3)",
                      position: "relative",
                      overflow: "hidden",
                      // تأثير لمعان خفيف
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                        animation: "logoShine 3s infinite",
                      },
                      "@keyframes logoShine": {
                        "0%": { left: "-100%" },
                        "100%": { left: "100%" },
                      },
                    }}
                  >
                    {/* الصورة مع طبقة سوداء */}
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-block",
                        width: isMobile ? "60px" : "80px",
                        height: isMobile ? "60px" : "80px",
                      }}
                    >
                      <img
                        src="/logo.png"
                        alt="Rased Logo"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          // طبقة سوداء فوق الصورة
                          filter: "brightness(0) saturate(100%) invert(0%)",
                          // أو يمكنك استخدام:
                          // filter: "brightness(0.1) contrast(2)",
                        }}
                      />

                      {/* طبقة إضافية للتأكد من اللون الأسود */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          background: "rgba(0, 0, 0, 0.1)", // طبقة خفيفة إضافية
                          mixBlendMode: "multiply", // دمج الألوان
                          pointerEvents: "none",
                        }}
                      />
                    </Box>
                  </Box>

                  {/* اسم المنصة */}
                  <Typography
                    variant={isMobile ? "h4" : "h3"}
                    sx={{
                      color: "#00ff88",
                      fontWeight: "bold",
                      textShadow: "0 0 20px rgba(0, 255, 136, 0.5)",
                      mb: 1,
                    }}
                  >
                    راصد
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: isMobile ? "0.9rem" : "1rem",
                    }}
                  >
                    منصة التحليل المتقدمة للاتصالات
                  </Typography>
                </Box>
              </Slide>

              {/* نموذج تسجيل الدخول */}
              <Slide direction="up" in={animateElements} timeout={800}>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  {/* التنبيهات */}
                  {error && (
                    <Alert
                      severity={error.includes("تنبيه") ? "warning" : "error"}
                      sx={{ mb: 2 }}
                      onClose={() => setError("")}
                    >
                      {error}
                    </Alert>
                  )}
                  {loginAttempts > 0 && remainingAttempts > 0 && (
                    <Alert
                      severity={remainingAttempts <= 2 ? "error" : "warning"}
                      sx={{ mb: 2 }}
                    >
                      {`تبقى ${remainingAttempts} محاولة.`}
                    </Alert>
                  )}
                  {remainingAttempts === 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      تم استنفاد جميع المحاولات.
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="اسم المستخدم"
                    value={formData.username}
                    onChange={(e) => updateFormData("username", e.target.value)}
                    required
                    disabled={loading || remainingAttempts === 0}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <UserIcon sx={{ color: "rgba(0, 255, 136, 0.7)" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="كلمة المرور"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    required
                    disabled={loading || remainingAttempts === 0}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: "rgba(0, 255, 136, 0.7)" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* زر تسجيل الدخول الدائري */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mt: 2,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ position: "relative", width: 90, height: 90 }}>
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
                            ? "spin 1.5s linear infinite"
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
                              width: 70,
                              height: 70,
                              borderRadius: "50%",
                              background: "transparent",
                              border: "none",
                              minWidth: "auto",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                background: "rgba(0, 255, 136, 0.1)",
                              },
                              "&:disabled": {
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "rgba(255, 255, 255, 0.5)",
                              },
                            }}
                          >
                            {loading ? (
                              <CircularProgress
                                size={32}
                                sx={{ color: "#00ff88" }}
                              />
                            ) : (
                              <Fingerprint
                                sx={{ fontSize: 40, color: "#00ff88" }}
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
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    color: "rgba(255, 255, 255, 0.5)",
                    mt: 2,
                  }}
                >
                  نظام آمن • اتصال مشفر • الإصدار 2.0
                </Typography>
              </Fade>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

// يمكنك دمج هذا الكائن في `theme.components.MuiTextField` في ملف الثيم الرئيسي لتطبيق الأنماط بشكل عام
const MuiTextFieldStyles = {
  styleOverrides: {
    root: {
      "& .MuiOutlinedInput-root": {
        background: "rgba(0, 0, 0, 0.2)",
        "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
        "&:hover fieldset": { borderColor: "rgba(0, 255, 136, 0.7)" },
        "&.Mui-focused fieldset": {
          borderColor: "#00ff88",
          borderWidth: "1px",
        },
      },
      "& .MuiInputLabel-root": {
        color: "rgba(255, 255, 255, 0.7)",
        "&.Mui-focused": { color: "#00ff88" },
      },
      "& .MuiInputBase-input": { color: "#fff" },
      "& .MuiIconButton-root": { color: "rgba(255, 255, 255, 0.7)" },
    },
  },
};

export default Login;