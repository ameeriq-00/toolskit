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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  CheckCircle as ResolvedIcon,
  Block as BlockIcon,
  Login as LoginIcon,
  Computer as ComputerIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/api";

const SecurityAlerts = () => {
  const { user, hasPermission } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalAlerts, setTotalAlerts] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Dialog state
  const [resolveDialog, setResolveDialog] = useState({
    open: false,
    alert: null,
    notes: "",
  });
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [page, rowsPerPage, searchTerm, severityFilter, statusFilter, typeFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(severityFilter && { severity: severityFilter }),
        ...(statusFilter !== "" && { is_resolved: statusFilter }),
        ...(typeFilter && { alert_type: typeFilter }),
      };

      const response = await apiService.getSecurityAlerts(params);
      setAlerts(response.data.alerts);
      setTotalAlerts(response.data.total);
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

  const handleResolveAlert = async () => {
    if (!resolveDialog.alert) return;

    try {
      setResolving(true);
      await apiService.resolveSecurityAlert(
        resolveDialog.alert.id,
        resolveDialog.notes
      );
      setSuccess("تم حل التنبيه بنجاح");
      setResolveDialog({ open: false, alert: null, notes: "" });
      loadAlerts();
    } catch (error) {
      setError(apiService.formatError(error));
    } finally {
      setResolving(false);
    }
  };

  const getSeverityIcon = (severity) => {
    const iconMap = {
      حرج: ErrorIcon,
      عالي: ErrorIcon,
      متوسط: WarningIcon,
      منخفض: InfoIcon,
    };
    const IconComponent = iconMap[severity] || InfoIcon;
    return <IconComponent fontSize="small" />;
  };

  const getSeverityColor = (severity) => {
    const colorMap = {
      حرج: "error",
      عالي: "error",
      متوسط: "warning",
      منخفض: "info",
    };
    return colorMap[severity] || "default";
  };

  const getAlertTypeIcon = (alertType) => {
    const iconMap = {
      "محاولة دخول فاشلة": LoginIcon,
      "قفل حساب": BlockIcon,
      "نشاط مشبوه": SecurityIcon,
      "جلسات متعددة": ComputerIcon,
      "انتهاك صلاحيات": ErrorIcon,
      "وصول للبيانات الحساسة": WarningIcon,
    };
    const IconComponent = iconMap[alertType] || SecurityIcon;
    return <IconComponent fontSize="small" />;
  };

  const getTypeColor = (alertType) => {
    const colorMap = {
      "محاولة دخول فاشلة": "warning",
      "قفل حساب": "error",
      "نشاط مشبوه": "error",
      "جلسات متعددة": "info",
      "انتهاك صلاحيات": "error",
      "وصول للبيانات الحساسة": "warning",
    };
    return colorMap[alertType] || "default";
  };

  if (!hasPermission("view_security_alerts")) {
    return (
      <Box sx={{ padding: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          ليس لديك صلاحية لعرض التنبيهات الأمنية
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
            التنبيهات الأمنية
          </Typography>
          <Typography variant="body2" color="text.secondary">
            مراقبة ومتابعة التنبيهات الأمنية في النظام
          </Typography>
        </Box>
        <Tooltip title="تحديث البيانات">
          <IconButton onClick={loadAlerts} disabled={loading}>
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
                <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{totalAlerts}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي التنبيهات
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
                    {
                      alerts.filter(
                        (a) =>
                          (a.severity === "حرج" || a.severity === "عالي") &&
                          !a.is_resolved
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تنبيهات حرجة غير محلولة
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
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {alerts.filter((a) => !a.is_resolved).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تنبيهات غير محلولة
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
                <ResolvedIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {alerts.filter((a) => a.is_resolved).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تنبيهات محلولة
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
      {success && (
        <Alert
          severity="success"
          sx={{ marginBottom: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="البحث في التنبيهات..."
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

          {/* Severity Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>مستوى الخطورة</InputLabel>
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                label="مستوى الخطورة"
              >
                <MenuItem value="">جميع المستويات</MenuItem>
                <MenuItem value="critical">حرج</MenuItem>
                <MenuItem value="high">عالي</MenuItem>
                <MenuItem value="medium">متوسط</MenuItem>
                <MenuItem value="low">منخفض</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Type Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>نوع التنبيه</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="نوع التنبيه"
              >
                <MenuItem value="">جميع الأنواع</MenuItem>
                <MenuItem value="failed_login">محاولة دخول فاشلة</MenuItem>
                <MenuItem value="account_locked">قفل حساب</MenuItem>
                <MenuItem value="suspicious_activity">نشاط مشبوه</MenuItem>
                <MenuItem value="multiple_sessions">جلسات متعددة</MenuItem>
                <MenuItem value="permission_violation">انتهاك صلاحيات</MenuItem>
                <MenuItem value="data_access">وصول للبيانات الحساسة</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="الحالة"
              >
                <MenuItem value="">جميع الحالات</MenuItem>
                <MenuItem value="false">غير محلول</MenuItem>
                <MenuItem value="true">محلول</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Alerts Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>النوع</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الوصف</TableCell>
                <TableCell>المستخدم</TableCell>
                <TableCell>عنوان IP</TableCell>
                <TableCell>الخطورة</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>التاريخ</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ textAlign: "center", padding: 4 }}>
                      <ResolvedIcon
                        sx={{
                          fontSize: 64,
                          color: "success.main",
                          marginBottom: 2,
                        }}
                      />
                      <Typography variant="h6" color="success.main">
                        لا توجد تنبيهات أمنية
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        النظام آمن ولا توجد تنبيهات تتطلب الانتباه
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getAlertTypeIcon(alert.alert_type)}
                        <Chip
                          label={alert.alert_type}
                          color={getTypeColor(alert.alert_type)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={alert.title}>
                        {alert.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        title={alert.description}
                      >
                        {alert.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{alert.user || "-"}</TableCell>
                    <TableCell>{alert.ip_address || "-"}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getSeverityIcon(alert.severity)}
                        <Chip
                          label={alert.severity}
                          color={getSeverityColor(alert.severity)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {alert.is_resolved ? (
                        <Chip
                          label="محلول"
                          color="success"
                          size="small"
                          icon={<ResolvedIcon />}
                        />
                      ) : (
                        <Chip label="غير محلول" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(alert.created_at).toLocaleString("ar-SA")}
                    </TableCell>
                    <TableCell>
                      {!alert.is_resolved && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() =>
                            setResolveDialog({
                              open: true,
                              alert: alert,
                              notes: "",
                            })
                          }
                        >
                          حل
                        </Button>
                      )}
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
          count={totalAlerts}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="عدد الصفوف في الصفحة:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
        />
      </Paper>

      {/* Resolve Alert Dialog */}
      <Dialog
        open={resolveDialog.open}
        onClose={() =>
          setResolveDialog({ open: false, alert: null, notes: "" })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          حل التنبيه الأمني
          <IconButton
            onClick={() =>
              setResolveDialog({ open: false, alert: null, notes: "" })
            }
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {resolveDialog.alert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {resolveDialog.alert.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {resolveDialog.alert.description}
              </Typography>

              <TextField
                fullWidth
                label="ملاحظات الحل"
                multiline
                rows={4}
                value={resolveDialog.notes}
                onChange={(e) =>
                  setResolveDialog((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="اكتب ملاحظات حول كيفية حل هذا التنبيه..."
                sx={{ marginTop: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setResolveDialog({ open: false, alert: null, notes: "" })
            }
            disabled={resolving}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleResolveAlert}
            variant="contained"
            color="success"
            disabled={resolving}
            startIcon={
              resolving ? <CircularProgress size={20} /> : <ResolvedIcon />
            }
          >
            {resolving ? "جاري الحل..." : "حل التنبيه"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityAlerts;
