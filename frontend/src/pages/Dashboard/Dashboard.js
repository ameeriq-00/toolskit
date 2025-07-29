import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  CellTower as TowerIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/api";

const Dashboard = () => {
  const {
    user,
    getFullName,
    getRoleName,
    needsPasswordChange,
    getLastLoginInfo,
    canViewSecurity,
    canManageUsers,
    refreshSecurityInfo,
  } = useAuth();

  const [stats, setStats] = useState({
    users: { total: 0, active: 0, locked: 0 },
    activities: { today: 0, week: 0, failed_logins_today: 0 },
    security: { unresolved_alerts: 0, critical_alerts: 0, active_sessions: 0 },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(loadDashboardData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load statistics (available to all users)
      const statsResponse = await apiService.getDashboardStatistics();
      setStats(statsResponse.data);

      // Load user's own activities
      const activitiesResponse = await apiService.getMyActivities(10);
      setRecentActivities(activitiesResponse.data.activities || []);

      // Load security alerts if user has permission
      if (canViewSecurity()) {
        try {
          const alertsResponse = await apiService.getSecurityAlerts({
            is_resolved: "false",
            per_page: 5,
          });
          setSecurityAlerts(alertsResponse.data.alerts || []);
        } catch (alertError) {
          console.warn("Failed to load security alerts:", alertError);
        }
      }

      setLastRefresh(new Date());
      setError("");
    } catch (error) {
      setError(apiService.formatError(error));
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
    refreshSecurityInfo();
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 18) return "مساء الخير";
    return "مساء الخير";
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case "تسجيل دخول":
        return <LoginIcon color="success" />;
      case "تسجيل خروج":
        return <LogoutIcon color="primary" />;
      case "محاولة دخول فاشلة":
        return <ErrorIcon color="error" />;
      case "قفل حساب":
        return <BlockIcon color="warning" />;
      default:
        return <TimelineIcon color="primary" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "حرج":
        return "error";
      case "عالي":
        return "error";
      case "متوسط":
        return "warning";
      case "منخفض":
        return "info";
      default:
        return "default";
    }
  };

  if (loading && !stats.users.total) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
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
            {getWelcomeMessage()}، {getFullName()}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {getRoleName()} - آخر تحديث:{" "}
            {lastRefresh.toLocaleTimeString("ar-SA")}
          </Typography>
        </Box>
        <Tooltip title="تحديث البيانات">
          <IconButton onClick={handleRefresh} disabled={loading}>
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

      {needsPasswordChange() && (
        <Alert severity="warning" sx={{ marginBottom: 2 }}>
          يجب تغيير كلمة المرور الخاصة بك لأسباب أمنية.
          <Button color="inherit" size="small" sx={{ marginLeft: 2 }}>
            تغيير الآن
          </Button>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ marginBottom: 3 }}>
        {/* Users Statistics */}
        {canManageUsers() && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="h4" color="primary">
                        {stats.users.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        إجمالي المستخدمين
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: "primary.main" }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {stats.users.active}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        مستخدمين نشطين
                      </Typography>
                    </Box>
                    <CheckIcon sx={{ fontSize: 40, color: "success.main" }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {stats.users.locked}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        حسابات مقفلة
                      </Typography>
                    </Box>
                    <BlockIcon sx={{ fontSize: 40, color: "warning.main" }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Security Statistics */}
        {canViewSecurity() && (
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {stats.security.critical_alerts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      تنبيهات حرجة
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 40, color: "error.main" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Activity Statistics */}
        <Grid item xs={12} sm={6} md={canManageUsers() ? 3 : 4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" color="info.main">
                    {stats.activities.today}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    نشاطات اليوم
                  </Typography>
                </Box>
                <TimelineIcon sx={{ fontSize: 40, color: "info.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={canManageUsers() ? 3 : 4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" color="secondary.main">
                    {stats.activities.week}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    نشاطات الأسبوع
                  </Typography>
                </Box>
                <AnalyticsIcon sx={{ fontSize: 40, color: "secondary.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {stats.activities.failed_logins_today > 0 && (
          <Grid item xs={12} sm={6} md={canManageUsers() ? 3 : 4}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {stats.activities.failed_logins_today}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      محاولات دخول فاشلة اليوم
                    </Typography>
                  </Box>
                  <ErrorIcon sx={{ fontSize: 40, color: "error.main" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={canViewSecurity() ? 6 : 8}>
          <Paper sx={{ padding: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              النشاطات الأخيرة
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            {recentActivities.length === 0 ? (
              <Box sx={{ textAlign: "center", padding: 4 }}>
                <Typography color="text.secondary">
                  لا توجد نشاطات حديثة
                </Typography>
              </Box>
            ) : (
              <List sx={{ height: 300, overflow: "auto" }}>
                {recentActivities.map((activity, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {getActivityIcon(activity.action)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.description}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {new Date(activity.timestamp).toLocaleString(
                              "ar-SA"
                            )}
                          </Typography>
                          {activity.ip_address && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              IP: {activity.ip_address}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    {!activity.success && (
                      <Chip label="فشل" color="error" size="small" />
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Security Alerts */}
        {canViewSecurity() && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ padding: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                التنبيهات الأمنية
              </Typography>
              <Divider sx={{ marginBottom: 2 }} />

              {securityAlerts.length === 0 ? (
                <Box sx={{ textAlign: "center", padding: 4 }}>
                  <CheckIcon
                    sx={{
                      fontSize: 48,
                      color: "success.main",
                      marginBottom: 2,
                    }}
                  />
                  <Typography color="success.main">
                    لا توجد تنبيهات أمنية
                  </Typography>
                </Box>
              ) : (
                <List sx={{ height: 300, overflow: "auto" }}>
                  {securityAlerts.map((alert, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <WarningIcon color={getSeverityColor(alert.severity)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.title}
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ marginBottom: 0.5 }}
                            >
                              {alert.description}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <Chip
                                label={alert.severity}
                                color={getSeverityColor(alert.severity)}
                                size="small"
                              />
                              <Typography variant="caption">
                                {new Date(alert.created_at).toLocaleString(
                                  "ar-SA"
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={canViewSecurity() ? 12 : 4}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              إجراءات سريعة
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  href="/excel-analyzer"
                >
                  تحليل Excel
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TowerIcon />}
                  href="/site-search"
                >
                  بحث الأبراج
                </Button>
              </Grid>

              {canManageUsers() && (
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AdminIcon />}
                    href="/user-management"
                  >
                    إدارة المستخدمين
                  </Button>
                </Grid>
              )}

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  href="/my-security"
                >
                  الأمان الشخصي
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ position: "fixed", bottom: 20, right: 20 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;