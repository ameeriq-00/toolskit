import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Collapse,
  Chip,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard,
  Analytics,
  CellTower,
  Upload,
  Search,
  Compare,
  Timeline,
  Settings,
  AdminPanelSettings,
  Security,
  People,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { APP_CONFIG } from "../../utils/constants";

const iconMap = {
  Dashboard,
  Analytics,
  CellTower,
  Upload,
  Search,
  Compare,
  Timeline,
  Settings,
  AdminPanelSettings,
  Security,
  People,
};

const menuItems = [
  { id: "dashboard", title: "لوحة التحكم", icon: "Dashboard", path: "/" },
  {
    id: "analysis",
    title: "أدوات التحليل",
    icon: "Analytics",
    children: [
      {
        id: "excel-analyzer",
        title: "محلل Excel",
        icon: "Upload",
        path: "/excel-analyzer",
      },
      {
        id: "excel-analyzer-z",
        title: "محلل Excel Z",
        icon: "Timeline",
        path: "/excel-analyzer-z",
      },
      {
        id: "sheets-comparison",
        title: "مقارنة الشيتات",
        icon: "Compare",
        path: "/sheets-comparison",
        badge: "NEW",
      },
    ],
  },
  {
    id: "towers",
    title: "إدارة الأبراج",
    icon: "CellTower",
    children: [
      {
        id: "tower-search",
        title: "بحث الأبراج",
        icon: "Search",
        path: "/site-search",
      },
      {
        id: "tower-management",
        title: "إدارة البيانات",
        icon: "AdminPanelSettings",
        path: "/site-management",
        permissions: ["upload_sites"],
        badge: "ADMIN",
      },
    ],
  },
  {
    id: "administration",
    title: "الإدارة",
    icon: "AdminPanelSettings",
    permissions: ["view_users", "view_activities"],
    children: [
      {
        id: "user-management",
        title: "إدارة المستخدمين",
        icon: "People",
        path: "/user-management",
        permissions: ["view_users"],
      },
      {
        id: "system-activities",
        title: "سجل النشاطات",
        icon: "Timeline",
        path: "/system-activities",
        permissions: ["view_activities"],
      },
      {
        id: "security-alerts",
        title: "التنبيهات الأمنية",
        icon: "Security",
        path: "/security-alerts",
        permissions: ["view_security_alerts"],
      },
    ],
  },
  {
    id: "personal",
    title: "شخصي",
    icon: "Security",
    children: [
      {
        id: "my-security",
        title: "الأمان الشخصي",
        icon: "Security",
        path: "/my-security",
      },
      {
        id: "settings",
        title: "الإعدادات",
        icon: "Settings",
        path: "/settings",
      },
    ],
  },
];

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasAnyPermission, getFullName, getRoleName } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [expandedItems, setExpandedItems] = useState([
    "analysis",
    "towers",
    "personal",
  ]);

  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const shouldShowItem = (item) => {
    if (!item.permissions) return true;
    return hasAnyPermission(...item.permissions);
  };

  const isItemActive = (path) => location.pathname === path;

  // توسيع العنصر النشط تلقائياً
  useEffect(() => {
    const activeParent = menuItems.find((item) =>
      item.children?.some((child) => child.path === location.pathname)
    );

    if (activeParent && !expandedItems.includes(activeParent.id)) {
      setExpandedItems((prev) => [...prev, activeParent.id]);
    }
  }, [location.pathname]);

  const renderMenuItem = (item, isChild = false) => {
    const IconComponent = iconMap[item.icon];
    const isActive = isItemActive(item.path);
    const hasChildren = item.children?.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    if (!shouldShowItem(item)) return null;

    return (
      <React.Fragment key={item.id}>
        <ListItem
          button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              handleNavigation(item.path);
            }
          }}
          sx={{
            mx: 1,
            borderRadius: 2,
            mb: 0.5,
            pl: isChild ? 4 : 2,
            backgroundColor: isActive
              ? "rgba(0, 255, 136, 0.1)"
              : "transparent",
            borderLeft: isActive ? "3px solid #00ff88" : "none",
            "&:hover": { backgroundColor: "rgba(0, 255, 136, 0.05)" },
          }}
        >
          <ListItemIcon
            sx={{
              color: isActive ? "#00ff88" : "rgba(255, 255, 255, 0.7)",
              minWidth: 40,
            }}
          >
            <IconComponent />
          </ListItemIcon>

          <ListItemText
            primary={item.title}
            sx={{
              "& .MuiListItemText-primary": {
                color: isActive ? "#00ff88" : "white",
                fontWeight: isActive ? 600 : 400,
                fontSize: isChild ? "0.875rem" : "1rem",
              },
            }}
          />

          {item.badge && (
            <Chip
              label={item.badge}
              size="small"
              color={item.badge === "NEW" ? "success" : "secondary"}
              sx={{ height: 20, fontSize: "0.6rem" }}
            />
          )}

          {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children
                .filter(shouldShowItem)
                .map((child) => renderMenuItem(child, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <>
      {/* الرأس */}
      <Box
        sx={{
          p: 2,
          background: "linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)",
          color: "#000",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {APP_CONFIG.APP_NAME}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          نظام التحليل المتقدم
        </Typography>
      </Box>

      {/* معلومات المستخدم */}
      <Box sx={{ p: 2, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              backgroundColor: "#00ff88",
              color: "#000",
              fontWeight: "bold",
              width: 40,
              height: 40,
            }}
          >
            {getFullName().charAt(0) || "U"}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "white", fontWeight: 600 }}
              noWrap
            >
              {getFullName() || user?.username}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              noWrap
            >
              {getRoleName()}
            </Typography>
          </Box>
        </Box>

        {/* حالة المستخدم */}
        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {user?.is_superuser && (
            <Chip
              label="مدير عام"
              size="small"
              color="error"
              sx={{ fontSize: "0.65rem", height: 18 }}
            />
          )}
          {user?.profile?.must_change_password && (
            <Chip
              label="تغيير كلمة مرور"
              size="small"
              color="warning"
              sx={{ fontSize: "0.65rem", height: 18 }}
            />
          )}
        </Box>
      </Box>

      {/* القائمة */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        <List component="nav">
          {menuItems.filter(shouldShowItem).map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* التذييل */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "rgba(255, 255, 255, 0.5)" }}
        >
          {APP_CONFIG.APP_NAME} v{APP_CONFIG.VERSION}
        </Typography>
        <br />
        <Typography
          variant="caption"
          sx={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.65rem" }}
        >
          {APP_CONFIG.COPYRIGHT}
        </Typography>
      </Box>
    </>
  );

  if (isMobile && onClose) {
    return drawerContent;
  }

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: APP_CONFIG.DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: APP_CONFIG.DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;