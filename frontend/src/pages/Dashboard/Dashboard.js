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
      background: "linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)",
      border: "1px solid rgba(0, 255, 136, 0.1)",
      "&:hover": onClick
        ? {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px rgba(0, 255, 136, 0.3)",
            borderColor: "primary.main",
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
            boxShadow: `0 4px 12px ${
              color === "primary"
                ? "rgba(0, 255, 136, 0.3)"
                : "rgba(255, 255, 255, 0.1)"
            }`,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
      </Box>

      <Typography
        variant="h4"
        sx={{ mb: 1, fontWeight: "bold", color: "primary.main" }}
      >
        {value?.toLocaleString() || "0"}
      </Typography>

      {trend && (
        <Chip
          size="small"
          label={trend}
          color="success"
          icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
          sx={{ fontSize: "0.7rem" }}
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
      background: "linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)",
      border: "1px solid rgba(0, 255, 136, 0.1)",
      "&:hover": {
        transform: "translateY(-4px)",
        borderColor: `${color}.main`,
        boxShadow: `0 8px 25px rgba(0, 255, 136, 0.2)`,
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
          boxShadow: `0 4px 16px rgba(0, 255, 136, 0.3)`,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
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
        <LinearProgress
          sx={{
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)",
            },
          }}
        />
        <Typography
          variant="body2"
          sx={{ mt: 1, textAlign: "center", color: "primary.main" }}
        >
          جاري تحميل البيانات...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(45deg, #00ff88 0%, #00cc6a 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          لوحة التحكم الرئيسية - راصد
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.1rem" }}
        >
          مرحباً بك في منصة راصد للتحليل المتقدم للاتصالات
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            background: "rgba(255, 23, 68, 0.1)",
            border: "1px solid rgba(255, 23, 68, 0.3)",
            "& .MuiAlert-icon": {
              color: "#ff1744",
            },
          }}
        >
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
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 600, color: "primary.main" }}
        >
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
      <Card
        sx={{
          mb: 3,
          background: "linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)",
          border: "1px solid rgba(0, 255, 136, 0.2)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600, color: "primary.main" }}
          >
            حالة النظام - راصد
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label="الخادم متصل"
              color="success"
              sx={{ fontWeight: "bold" }}
            />
            <Chip
              label="قاعدة البيانات متصلة"
              color="success"
              sx={{ fontWeight: "bold" }}
            />
            <Chip
              label="API متاح"
              color="success"
              sx={{ fontWeight: "bold" }}
            />
            <Chip
              label="آخر تحديث: منذ 5 دقائق"
              color="info"
              variant="outlined"
              sx={{ fontWeight: "bold" }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;