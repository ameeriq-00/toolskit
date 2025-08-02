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
  Logout,
  Settings,
  Menu as MenuIcon,
  FiberManualRecord,
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
    navigate("/my-security");
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
          height: 64,
          backgroundColor: "#1a1a1a",
          borderBottom: "1px solid rgba(0, 255, 136, 0.2)",
          boxShadow: "0 1px 8px rgba(0, 255, 136, 0.1)",
        }}
      >
        <Toolbar sx={{ minHeight: "64px !important", px: { xs: 1, sm: 2 } }}>
          {/* قائمة الهاتف */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* العنوان المحسن */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexGrow: 1,
            }}
          >
            {!isMobile && (
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  backgroundColor: "#00ff88",
                  color: "#000",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <img
                  src="/logo.png"
                  alt="راصد لوكو"
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    // إذا فشل تحميل الصورة، اعرض حرف "ر" كبديل
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = "ر";
                  }}
                />
              </Box>
            )}

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  fontWeight: 600,
                  color: "#00ff88",
                  lineHeight: 1.2,
                }}
              >
                منصة راصد للتحليل المتقدم
              </Typography>
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.7rem",
                    display: "block",
                    mt: -0.5,
                  }}
                >
                  نظام تحليل الاتصالات والأبراج
                </Typography>
              )}
            </Box>
          </Box>

          {/* حالة النظام */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={<FiberManualRecord sx={{ fontSize: "12px !important" }} />}
              label="متصل"
              color="success"
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                display: { xs: "none", sm: "flex" },
                "& .MuiChip-icon": { ml: 0.5 },
              }}
            />

            {/* الإشعارات */}
            <IconButton
              color="inherit"
              size="small"
              sx={{
                color: "rgba(255,255,255,0.8)",
                "&:hover": { color: "#00ff88" },
              }}
            >
              <Badge
                badgeContent={notificationsCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.6rem",
                    minWidth: 16,
                    height: 16,
                  },
                }}
              >
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>

            {/* قائمة المستخدم */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {!isMobile && (
                <Box sx={{ textAlign: "right", mr: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#00ff88",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {getFullName()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.65rem",
                      display: "block",
                    }}
                  >
                    {getRoleName()}
                  </Typography>
                </Box>
              )}

              <IconButton onClick={handleMenuOpen} sx={{ p: 0.25 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: "#00ff88",
                    color: "#000",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    border: "2px solid rgba(0,255,136,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getFullName().charAt(0) || "ر"}
                </Box>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* قائمة المستخدم المحسنة */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(0, 255, 136, 0.2)",
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* معلومات المستخدم */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid rgba(0, 255, 136, 0.1)",
            backgroundColor: "rgba(0,255,136,0.05)",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: "#00ff88", fontWeight: 600, fontSize: "0.85rem" }}
          >
            {getFullName()}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem" }}
          >
            {user?.email || "user@rased.com"}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={getRoleName()}
              size="small"
              color={user?.is_staff ? "error" : "success"}
              sx={{ fontSize: "0.6rem", height: 20 }}
            />
          </Box>
        </Box>

        {/* عناصر القائمة */}
        <MenuItem
          onClick={handleSettings}
          sx={{
            py: 1,
            fontSize: "0.85rem",
            "&:hover": { backgroundColor: "rgba(0,255,136,0.05)" },
          }}
        >
          <Settings sx={{ mr: 1.5, fontSize: 18, color: "#00ff88" }} />
          الأمان الشخصي
        </MenuItem>

        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1,
            color: "#f44336",
            fontSize: "0.85rem",
            "&:hover": { backgroundColor: "rgba(244,67,54,0.05)" },
          }}
        >
          <Logout sx={{ mr: 1.5, fontSize: 18 }} />
          تسجيل الخروج
        </MenuItem>
      </Menu>

      {/* درج الهاتف المحسن */}
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
              backgroundColor: "#1a1a1a",
              borderRight: "1px solid rgba(0, 255, 136, 0.2)",
              marginTop: "64px",
              height: "calc(100% - 64px)",
              overflowX: "hidden",
            },
            "& .MuiBackdrop-root": {
              marginTop: "64px",
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
