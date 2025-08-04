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
  Avatar,
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
  RadioButtonChecked,
  History,
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
  History,
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
        title: "تحليل اسيا",
        icon: "Upload",
        path: "/excel-analyzer",
      },
      {
        id: "excel-analyzer-z",
        title: "تحليل زين",
        icon: "Timeline",
        path: "/excel-analyzer-z",
      },
      {
        id: "sheets-comparison",
        title: " مقارنة I2",
        icon: "Compare",
        path: "/sheets-comparison",
        badge: "NEW",
      },
      {
        id: "my-analysis", 
        title: "تحليلاتي المحفوظة",
        icon: "History",
        path: "/my-analysis",
        badge: "محفوظة",
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

  const [expandedItems, setExpandedItems] = useState([]);

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
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              handleNavigation(item.path);
            }
          }}
          sx={{
            mx: 0,
            borderRadius: 0,
            mb: 0.5,
            minHeight: 36,
            pl: isChild ? 3 : 1.5,
            pr: 1,
            cursor: "pointer",
            backgroundColor: isActive
              ? "rgba(0, 255, 136, 0.1)"
              : "transparent",
            borderLeft: isActive
              ? "3px solid #00ff88"
              : "3px solid transparent",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(0, 255, 136, 0.05)",
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: isActive ? "#00ff88" : "rgba(255, 255, 255, 0.6)",
              minWidth: 32,
              "& .MuiSvgIcon-root": { fontSize: 18 },
            }}
          >
            {isChild ? (
              <RadioButtonChecked sx={{ fontSize: 12 }} />
            ) : (
              <IconComponent />
            )}
          </ListItemIcon>

          <ListItemText
            primary={item.title}
            sx={{
              "& .MuiListItemText-primary": {
                color: isActive ? "#00ff88" : "rgba(255, 255, 255, 0.87)",
                fontWeight: isActive ? 600 : 400,
                fontSize: isChild ? "0.8rem" : "0.85rem",
                lineHeight: 1.2,
              },
            }}
          />

          {item.badge && (
            <Chip
              label={item.badge}
              size="small"
              color={item.badge === "NEW" ? "success" : "warning"}
              sx={{
                height: 18,
                fontSize: "0.6rem",
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          )}

          {hasChildren && (
            <Box sx={{ color: "rgba(255, 255, 255, 0.5)", ml: 0.5 }}>
              {isExpanded ? (
                <ExpandLess sx={{ fontSize: 16 }} />
              ) : (
                <ExpandMore sx={{ fontSize: 16 }} />
              )}
            </Box>
          )}
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 0 }}>
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* رأس محسن مع لوكو وشعار */}
      <Box
        sx={{
          p: 2,
          background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
          color: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 100,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
            animation: "shine 3s infinite",
          },
          "@keyframes shine": {
            "0%": { transform: "translateX(-100%)" },
            "100%": { transform: "translateX(100%)" },
          },
        }}
      >
        {/* شعار مع لوكو */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1,
            zIndex: 1,
          }}
        >
          {/* لوكو من الصورة الحقيقية */}
          <Box
            sx={{
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: -2,
                zIndex: -1,
              },
            }}
          >
            <img
              src="/logo.png"
              alt="راصد لوكو"
              style={{
                width: "64px",
                height: "64px",
                objectFit: "contain",
                filter: "brightness(1.2) contrast(1.1)",
              }}
              onError={(e) => {
                // إذا فشل تحميل الصورة، اعرض حرف "ر" كبديل
                e.target.style.display = "none";
                e.target.parentElement.innerHTML =
                  '<div style="color: #00ff88; font-size: 1.4rem; font-weight: bold;">ر</div>';
              }}
            />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                fontSize: "2.3rem",
                letterSpacing: "1px",
                textShadow: "0 2px 4px rgba(255, 255, 255, 0.3)",
                mb: -0.5,
                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {APP_CONFIG.APP_NAME}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* القائمة المحسنة */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          py: 0.5,
          px: 0.5,
          "&::-webkit-scrollbar": { width: "3px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 255, 136, 0.2)",
            borderRadius: "3px",
          },
        }}
      >
        <List component="nav" sx={{ p: 0 }}>
          {menuItems.filter(shouldShowItem).map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* تذييل محسن مع حقوق المطور */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        {/* معلومات الإصدار */}
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "0.65rem",
            display: "block",
            mb: 1,
          }}
        >
          الإصدار {APP_CONFIG.VERSION}
        </Typography>

        {/* حقوق المطور - بارزة باللون الأخضر */}
        <Box
          sx={{
            p: 1.5,
            backgroundColor: "rgba(0, 255, 136, 0.1)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: 2,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, #00ff88, #00cc6a)",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#00ff88",
              fontSize: "0.8rem",
              fontWeight: "bold",
              lineHeight: 1.3,
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              mb: 0.5,
            }}
          >
             إعداد وبرمجة
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{
              color: "#00ff88",
              fontSize: "0.85rem",
              fontWeight: "bold",
              lineHeight: 1.2,
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              letterSpacing: "0.3px",
            }}
          >
            الملازم المهندس
            <br />
            أمير علي منذور
          </Typography>
        </Box>
      </Box>
    </Box>
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
          borderRight: "1px solid rgba(0, 255, 136, 0.2)",
          boxShadow: "2px 0 10px rgba(0, 255, 136, 0.1)",
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
