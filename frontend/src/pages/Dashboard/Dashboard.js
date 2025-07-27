import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Alert,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  CellTower as TowerIcon,
  Analytics as AnalyticsIcon,
  Upload as UploadIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSiteSearch } from "../../hooks/useApi";
import { TECH_COLORS } from "../../utils/constants";

const StatCard = ({ title, value, icon, color, trend, onClick }) => (
  <Card
    sx={{
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s ease",
      "&:hover": onClick
        ? {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px rgba(0, 255, 136, 0.2)",
          }
        : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: `${color}.main`,
            color: `${color}.contrastText`,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Box>

      <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
        {value?.toLocaleString() || "0"}
      </Typography>

      {trend && (
        <Chip
          size="small"
          label={trend}
          color="success"
          icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
        />
      )}
    </CardContent>
  </Card>
);

const QuickActionCard = ({ title, description, icon, color, onClick }) => (
  <Card
    sx={{
      cursor: "pointer",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        borderColor: `${color}.main`,
      },
    }}
    onClick={onClick}
  >
    <CardContent sx={{ textAlign: "center", py: 3 }}>
      <Box
        sx={{
          display: "inline-flex",
          p: 2,
          borderRadius: "50%",
          backgroundColor: `${color}.main`,
          color: `${color}.contrastText`,
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { loading, error, getStatistics } = useSiteSearch();
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    const result = await getStatistics();
    if (result.success) {
      setStatistics(result.data);
    }
  };

  const quickActions = [
    {
      title: "تحليل ملف Excel",
      description: "تحليل بيانات المكالمات والمواقع",
      icon: <UploadIcon sx={{ fontSize: 32 }} />,
      color: "primary",
      onClick: () => navigate("/excel-analyzer"),
    },
    {
      title: "تحليل Excel Z",
      description: "تحليل الصيغة الخاصة Z",
      icon: <TimelineIcon sx={{ fontSize: 32 }} />,
      color: "secondary",
      onClick: () => navigate("/excel-analyzer-z"),
    },
    {
      title: "بحث الأبراج",
      description: "البحث في قاعدة بيانات الأبراج",
      icon: <TowerIcon sx={{ fontSize: 32 }} />,
      color: "success",
      onClick: () => navigate("/site-search"),
    },
    {
      title: "مقارنة الشيتات",
      description: "مقارنة البيانات بين عدة ملفات",
      icon: <AnalyticsIcon sx={{ fontSize: 32 }} />,
      color: "info",
      onClick: () => navigate("/sheets-comparison"),
    },
  ];

  if (loading && !statistics) {
    return (
      <Box sx={{ width: "100%", mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
          جاري تحميل البيانات...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          لوحة التحكم الرئيسية
        </Typography>
        <Typography variant="body1" color="text.secondary">
          مرحباً بك في منصة التحليل المتقدمة للاتصالات
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="أبراج 2G"
              value={statistics.statistics?.["2G"]}
              icon={<TowerIcon />}
              color="error"
              trend="+12% هذا الشهر"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="أبراج 3G"
              value={statistics.statistics?.["3G"]}
              icon={<TowerIcon />}
              color="warning"
              trend="+8% هذا الشهر"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="أبراج 4G"
              value={statistics.statistics?.["4G"]}
              icon={<TowerIcon />}
              color="success"
              trend="+15% هذا الشهر"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="إجمالي الأبراج"
              value={statistics.total_sites}
              icon={<TowerIcon />}
              color="primary"
              trend="+11% هذا الشهر"
              onClick={() => navigate("/site-search")}
            />
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          الإجراءات السريعة
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* System Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            حالة النظام
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip label="الخادم متصل" color="success" />
            <Chip label="قاعدة البيانات متصلة" color="success" />
            <Chip label="API متاح" color="success" />
            <Chip
              label="آخر تحديث: منذ 5 دقائق"
              color="info"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;