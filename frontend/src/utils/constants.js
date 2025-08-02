// App constants - محدث مع تحسين الأحجام والمساحات
export const APP_CONFIG = {
  DRAWER_WIDTH: 280, // زيادة العرض قليلاً لاستيعاب المحتوى الجديد
  DRAWER_WIDTH_COLLAPSED: 64,
  APP_NAME: "راصد",
  APP_NAME_EN: "RASED",
  VERSION: "2.0.0",
  COPYRIGHT: "إعداد وبرمجة الملازم المهندس أمير علي منذور",
  DEVELOPER: "الملازم المهندس أمير علي منذور",
  MOBILE_COPYRIGHT: "إعداد وبرمجة\nالملازم المهندس أمير علي منذور",
};

// Technology colors
export const TECH_COLORS = {
  "2G": "#f44336",
  "3G": "#ff9800",
  "4G": "#4caf50",
  Z_Format: "#2196f3",
  Z: "#2196f3",
};

// Theme colors - محدث مع تحسين الألوان
export const THEME_COLORS = {
  PRIMARY: "#00ff88",
  SECONDARY: "#00cc6a",
  SUCCESS: "#4caf50",
  WARNING: "#ff9800",
  ERROR: "#f44336",
  INFO: "#2196f3",
  BACKGROUND: "#0a0a0a",
  SURFACE: "#1a1a1a",
  BORDER: "rgba(255, 255, 255, 0.08)",
  HOVER: "rgba(0, 255, 136, 0.05)",
  ACTIVE: "rgba(0, 255, 136, 0.1)",
};

// Spacing system - محدث للحصول على تخطيط أكثر انضباطاً
export const SPACING = {
  UNIT: 4, // base unit in pixels
  XS: 4, // 0.25rem
  SM: 8, // 0.5rem
  MD: 12, // 0.75rem
  LG: 16, // 1rem
  XL: 24, // 1.5rem
  XXL: 32, // 2rem
};

// Typography scale - محدث مع أحجام أصغر وأكثر انضباطاً
export const TYPOGRAPHY_SCALE = {
  H1: "clamp(1.75rem, 4vw, 2.5rem)",
  H2: "clamp(1.5rem, 3.5vw, 2rem)",
  H3: "clamp(1.25rem, 3vw, 1.75rem)",
  H4: "clamp(1.1rem, 2.5vw, 1.5rem)",
  H5: "clamp(1rem, 2vw, 1.25rem)",
  H6: "clamp(0.95rem, 1.8vw, 1.1rem)",
  BODY1: "clamp(0.85rem, 1.3vw, 0.9rem)",
  BODY2: "clamp(0.8rem, 1.2vw, 0.85rem)",
  CAPTION: "clamp(0.7rem, 1vw, 0.75rem)",
  BUTTON: "clamp(0.8rem, 1.2vw, 0.85rem)",
};

// Layout dimensions - محدث
export const LAYOUT = {
  HEADER_HEIGHT: 64,
  HEADER_HEIGHT_MOBILE: 56,
  SIDEBAR_WIDTH: 280, // تحديث العرض ليتطابق مع APP_CONFIG
  SIDEBAR_WIDTH_COLLAPSED: 64,
  CONTENT_MAX_WIDTH: 1200,
  BORDER_WIDTH: 1,
  BORDER_RADIUS: 0, // حواف مربعة للسايد بار والتوب بار فقط
};

// Component heights - محدث للحصول على تصميم أكثر انضباطاً
export const COMPONENT_HEIGHTS = {
  BUTTON: 36,
  BUTTON_SMALL: 32,
  BUTTON_LARGE: 40,
  INPUT: 40,
  INPUT_SMALL: 36,
  LIST_ITEM: 36,
  LIST_ITEM_SMALL: 32,
  TAB: 44,
  TAB_MOBILE: 40,
  CHIP: 24,
  CHIP_SMALL: 20,
};

// Breakpoints
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
};

// Shadow system - محدث مع ظلال أقل حدة
export const SHADOWS = {
  NONE: "none",
  XS: "0 1px 2px rgba(0, 0, 0, 0.1)",
  SM: "0 1px 4px rgba(0, 0, 0, 0.2)",
  MD: "0 2px 8px rgba(0, 0, 0, 0.3)",
  LG: "0 4px 16px rgba(0, 0, 0, 0.4)",
  XL: "0 8px 32px rgba(0, 0, 0, 0.5)",
  PRIMARY: "0 2px 8px rgba(0, 255, 136, 0.2)",
  PRIMARY_HOVER: "0 4px 12px rgba(0, 255, 136, 0.3)",
};

// Animation durations
export const TRANSITIONS = {
  FAST: "0.1s",
  NORMAL: "0.2s",
  SLOW: "0.3s",
  EASE: "ease",
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
};

// Z-index system
export const Z_INDEX = {
  HIDE: -1,
  BASE: 0,
  BELOW: 1,
  NORMAL: 10,
  TOOLTIP: 1000,
  MODAL: 1300,
  SNACKBAR: 1400,
  DRAWER: 1200,
  APP_BAR: 1100,
};

// Grid system
export const GRID = {
  COLUMNS: 12,
  GUTTER: 16,
  GUTTER_MOBILE: 8,
  CONTAINER_PADDING: 24,
  CONTAINER_PADDING_MOBILE: 16,
};

// Icon sizes
export const ICON_SIZES = {
  XS: 12,
  SM: 16,
  MD: 20,
  LG: 24,
  XL: 32,
  XXL: 48,
};

// Border system
export const BORDERS = {
  NONE: "none",
  THIN: "1px solid",
  MEDIUM: "2px solid",
  THICK: "3px solid",
  RADIUS: 8, // نعومة طبيعية للعناصر العادية
  RADIUS_LARGE: 12, // للبطاقات الكبيرة
  RADIUS_SMALL: 4, // للعناصر الصغيرة
  COLOR_DEFAULT: "rgba(255, 255, 255, 0.08)",
  COLOR_PRIMARY: "rgba(0, 255, 136, 0.2)",
  COLOR_HOVER: "rgba(0, 255, 136, 0.3)",
};

// Navigation menu structure
export const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    title: "لوحة التحكم",
    icon: "Dashboard",
    path: "/",
    roles: ["user", "admin"],
  },
  {
    id: "analysis",
    title: "أدوات التحليل",
    icon: "Analytics",
    roles: ["user", "admin"],
    children: [
      {
        id: "excel-analyzer",
        title: "محلل Excel",
        icon: "Upload",
        path: "/excel-analyzer",
        permissions: ["analyze_excel"],
      },
      {
        id: "excel-analyzer-z",
        title: "محلل Excel Z",
        icon: "Timeline",
        path: "/excel-analyzer-z",
        permissions: ["analyze_excel"],
      },
      {
        id: "sheets-comparison",
        title: "مقارنة الشيتات",
        icon: "Compare",
        path: "/sheets-comparison",
        permissions: ["compare_sheets"],
        badge: "NEW",
      },
    ],
  },
  {
    id: "towers",
    title: "إدارة الأبراج",
    icon: "CellTower",
    roles: ["user", "admin"],
    children: [
      {
        id: "tower-search",
        title: "بحث الأبراج",
        icon: "Search",
        path: "/site-search",
        permissions: ["search_sites"],
      },
      {
        id: "tower-management",
        title: "إدارة البيانات",
        icon: "AdminPanelSettings",
        path: "/site-management",
        permissions: ["upload_sites", "manage_sites"],
        badge: "ADMIN",
      },
    ],
  },
  {
    id: "administration",
    title: "الإدارة",
    icon: "AdminPanelSettings",
    permissions: ["view_users", "view_activities", "manage_system"],
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

// Site types
export const SITE_TYPES = [
  { value: "2g", label: "2G Sites", description: "أبراج الجيل الثاني" },
  { value: "3g", label: "3G Sites", description: "أبراج الجيل الثالث" },
  { value: "4g", label: "4G Sites", description: "أبراج الجيل الرابع" },
  { value: "z", label: "Z Format", description: "تنسيق Z" },
];

// Permission definitions
export const PERMISSIONS = {
  // User Management
  VIEW_USERS: "view_users",
  CREATE_USERS: "create_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",

  // Role Management
  VIEW_ROLES: "view_roles",
  CREATE_ROLES: "create_roles",
  EDIT_ROLES: "edit_roles",
  DELETE_ROLES: "delete_roles",

  // Security & Monitoring
  VIEW_ACTIVITIES: "view_activities",
  VIEW_SECURITY_ALERTS: "view_security_alerts",
  MANAGE_SESSIONS: "manage_sessions",

  // Data Analysis
  ANALYZE_EXCEL: "analyze_excel",
  COMPARE_SHEETS: "compare_sheets",

  // Site Management
  UPLOAD_SITES: "upload_sites",
  SEARCH_SITES: "search_sites",
  MANAGE_SITES: "manage_sites",

  // Statistics & Reports
  VIEW_STATISTICS: "view_statistics",
  GENERATE_REPORTS: "generate_reports",

  // System Management
  MANAGE_SYSTEM: "manage_system",
  BACKUP_RESTORE: "backup_restore",
};

// User roles with their permissions
export const USER_ROLES = {
  ADMIN: {
    name: "admin",
    display_name: "مدير عام",
    permissions: Object.values(PERMISSIONS),
    color: "error",
  },
  ANALYST: {
    name: "analyst",
    display_name: "محلل",
    permissions: [
      PERMISSIONS.ANALYZE_EXCEL,
      PERMISSIONS.COMPARE_SHEETS,
      PERMISSIONS.SEARCH_SITES,
      PERMISSIONS.VIEW_STATISTICS,
    ],
    color: "primary",
  },
  OPERATOR: {
    name: "operator",
    display_name: "مشغل",
    permissions: [PERMISSIONS.SEARCH_SITES, PERMISSIONS.VIEW_STATISTICS],
    color: "secondary",
  },
  UPLOADER: {
    name: "uploader",
    display_name: "رافع البيانات",
    permissions: [
      PERMISSIONS.UPLOAD_SITES,
      PERMISSIONS.SEARCH_SITES,
      PERMISSIONS.VIEW_STATISTICS,
    ],
    color: "info",
  },
  VIEWER: {
    name: "viewer",
    display_name: "مشاهد",
    permissions: [PERMISSIONS.VIEW_STATISTICS],
    color: "default",
  },
};

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: [".xlsx", ".xls"],
  MAX_FILES_PER_UPLOAD: 5,
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Date/Time formats
export const DATE_FORMATS = {
  DISPLAY: "DD/MM/YYYY",
  DISPLAY_WITH_TIME: "DD/MM/YYYY HH:mm",
  API: "YYYY-MM-DD",
  API_WITH_TIME: "YYYY-MM-DD HH:mm:ss",
};

// Chart colors for analytics
export const CHART_COLORS = [
  "#00ff88", // Primary green
  "#00cc6a", // Secondary green
  "#2196f3", // Blue
  "#ff9800", // Orange
  "#f44336", // Red
  "#9c27b0", // Purple
  "#00bcd4", // Cyan
  "#ffeb3b", // Yellow
  "#795548", // Brown
  "#607d8b", // Blue Grey
];

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [33.3152, 44.3661], // Baghdad coordinates
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 6,
  MAX_ZOOM: 18,
  TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

// Helper functions
export const getPermissionDisplayName = (permission) => {
  const permissionNames = {
    [PERMISSIONS.VIEW_USERS]: "عرض المستخدمين",
    [PERMISSIONS.CREATE_USERS]: "إنشاء مستخدمين",
    [PERMISSIONS.EDIT_USERS]: "تعديل المستخدمين",
    [PERMISSIONS.DELETE_USERS]: "حذف المستخدمين",
    [PERMISSIONS.ANALYZE_EXCEL]: "تحليل ملفات Excel",
    [PERMISSIONS.COMPARE_SHEETS]: "مقارنة الملفات",
    [PERMISSIONS.SEARCH_SITES]: "البحث في الأبراج",
    [PERMISSIONS.UPLOAD_SITES]: "رفع بيانات الأبراج",
    [PERMISSIONS.MANAGE_SITES]: "إدارة بيانات الأبراج",
    [PERMISSIONS.VIEW_STATISTICS]: "عرض الإحصائيات",
    [PERMISSIONS.VIEW_ACTIVITIES]: "عرض النشاطات",
    [PERMISSIONS.VIEW_SECURITY_ALERTS]: "عرض التنبيهات الأمنية",
  };
  return permissionNames[permission] || permission;
};

export const getRoleColor = (roleName) => {
  const role = Object.values(USER_ROLES).find((r) => r.name === roleName);
  return role ? role.color : "default";
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const isValidFileType = (
  fileName,
  allowedExtensions = UPLOAD_LIMITS.ALLOWED_EXTENSIONS
) => {
  const extension = "." + fileName.split(".").pop().toLowerCase();
  return allowedExtensions.includes(extension);
};

export default {
  APP_CONFIG,
  TECH_COLORS,
  THEME_COLORS,
  SPACING,
  TYPOGRAPHY_SCALE,
  LAYOUT,
  COMPONENT_HEIGHTS,
  BREAKPOINTS,
  SHADOWS,
  TRANSITIONS,
  Z_INDEX,
  GRID,
  ICON_SIZES,
  BORDERS,
  NAVIGATION_ITEMS,
  SITE_TYPES,
  PERMISSIONS,
  USER_ROLES,
  UPLOAD_LIMITS,
  PAGINATION,
  DATE_FORMATS,
  CHART_COLORS,
  MAP_CONFIG,
  getPermissionDisplayName,
  getRoleColor,
  formatFileSize,
  isValidFileType,
};
