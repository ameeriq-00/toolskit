import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
} from "@mui/material";
import {
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  DarkMode,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { APP_CONFIG } from "../../utils/constants";
import Sidebar from "./Sidebar";

const TopBar = () => {
  const navigate = useNavigate();
  const { user, logout, getFullName, getRoleName } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsCount] = useState(3);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

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
    <>
      <AppBar
        position="fixed"
        sx={{
          width: isMobile
            ? "100%"
            : `calc(100% - ${APP_CONFIG.DRAWER_WIDTH}px)`,
          mr: isMobile ? 0 : `${APP_CONFIG.DRAWER_WIDTH}px`,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* قائمة الهاتف */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* العنوان */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            منصة راصد للتحليل المتقدم
          </Typography>

          {/* حالة النظام */}
          <Chip
            label="النظام متصل"
            color="success"
            size="small"
            sx={{ mr: 2, display: { xs: "none", sm: "flex" } }}
          />

          {/* أيقونة الوضع المظلم */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <DarkMode />
          </IconButton>

          {/* الإشعارات */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={notificationsCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* قائمة المستخدم */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {!isMobile && (
              <Typography
                variant="body2"
                sx={{ mr: 1, color: "primary.main", fontWeight: "bold" }}
              >
                {getFullName()}
              </Typography>
            )}

            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontWeight: "bold",
                }}
              >
                {getFullName().charAt(0) || "ر"}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* قائمة المستخدم */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            background: "linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: 2,
          },
        }}
      >
        {/* معلومات المستخدم */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: "1px solid rgba(0, 255, 136, 0.2)",
          }}
        >
          <Typography
            variant="subtitle2"
            color="primary"
            sx={{ fontWeight: "bold" }}
          >
            {getFullName()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || "user@rased.com"}
          </Typography>
          <br />
          <Chip
            label={getRoleName()}
            size="small"
            color={user?.is_staff ? "error" : "success"}
            sx={{ mt: 0.5, fontSize: "0.65rem" }}
          />
        </Box>

        {/* عناصر القائمة */}
        <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
          <Settings sx={{ mr: 2, color: "primary.main" }} />
          الإعدادات
        </MenuItem>

        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: "error.main" }}>
          <Logout sx={{ mr: 2 }} />
          تسجيل الخروج
        </MenuItem>
      </Menu>

      {/* درج الهاتف - محدث ليكون محاذي للتوب بار */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: APP_CONFIG.DRAWER_WIDTH,
              boxSizing: "border-box",
              backgroundColor: "#1a1a1a",
              borderRight: "2px solid #00ff88",
              boxShadow: "4px 0 20px rgba(0, 255, 136, 0.2)",
              backgroundImage:
                "linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)",
              // محاذاة للتوب بار
              marginTop: "64px", // ارتفاع التوب بار
              height: "calc(100% - 64px)", // باقي الارتفاع
              // منع السكرول الأفقي
              overflowX: "hidden",
            },
            "& .MuiBackdrop-root": {
              marginTop: "64px", // جعل الخلفية تبدأ من تحت التوب بار
            },
          }}
        >
          <Sidebar onClose={handleDrawerToggle} />
        </Drawer>
      )}
    </>
  );
};

export default TopBar;
