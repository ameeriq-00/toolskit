import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { APP_CONFIG } from "../../utils/constants";

const TopBar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsCount] = useState(3); // Mock notifications

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleMenuClose();
  };

  const handleSettings = () => {
    navigate("/settings");
    handleMenuClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: `calc(100% - ${APP_CONFIG.DRAWER_WIDTH}px)`,
        ml: `${APP_CONFIG.DRAWER_WIDTH}px`,
        background: "linear-gradient(90deg, #0f0f0f 0%, #1a1a1a 100%)",
        borderBottom: "2px solid #00ff88",
        boxShadow: "0 2px 20px rgba(0, 255, 136, 0.3)",
      }}
    >
      <Toolbar>
        {/* Current Page Title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          منصة التحليل المتقدمة
        </Typography>

        {/* System Status */}
        <Chip
          label="النظام متصل"
          color="success"
          size="small"
          sx={{ mr: 2, fontSize: "0.7rem" }}
        />

        {/* Dark Mode Indicator */}
        <Tooltip title="الوضع المظلم">
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <DarkModeIcon />
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="الإشعارات">
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={notificationsCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="body2"
            sx={{ mr: 1, display: { xs: "none", sm: "block" } }}
          >
            {user?.username || "المستخدم"}
          </Typography>
          <Tooltip title="حساب المستخدم">
            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              sx={{
                p: 0.5,
                border: "2px solid transparent",
                borderRadius: "50%",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 12px rgba(0, 255, 136, 0.5)",
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              background: "#1a1a1a",
              border: "1px solid #333",
              boxShadow: "0 8px 32px rgba(0, 255, 136, 0.2)",
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {/* User Info */}
          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #333" }}>
            <Typography variant="subtitle2" color="primary">
              {user?.username || "المستخدم"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || "user@example.com"}
            </Typography>
            <br />
            <Chip
              label={user?.is_staff ? "مدير النظام" : "مستخدم"}
              size="small"
              color={user?.is_staff ? "error" : "default"}
              sx={{ mt: 0.5 }}
            />
          </Box>

          {/* Menu Items */}
          <MenuItem onClick={handleSettings}>
            <SettingsIcon sx={{ mr: 1 }} />
            الإعدادات
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            تسجيل الخروج
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;