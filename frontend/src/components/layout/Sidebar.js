import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Collapse,
  Badge,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  CellTower as TowerIcon,
  Map as MapIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Compare as CompareIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { APP_CONFIG } from '../../utils/constants';

const iconMap = {
  Dashboard: DashboardIcon,
  Analytics: AnalyticsIcon,
  CellTower: TowerIcon,
  Map: MapIcon,
  Upload: UploadIcon,
  Search: SearchIcon,
  Compare: CompareIcon,
  Timeline: TimelineIcon,
  Settings: SettingsIcon,
  AdminPanelSettings: AdminIcon,
  Security: SecurityIcon,
  People: PeopleIcon,
};

const menuItems = [
  {
    id: 'dashboard',
    title: 'لوحة التحكم',
    icon: 'Dashboard',
    path: '/',
  },
  {
    id: 'analysis',
    title: 'أدوات التحليل',
    icon: 'Analytics',
    children: [
      {
        id: 'excel-analyzer',
        title: 'محلل Excel',
        icon: 'Upload',
        path: '/excel-analyzer',
      },
      {
        id: 'excel-analyzer-z',
        title: 'محلل Excel Z',
        icon: 'Timeline',
        path: '/excel-analyzer-z',
      },
      {
        id: 'sheets-comparison',
        title: 'مقارنة الشيتات',
        icon: 'Compare',
        path: '/sheets-comparison',
        badge: 'NEW',
      },
    ],
  },
  {
    id: 'towers',
    title: 'إدارة الأبراج',
    icon: 'CellTower',
    children: [
      {
        id: 'tower-search',
        title: 'بحث الأبراج',
        icon: 'Search',
        path: '/site-search',
      },
      {
        id: 'tower-management',
        title: 'إدارة البيانات',
        icon: 'AdminPanelSettings',
        path: '/site-management',
        permissions: ['upload_sites', 'manage_sites'],
        badge: 'ADMIN',
      },
    ],
  },
  {
    id: 'administration',
    title: 'الإدارة',
    icon: 'AdminPanelSettings',
    permissions: ['view_users', 'view_activities', 'manage_system'],
    children: [
      {
        id: 'user-management',
        title: 'إدارة المستخدمين',
        icon: 'People',
        path: '/user-management',
        permissions: ['view_users'],
      },
      {
        id: 'system-activities',
        title: 'سجل النشاطات',
        icon: 'Timeline',
        path: '/system-activities',
        permissions: ['view_activities'],
      },
      {
        id: 'security-alerts',
        title: 'التنبيهات الأمنية',
        icon: 'Security',
        path: '/security-alerts',
        permissions: ['view_security_alerts'],
      },
    ],
  },
  {
    id: 'personal',
    title: 'شخصي',
    icon: 'Security',
    children: [
      {
        id: 'my-security',
        title: 'الأمان الشخصي',
        icon: 'Security',
        path: '/my-security',
      },
      {
        id: 'settings',
        title: 'الإعدادات',
        icon: 'Settings',
        path: '/settings',
      },
    ],
  },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission, hasAnyPermission, getFullName, getRoleName } =
    useAuth();
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
    // If no permissions specified, show to all users
    if (!item.permissions) return true;

    // Check if user has any of the required permissions
    return hasAnyPermission(...item.permissions);
  };

  const isItemActive = (path) => {
    return location.pathname === path;
  };

  const getActiveParent = () => {
    const currentPath = location.pathname;
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.path === currentPath) {
            return item.id;
          }
        }
      }
    }
    return null;
  };

  const activeParent = getActiveParent();

  // Auto-expand parent of active item
  React.useEffect(() => {
    if (activeParent && !expandedItems.includes(activeParent)) {
      setExpandedItems((prev) => [...prev, activeParent]);
    }
  }, [activeParent]);

  const renderMenuItem = (item, isChild = false) => {
    const IconComponent = iconMap[item.icon];
    const isActive = isItemActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    // Check permissions
    if (!shouldShowItem(item)) {
      return null;
    }

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
            marginX: 1,
            borderRadius: 2,
            marginBottom: 0.5,
            paddingLeft: isChild ? 4 : 2,
            backgroundColor: isActive
              ? "rgba(0, 255, 136, 0.1)"
              : "transparent",
            borderLeft: isActive ? "3px solid #00ff88" : "none",
            "&:hover": {
              backgroundColor: "rgba(0, 255, 136, 0.05)",
            },
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

          {/* Badges */}
          {item.badge && (
            <Chip
              label={item.badge}
              size="small"
              color={item.badge === "NEW" ? "success" : "secondary"}
              sx={{
                height: 20,
                fontSize: "0.6rem",
                fontWeight: "bold",
              }}
            />
          )}

          {/* Expand/Collapse Icon */}
          {hasChildren &&
            (isExpanded ? (
              <ExpandLess sx={{ color: "rgba(255, 255, 255, 0.7)" }} />
            ) : (
              <ExpandMore sx={{ color: "rgba(255, 255, 255, 0.7)" }} />
            ))}
        </ListItem>

        {/* Children Items */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children
                .filter((child) => shouldShowItem(child))
                .map((child) => renderMenuItem(child, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

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
          background: "linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)",
          borderLeft: "2px solid #00ff88",
          overflowX: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          background: "linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)",
          color: "#000",
          textAlign: "center",
          borderBottom: "1px solid rgba(0, 255, 136, 0.3)",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {APP_CONFIG.APP_NAME}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          نظام التحليل المتقدم
        </Typography>
      </Box>

      {/* User Info */}
      <Box
        sx={{
          padding: 2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        }}
      >
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
            {getFullName().charAt(0) || user?.username?.charAt(0) || "U"}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {getFullName() || user?.username}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {getRoleName()}
            </Typography>
          </Box>
        </Box>

        {/* User Status Indicators */}
        <Box sx={{ marginTop: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
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
              label="تغيير كلمة المرور مطلوب"
              size="small"
              color="warning"
              sx={{ fontSize: "0.65rem", height: 18 }}
            />
          )}

          {user?.profile?.account_expires_at && (
            <Chip
              label="حساب مؤقت"
              size="small"
              color="info"
              sx={{ fontSize: "0.65rem", height: 18 }}
            />
          )}
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflowY: "auto", paddingY: 1 }}>
        <List component="nav">
          {menuItems
            .filter((item) => shouldShowItem(item))
            .map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          padding: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            display: "block",
            marginBottom: 0.5,
          }}
        >
          {APP_CONFIG.APP_NAME} v{APP_CONFIG.VERSION}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.3)",
            fontSize: "0.65rem",
          }}
        >
          {APP_CONFIG.COPYRIGHT}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;