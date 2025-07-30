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
  const { hasAnyPermission } = useAuth();
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
      {/* الرأس - محدث بدون معلومات المستخدم */}
      <Box
        sx={{
          p: isMobile ? 1.5 : 2,
          background: "linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)",
          color: "#000",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          minHeight: isMobile ? 56 : 64, // محاذاة مع TopBar
        }}
      >
        {/* شعار صغير */}
        <Box
          sx={{
            width: 24,
            height: 24,
            backgroundColor: "#000",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: "bold",
            color: "#00ff88",
          }}
        >
          ر
        </Box>
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{
            fontWeight: "bold",
            fontSize: isMobile ? "1.1rem" : "1.3rem",
          }}
        >
          {APP_CONFIG.APP_NAME}
        </Typography>
      </Box>

      {/* القائمة - محسنة لعدم وجود سكرول */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden", // منع السكرول الأفقي
          py: 1,
          // إخفاء شريط التمرير
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 255, 136, 0.3)",
            borderRadius: "2px",
          },
        }}
      >
        <List component="nav" sx={{ px: 0 }}>
          {menuItems.filter(shouldShowItem).map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* التذييل - محدث */}
      <Box
        sx={{
          p: isMobile ? 1.5 : 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
          minHeight: "auto", // تقليل المساحة
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: isMobile ? "0.65rem" : "0.7rem",
            display: "block",
          }}
        >
          {APP_CONFIG.APP_NAME} v{APP_CONFIG.VERSION}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.3)",
            fontSize: isMobile ? "0.6rem" : "0.65rem",
            display: "block",
            mt: 0.5,
            lineHeight: 1.2,
          }}
        >
          إعداد وبرمجة
          <br />
          الملازم المهندس أمير علي منذور
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
          backgroundColor: "#1a1a1a",
          borderRight: "2px solid #00ff88",
          boxShadow: "4px 0 20px rgba(0, 255, 136, 0.2)",
          backgroundImage: "linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)",
          // منع السكرول الأفقي
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
