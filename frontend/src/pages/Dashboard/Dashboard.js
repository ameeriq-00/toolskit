import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  People,
  Security,
  Analytics,
  Warning,
  CheckCircle,
  Timeline,
  Refresh,
  Login,
  Logout,
  Block,
  AdminPanelSettings,
  CellTower,
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
    const interval = setInterval(loadDashboardData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // تحميل الإحصائيات
      const statsResponse = await apiService.getDashboardStatistics();
      setStats(statsResponse.data);

      // تحميل الأنشطة
      const activitiesResponse = await apiService.getMyActivities(10);
      setRecentActivities(activitiesResponse.data.activities || []);

      // تحميل التنبيهات الأمنية
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
    const icons = {
      "تسجيل دخول": <Login color="success" />,
      "تسجيل خروج": <Logout color="primary" />,
      "محاولة دخول فاشلة": <Warning color="error" />,
      "قفل حساب": <Block color="warning" />,
    };
    return icons[action] || <Timeline color="primary" />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      حرج: "error",
      عالي: "error",
      متوسط: "warning",
      منخفض: "info",
    };
    return colors[severity] || "default";
  };

  // بطاقات الإحصائيات
  const StatCard = ({ title, value, icon: Icon, color = "primary" }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Icon color={color} sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* الرأس */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            {getWelcomeMessage()}، {getFullName()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getRoleName()} - آخر تحديث:{" "}
            {lastRefresh.toLocaleTimeString("ar-SA")}
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* التحذيرات */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {needsPasswordChange() && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          يجب تغيير كلمة المرور الخاصة بك لأسباب أمنية.
          <Button color="inherit" size="small" sx={{ ml: 2 }}>
            تغيير الآن
          </Button>
        </Alert>
      )}

      {/* بطاقات الإحصائيات */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
        {canManageUsers() && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="إجمالي المستخدمين"
                value={stats.users.total}
                icon={People}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="مستخدمين نشطين"
                value={stats.users.active}
                icon={CheckCircle}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="حسابات مقفلة"
                value={stats.users.locked}
                icon={Block}
                color="warning"
              />
            </Grid>
          </>
        )}

        {canViewSecurity() && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="تنبيهات حرجة"
              value={stats.security.critical_alerts}
              icon={Warning}
              color="error"
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={canManageUsers() ? 3 : 4}>
          <StatCard
            title="نشاطات اليوم"
            value={stats.activities.today}
            icon={Timeline}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={canManageUsers() ? 3 : 4}>
          <StatCard
            title="نشاطات الأسبوع"
            value={stats.activities.week}
            icon={Analytics}
            color="secondary"
          />
        </Grid>

        {stats.activities.failed_logins_today > 0 && (
          <Grid item xs={12} sm={6} md={canManageUsers() ? 3 : 4}>
            <StatCard
              title="محاولات دخول فاشلة اليوم"
              value={stats.activities.failed_logins_today}
              icon={Warning}
              color="error"
            />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* النشاطات الأخيرة */}
        <Grid item xs={12} md={canViewSecurity() ? 6 : 8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                النشاطات الأخيرة
              </Typography>

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
            </CardContent>
          </Card>
        </Grid>

        {/* التنبيهات الأمنية */}
        {canViewSecurity() && (
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  التنبيهات الأمنية
                </Typography>

                {securityAlerts.length === 0 ? (
                  <Box sx={{ textAlign: "center", padding: 4 }}>
                    <CheckCircle
                      sx={{ fontSize: 48, color: "success.main", mb: 2 }}
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
                          <Warning color={getSeverityColor(alert.severity)} />
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
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
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* إجراءات سريعة */}
        <Grid item xs={12} md={canViewSecurity() ? 12 : 4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                إجراءات سريعة
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Analytics />}
                    href="/excel-analyzer"
                  >
                    تحليل Excel
                  </Button>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CellTower />}
                    href="/site-search"
                  >
                    بحث الأبراج
                  </Button>
                </Grid>

                {canManageUsers() && (
                  <Grid item xs={6} sm={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AdminPanelSettings />}
                      href="/user-management"
                    >
                      إدارة المستخدمين
                    </Button>
                  </Grid>
                )}

                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Security />}
                    href="/my-security"
                  >
                    الأمان الشخصي
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* مؤشر التحميل */}
      {loading && (
        <Box sx={{ position: "fixed", bottom: 20, right: 20 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;