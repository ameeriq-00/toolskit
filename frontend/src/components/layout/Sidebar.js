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
        adminOnly: true,
        badge: 'ADMIN',
      },
    ],
  },
  {
    id: 'settings',
    title: 'الإعدادات',
    icon: 'Settings',
    path: '/settings',
  },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState(["analysis", "towers"]);

  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (item) => {
    if (item.children) {
      toggleExpanded(item.id);
    } else if (item.path) {
      navigate(item.path);
      if (onClose) onClose();
    }
  };

  const isSelected = (path) => location.pathname === path;

  const canAccess = (item) => {
    if (item.adminOnly && !user?.is_staff) return false;
    return true;
  };

  const renderIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : <DashboardIcon />;
  };

  const renderBadge = (badge) => {
    if (!badge) return null;

    const badgeProps = {
      NEW: { color: "success", label: "جديد" },
      ADMIN: { color: "error", label: "مدير" },
    };

    const props = badgeProps[badge] || { color: "default", label: badge };

    return (
      <Chip
        size="small"
        label={props.label}
        color={props.color}
        sx={{ ml: 1, fontSize: "0.6rem", height: 16 }}
      />
    );
  };

  const renderMenuItem = (item, depth = 0) => {
    if (!canAccess(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const selected = item.path ? isSelected(item.path) : false;

    return (
      <React.Fragment key={item.id}>
        <ListItem
          button
          onClick={() => handleItemClick(item)}
          selected={selected}
          sx={{
            pl: 2 + depth * 2,
            minHeight: 48,
          }}
        >
          <ListItemIcon
            sx={{
              color: selected ? "primary.main" : "text.secondary",
              minWidth: 40,
            }}
          >
            {renderIcon(item.icon)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: selected ? 600 : 400,
                    color: selected ? "primary.main" : "text.primary",
                  }}
                >
                  {item.title}
                </Typography>
                {renderBadge(item.badge)}
              </Box>
            }
          />
          {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo/Brand Section */}
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography
          variant="h4"
          sx={{
            color: "primary.main",
            fontWeight: "bold",
            fontSize: "2rem",
            letterSpacing: "0.1em",
            textShadow: "0 0 10px rgba(0, 255, 136, 0.5)",
            mb: 1,
          }}
        >
          راصد
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            display: "block",
            fontSize: "0.75rem",
          }}
        >
          منصة التحليل المتقدمة للاتصالات
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(0, 255, 136, 0.2)" }} />

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
        <List component="nav">
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Copyright Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(0, 255, 136, 0.2)",
          textAlign: "center",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.65rem" }}
        >
          {APP_CONFIG.COPYRIGHT}
        </Typography>
        <br />
        <Typography
          variant="caption"
          color="primary"
          sx={{ fontSize: "0.6rem" }}
        >
          الإصدار {APP_CONFIG.VERSION}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      open={open}
      sx={{
        width: APP_CONFIG.DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: APP_CONFIG.DRAWER_WIDTH,
          boxSizing: "border-box",
          direction: "rtl",
          zIndex: 1200,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;