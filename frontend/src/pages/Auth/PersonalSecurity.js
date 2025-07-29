import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Key as KeyIcon,
  Devices as DevicesIcon,
  Timeline as ActivityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  Tablet as TabletIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/api";

const PersonalSecurity = () => {
  const { user, getLastLoginInfo, changePassword, reportSuspiciousActivity } =
    useAuth();
  const [securityData, setSecurityData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog states
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Report form
  const [reportForm, setReportForm] = useState({
    description: "",
    activity_type: "suspicious_activity",
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load security dashboard
      const securityResponse = await apiService.getSecurityDashboard();
      setSecurityData(securityResponse.data);

      // Load recent activities
      const activitiesResponse = await apiService.getMyActivities(20);
      setActivities(activitiesResponse.data.activities || []);

      // Load active sessions
      const sessionsResponse = await apiService.getMySessions();
      setSessions(sessionsResponse.data.sessions || []);
    } catch (error) {
      setError(apiService.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (field) => (event) => {
    const value = event.target.value;
    setPasswordForm((prev) => ({ ...prev, [field]: value }));

    // Check password strength for new password
    if (field === "new_password" && value) {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = async (password) => {
    try {
      const response = await apiService.validatePasswordStrength(password);
      setPasswordStrength(response.data);
    } catch (error) {
      console.warn("Password strength check failed:", error);
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("كلمات المرور الجديدة غير متطابقة");
      return;
    }

    if (passwordStrength && !passwordStrength.is_strong) {
      setError("كلمة المرور الجديدة ضعيفة");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setSuccess("تم تغيير كلمة المرور بنجاح");
      setPasswordDialog(false);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordStrength(null);
    } catch (error) {
      setError(apiService.formatError(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportForm.description.trim()) {
      setError("يرجى وصف النشاط المشبوه");
      return;
    }

    try {
      setSubmittingReport(true);
      const result = await reportSuspiciousActivity(
        reportForm.description,
        reportForm.activity_type
      );

      if (result.success) {
        setSuccess("تم إرسال التقرير بنجاح وسيتم مراجعته");
        setReportDialog(false);
        setReportForm({
          description: "",
          activity_type: "suspicious_activity",
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("فشل في إرسال التقرير");
    } finally {
      setSubmittingReport(false);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await apiService.terminateSession(sessionId);
      setSuccess("تم إنهاء الجلسة بنجاح");
      loadSecurityData();
    } catch (error) {
      setError(apiService.formatError(error));
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <PhoneIcon />;
      case "tablet":
        return <TabletIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case "تسجيل دخول":
        return <CheckIcon color="success" />;
      case "تسجيل خروج":
        return <ActivityIcon color="primary" />;
      case "محاولة دخول فاشلة":
        return <WarningIcon color="error" />;
      default:
        return <ActivityIcon color="primary" />;
    }
  };

  const lastLogin = getLastLoginInfo();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Box
        sx={{
          marginBottom: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            الأمان الشخصي
          </Typography>
          <Typography variant="body2" color="text.secondary">
            إدارة أمان حسابك الشخصي والأنشطة
          </Typography>
        </Box>
        <Tooltip title="تحديث البيانات">
          <IconButton onClick={loadSecurityData}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ marginBottom: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ marginBottom: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Security Overview */}
      <Grid container spacing={3} sx={{ marginBottom: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">حالة الأمان</Typography>
                  <Chip
                    label={
                      securityData?.account_status?.is_locked ? "مقفل" : "آمن"
                    }
                    color={
                      securityData?.account_status?.is_locked
                        ? "error"
                        : "success"
                    }
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <DevicesIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">الجلسات النشطة</Typography>
                  <Typography variant="h4" color="secondary.main">
                    {securityData?.security_stats?.active_sessions || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">محاولات فاشلة اليوم</Typography>
                  <Typography variant="h4" color="warning.main">
                    {securityData?.security_stats?.failed_logins_today || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Account Security */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              أمان الحساب
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="آخر تسجيل دخول"
                  secondary={
                    lastLogin.date
                      ? `${new Date(lastLogin.date).toLocaleString(
                          "ar-SA"
                        )} من ${lastLogin.ip || "غير محدد"}`
                      : "لا يوجد"
                  }
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="آخر تغيير لكلمة المرور"
                  secondary={
                    user?.profile?.password_changed_at
                      ? new Date(
                          user.profile.password_changed_at
                        ).toLocaleString("ar-SA")
                      : "غير محدد"
                  }
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="انتهاء صلاحية الحساب"
                  secondary={
                    user?.profile?.account_expires_at
                      ? new Date(
                          user.profile.account_expires_at
                        ).toLocaleString("ar-SA")
                      : "غير محدود"
                  }
                />
              </ListItem>
            </List>

            <Box sx={{ marginTop: 2, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<KeyIcon />}
                onClick={() => setPasswordDialog(true)}
              >
                تغيير كلمة المرور
              </Button>

              <Button
                variant="outlined"
                startIcon={<ReportIcon />}
                onClick={() => setReportDialog(true)}
              >
                إبلاغ عن نشاط مشبوه
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Active Sessions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              الجلسات النشطة
            </Typography>

            {sessions.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", padding: 2 }}
              >
                لا توجد جلسات نشطة
              </Typography>
            ) : (
              <List>
                {sessions.map((session, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {getDeviceIcon(session.device_info?.device)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body1">
                            {session.device_info?.browser || "متصفح غير محدد"}
                          </Typography>
                          <Chip
                            label={session.device_info?.os || "نظام غير محدد"}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            IP: {session.ip_address}
                          </Typography>
                          <Typography variant="caption" display="block">
                            آخر نشاط:{" "}
                            {new Date(session.last_activity).toLocaleString(
                              "ar-SA"
                            )}
                          </Typography>
                          <Typography variant="caption">
                            الطلبات: {session.requests_count}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => terminateSession(session.id)}
                      title="إنهاء الجلسة"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              النشاطات الأخيرة
            </Typography>

            {activities.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", padding: 2 }}
              >
                لا توجد نشاطات حديثة
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>النشاط</TableCell>
                      <TableCell>الوصف</TableCell>
                      <TableCell>التوقيت</TableCell>
                      <TableCell>عنوان IP</TableCell>
                      <TableCell>الحالة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activities.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {getActivityIcon(activity.action)}
                            {activity.action}
                          </Box>
                        </TableCell>
                        <TableCell>{activity.description}</TableCell>
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleString("ar-SA")}
                        </TableCell>
                        <TableCell>{activity.ip_address}</TableCell>
                        <TableCell>
                          <Chip
                            label={activity.success ? "نجح" : "فشل"}
                            color={activity.success ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>تغيير كلمة المرور</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ marginTop: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="كلمة المرور الحالية"
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.current_password}
                onChange={handlePasswordChange("current_password")}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    >
                      {showPasswords.current ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="كلمة المرور الجديدة"
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.new_password}
                onChange={handlePasswordChange("new_password")}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                    >
                      {showPasswords.new ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  ),
                }}
              />
              {passwordStrength && (
                <Box sx={{ marginTop: 1 }}>
                  <Typography variant="caption" display="block">
                    قوة كلمة المرور: {passwordStrength.message}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.is_strong ? 100 : 50}
                    color={passwordStrength.is_strong ? "success" : "warning"}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="تأكيد كلمة المرور الجديدة"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange("confirm_password")}
                error={
                  passwordForm.confirm_password &&
                  passwordForm.new_password !== passwordForm.confirm_password
                }
                helperText={
                  passwordForm.confirm_password &&
                  passwordForm.new_password !== passwordForm.confirm_password
                    ? "كلمات المرور غير متطابقة"
                    : ""
                }
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    >
                      {showPasswords.confirm ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>إلغاء</Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            disabled={changingPassword}
            startIcon={changingPassword ? <CircularProgress size={20} /> : null}
          >
            تغيير كلمة المرور
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>إبلاغ عن نشاط مشبوه</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ marginTop: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="وصف النشاط المشبوه"
                multiline
                rows={4}
                value={reportForm.description}
                onChange={(e) =>
                  setReportForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="يرجى وصف النشاط المشبوه بالتفصيل..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleReportSubmit}
            variant="contained"
            disabled={submittingReport}
            startIcon={
              submittingReport ? <CircularProgress size={20} /> : <ReportIcon />
            }
          >
            إرسال التقرير
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonalSecurity;