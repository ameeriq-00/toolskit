import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
  Search as ActivitySearchIcon,
  Timeline as TimelineIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/api";

const SystemActivities = () => {
  const { hasPermission } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalActivities, setTotalActivities] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [successFilter, setSuccessFilter] = useState("");

  useEffect(() => {
    loadActivities();
  }, [page, rowsPerPage, searchTerm, actionFilter, userFilter, successFilter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(actionFilter && { action: actionFilter }),
        ...(userFilter && { user: userFilter }),
        ...(successFilter !== "" && { success: successFilter === "true" }),
      };

      const response = await apiService.getSystemActivities(params);
      setActivities(response.data.activities);
      setTotalActivities(response.data.total);
    } catch (error) {
      setError(apiService.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActivityIcon = (action) => {
    const iconMap = {
      "تسجيل دخول": LoginIcon,
      "تسجيل خروج": LogoutIcon,
      إنشاء: CreateIcon,
      تحديث: EditIcon,
      حذف: DeleteIcon,
      عرض: ViewIcon,
      رفع: UploadIcon,
      بحث: ActivitySearchIcon,
      تحليل: TimelineIcon,
    };

    const IconComponent = iconMap[action] || TimelineIcon;
    return <IconComponent fontSize="small" />;
  };

  const getActionColor = (action) => {
    const colorMap = {
      "تسجيل دخول": "success",
      "تسجيل خروج": "info",
      إنشاء: "primary",
      تحديث: "warning",
      حذف: "error",
      عرض: "default",
      رفع: "secondary",
      بحث: "info",
      تحليل: "primary",
    };

    return colorMap[action] || "default";
  };

  if (!hasPermission("view_activities")) {
    return (
      <Box sx={{ padding: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          ليس لديك صلاحية لعرض سجل النشاطات
        </Typography>
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
            سجل النشاطات
          </Typography>
          <Typography variant="body2" color="text.secondary">
            تتبع جميع النشاطات والعمليات في النظام
          </Typography>
        </Box>
        <Tooltip title="تحديث البيانات">
          <IconButton onClick={loadActivities} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ marginBottom: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TimelineIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{totalActivities}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي النشاطات
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SuccessIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {activities.filter((a) => a.success).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    نشاطات ناجحة
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {activities.filter((a) => !a.success).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    نشاطات فاشلة
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LoginIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {activities.filter((a) => a.action === "تسجيل دخول").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تسجيلات دخول
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* Filters */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="البحث في النشاطات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Action Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>فلترة حسب النشاط</InputLabel>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                label="فلترة حسب النشاط"
              >
                <MenuItem value="">جميع النشاطات</MenuItem>
                <MenuItem value="login">تسجيل دخول</MenuItem>
                <MenuItem value="logout">تسجيل خروج</MenuItem>
                <MenuItem value="create">إنشاء</MenuItem>
                <MenuItem value="update">تحديث</MenuItem>
                <MenuItem value="delete">حذف</MenuItem>
                <MenuItem value="view">عرض</MenuItem>
                <MenuItem value="upload">رفع</MenuItem>
                <MenuItem value="search">بحث</MenuItem>
                <MenuItem value="analyze">تحليل</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* User Filter */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="فلترة حسب المستخدم"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="اسم المستخدم"
            />
          </Grid>

          {/* Success Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>فلترة حسب النتيجة</InputLabel>
              <Select
                value={successFilter}
                onChange={(e) => setSuccessFilter(e.target.value)}
                label="فلترة حسب النتيجة"
              >
                <MenuItem value="">جميع النتائج</MenuItem>
                <MenuItem value="true">ناجح</MenuItem>
                <MenuItem value="false">فاشل</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Activities Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المستخدم</TableCell>
                <TableCell>النشاط</TableCell>
                <TableCell>الوصف</TableCell>
                <TableCell>النموذج</TableCell>
                <TableCell>عنوان IP</TableCell>
                <TableCell>النتيجة</TableCell>
                <TableCell>التوقيت</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    لا توجد نشاطات
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getActivityIcon(activity.action)}
                        {activity.user}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.action}
                        color={getActionColor(activity.action)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        title={activity.description}
                      >
                        {activity.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{activity.model_name || "-"}</TableCell>
                    <TableCell>{activity.ip_address}</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.success ? "نجح" : "فشل"}
                        color={activity.success ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(activity.timestamp).toLocaleString("ar-SA")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalActivities}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="عدد الصفوف في الصفحة:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default SystemActivities;