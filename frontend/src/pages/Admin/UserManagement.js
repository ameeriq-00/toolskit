import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Key as KeyIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/api";

const UserManagement = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Dialog state
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
  });
  const [userDialog, setUserDialog] = useState({
    open: false,
    mode: "create", // create, edit, view
    user: null,
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    locked: 0,
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadStatistics();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role_id: roleFilter }),
        ...(statusFilter !== "" && { is_active: statusFilter === "true" }),
      };

      const response = await apiService.getUsers(params);
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (error) {
      setError(apiService.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiService.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error("Failed to load roles:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiService.getDashboardStatistics();
      setStats(response.data.users);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionClick = (event, user) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleUserAction = (action) => {
    handleActionClose();

    switch (action) {
      case "view":
        setUserDialog({ open: true, mode: "view", user: selectedUser });
        break;
      case "edit":
        setUserDialog({ open: true, mode: "edit", user: selectedUser });
        break;
      case "activate":
        handleConfirmAction(
          "تفعيل المستخدم",
          `هل أنت متأكد من تفعيل المستخدم "${selectedUser.username}"؟`,
          () => activateUser(selectedUser.id)
        );
        break;
      case "deactivate":
        handleConfirmAction(
          "إلغاء تفعيل المستخدم",
          `هل أنت متأكد من إلغاء تفعيل المستخدم "${selectedUser.username}"؟`,
          () => deactivateUser(selectedUser.id)
        );
        break;
      case "delete":
        handleConfirmAction(
          "حذف المستخدم",
          `هل أنت متأكد من حذف المستخدم "${selectedUser.username}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
          () => deleteUser(selectedUser.id)
        );
        break;
      case "changePassword":
        // Open password change dialog
        break;
    }
  };

  const handleConfirmAction = (title, message, action) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      action,
    });
  };

  const executeConfirmAction = async () => {
    try {
      if (confirmDialog.action) {
        await confirmDialog.action();
        setSuccess("تم تنفيذ العملية بنجاح");
        loadUsers();
        loadStatistics();
      }
    } catch (error) {
      setError(apiService.formatError(error));
    }
    setConfirmDialog({ open: false, title: "", message: "", action: null });
  };

  const activateUser = async (userId) => {
    await apiService.activateUser(userId);
  };

  const deactivateUser = async (userId) => {
    await apiService.deactivateUser(userId, "تم إلغاء التفعيل من لوحة الإدارة");
  };

  const deleteUser = async (userId) => {
    await apiService.deleteUser(userId);
  };

  const getStatusChip = (user) => {
    if (!user.is_active) {
      return <Chip label="غير مفعل" color="error" size="small" />;
    }
    if (user.is_account_locked) {
      return <Chip label="مقفل" color="warning" size="small" />;
    }
    return <Chip label="نشط" color="success" size="small" />;
  };

  const getRoleChip = (role) => {
    const colors = {
      "مدير عام": "error",
      محلل: "primary",
      مشغل: "secondary",
      "رافع البيانات": "info",
      مشاهد: "default",
    };
    return (
      <Chip
        label={role}
        color={colors[role] || "default"}
        size="small"
        variant="outlined"
      />
    );
  };

  if (!hasPermission("view_users")) {
    return (
      <Box sx={{ padding: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          ليس لديك صلاحية لعرض هذه الصفحة
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" gutterBottom>
          إدارة المستخدمين
        </Typography>
        <Typography variant="body2" color="text.secondary">
          إدارة حسابات المستخدمين والصلاحيات
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ marginBottom: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي المستخدمين
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <ActivateIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.active}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    المستخدمين النشطين
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <BlockIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.locked}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    الحسابات المقفلة
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

      {/* Filters and Actions */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="البحث في المستخدمين..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Role Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>فلترة حسب الدور</InputLabel>
              <Select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                label="فلترة حسب الدور"
              >
                <MenuItem value="">جميع الأدوار</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.display_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>فلترة حسب الحالة</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="فلترة حسب الحالة"
              >
                <MenuItem value="">جميع الحالات</MenuItem>
                <MenuItem value="true">نشط</MenuItem>
                <MenuItem value="false">غير نشط</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Add User Button */}
          <Grid item xs={12} md={2}>
            {hasPermission("create_users") && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() =>
                  setUserDialog({ open: true, mode: "create", user: null })
                }
              >
                إضافة مستخدم
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>اسم المستخدم</TableCell>
                <TableCell>الاسم الكامل</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>الدور</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>آخر دخول</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    لا توجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {user.username}
                        {user.username === "admin" && (
                          <AdminIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{user.full_name || "-"}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>{getRoleChip(user.role)}</TableCell>
                    <TableCell>{getStatusChip(user)}</TableCell>
                    <TableCell>
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString("ar-SA")
                        : "لم يسجل دخول"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleActionClick(e, user)}
                        size="small"
                      >
                        <MoreIcon />
                      </IconButton>
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
          count={totalUsers}
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

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => handleUserAction("view")}>
          <ViewIcon fontSize="small" sx={{ marginRight: 1 }} />
          عرض التفاصيل
        </MenuItem>

        {hasPermission("edit_users") && (
          <MenuItem onClick={() => handleUserAction("edit")}>
            <EditIcon fontSize="small" sx={{ marginRight: 1 }} />
            تعديل
          </MenuItem>
        )}

        {hasPermission("edit_users") && selectedUser && (
          <>
            {selectedUser.is_active ? (
              <MenuItem onClick={() => handleUserAction("deactivate")}>
                <BlockIcon fontSize="small" sx={{ marginRight: 1 }} />
                إلغاء التفعيل
              </MenuItem>
            ) : (
              <MenuItem onClick={() => handleUserAction("activate")}>
                <ActivateIcon fontSize="small" sx={{ marginRight: 1 }} />
                تفعيل
              </MenuItem>
            )}

            <MenuItem onClick={() => handleUserAction("changePassword")}>
              <KeyIcon fontSize="small" sx={{ marginRight: 1 }} />
              تغيير كلمة المرور
            </MenuItem>
          </>
        )}

        {hasPermission("delete_users") &&
          selectedUser?.username !== "admin" && (
            <MenuItem
              onClick={() => handleUserAction("delete")}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" sx={{ marginRight: 1 }} />
              حذف
            </MenuItem>
          )}
      </Menu>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
          >
            إلغاء
          </Button>
          <Button
            onClick={executeConfirmAction}
            color="primary"
            variant="contained"
          >
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Dialog (Create/Edit/View) */}
      {userDialog.open && (
        <UserDialog
          open={userDialog.open}
          mode={userDialog.mode}
          user={userDialog.user}
          roles={roles}
          onClose={() =>
            setUserDialog({ open: false, mode: "create", user: null })
          }
          onSuccess={() => {
            loadUsers();
            loadStatistics();
            setSuccess("تم تنفيذ العملية بنجاح");
          }}
        />
      )}
    </Box>
  );
};

// User Dialog Component
const UserDialog = ({ open, mode, user, roles, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role_id: "",
    is_active: true,
    account_expires_at: "",
    notes: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  useEffect(() => {
    if (user && (mode === "edit" || mode === "view")) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role_id: user.role_id || "",
        is_active: user.is_active || false,
        account_expires_at: user.account_expires_at || "",
        notes: user.notes || "",
      });
    } else {
      // Reset form for create mode
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role_id: "",
        is_active: true,
        account_expires_at: "",
        notes: "",
      });
    }
    setPassword("");
    setConfirmPassword("");
    setError("");
    setPasswordStrength(null);
    setUsernameAvailable(null);
  }, [user, mode, open]);

  const handleInputChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUsernameChange = async (event) => {
    const username = event.target.value;
    setFormData((prev) => ({ ...prev, username }));

    if (username.length >= 3 && mode === "create") {
      try {
        const response = await apiService.checkUsernameAvailability(username);
        setUsernameAvailable(response.available);
      } catch (error) {
        console.warn("Username check failed:", error);
      }
    }
  };

  const handlePasswordChange = async (event) => {
    const newPassword = event.target.value;
    setPassword(newPassword);

    if (newPassword.length > 0) {
      try {
        const response = await apiService.validatePasswordStrength(newPassword);
        setPasswordStrength(response.data);
      } catch (error) {
        console.warn("Password validation failed:", error);
      }
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation
      if (mode === "create" && (!password || password !== confirmPassword)) {
        throw new Error("كلمات المرور غير متطابقة");
      }

      if (
        mode === "create" &&
        passwordStrength &&
        !passwordStrength.is_strong
      ) {
        throw new Error("كلمة المرور ضعيفة");
      }

      if (mode === "create" && usernameAvailable === false) {
        throw new Error("اسم المستخدم غير متاح");
      }

      const userData = { ...formData };
      if (mode === "create") {
        userData.password = password;
      }

      if (mode === "create") {
        await apiService.createUser(userData);
      } else if (mode === "edit") {
        await apiService.updateUser(user.id, userData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      setError(apiService.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === "view";
  const dialogTitle =
    mode === "create"
      ? "إضافة مستخدم جديد"
      : mode === "edit"
      ? "تعديل المستخدم"
      : "تفاصيل المستخدم";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ marginTop: 1 }}>
            {/* Username */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="اسم المستخدم"
                value={formData.username}
                onChange={handleUsernameChange}
                disabled={isReadOnly || mode === "edit"}
                required
                error={mode === "create" && usernameAvailable === false}
                helperText={
                  mode === "create" && usernameAvailable === false
                    ? "اسم المستخدم غير متاح"
                    : mode === "create" && usernameAvailable === true
                    ? "اسم المستخدم متاح"
                    : ""
                }
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                disabled={isReadOnly}
              />
            </Grid>

            {/* First Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الاسم الأول"
                value={formData.first_name}
                onChange={handleInputChange("first_name")}
                disabled={isReadOnly}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="اسم العائلة"
                value={formData.last_name}
                onChange={handleInputChange("last_name")}
                disabled={isReadOnly}
              />
            </Grid>

            {/* Role */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>الدور</InputLabel>
                <Select
                  value={formData.role_id}
                  onChange={handleInputChange("role_id")}
                  disabled={isReadOnly}
                  label="الدور"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Account Status */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange("is_active")}
                    disabled={isReadOnly}
                  />
                }
                label="الحساب نشط"
              />
            </Grid>

            {/* Account Expiry */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="انتهاء صلاحية الحساب"
                type="datetime-local"
                value={formData.account_expires_at}
                onChange={handleInputChange("account_expires_at")}
                disabled={isReadOnly}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Password fields (only for create mode) */}
            {mode === "create" && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="كلمة المرور"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    error={passwordStrength && !passwordStrength.is_strong}
                    helperText={
                      passwordStrength && !passwordStrength.is_strong
                        ? passwordStrength.message
                        : ""
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="تأكيد كلمة المرور"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    error={confirmPassword && password !== confirmPassword}
                    helperText={
                      confirmPassword && password !== confirmPassword
                        ? "كلمات المرور غير متطابقة"
                        : ""
                    }
                  />
                </Grid>
              </>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleInputChange("notes")}
                disabled={isReadOnly}
              />
            </Grid>

            {/* User Details (for view/edit modes) */}
            {user && mode !== "create" && (
              <>
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    sx={{ marginTop: 2, marginBottom: 1 }}
                  >
                    معلومات إضافية
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="تاريخ الإنشاء"
                    value={
                      user.created_at
                        ? new Date(user.created_at).toLocaleString("ar-SA")
                        : ""
                    }
                    disabled
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="آخر دخول"
                    value={
                      user.last_login
                        ? new Date(user.last_login).toLocaleString("ar-SA")
                        : "لم يسجل دخول"
                    }
                    disabled
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {user.profile && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="آخر IP دخول"
                        value={user.profile.last_login_ip || "غير محدد"}
                        disabled
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="محاولات دخول فاشلة"
                        value={user.profile.failed_login_attempts || 0}
                        disabled
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    {user.profile.account_locked_until && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="مقفل حتى"
                          value={new Date(
                            user.profile.account_locked_until
                          ).toLocaleString("ar-SA")}
                          disabled
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="آخر تغيير لكلمة المرور"
                        value={
                          user.profile.password_changed_at
                            ? new Date(
                                user.profile.password_changed_at
                              ).toLocaleString("ar-SA")
                            : "غير محدد"
                        }
                        disabled
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.profile.must_change_password || false}
                            disabled
                          />
                        }
                        label="يجب تغيير كلمة المرور"
                      />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {mode === "view" ? "إغلاق" : "إلغاء"}
        </Button>

        {mode !== "view" && (
          <Button
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {mode === "create" ? "إنشاء" : "حفظ"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserManagement;