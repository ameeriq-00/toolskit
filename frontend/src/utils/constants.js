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

// Technology colors
export const TECH_COLORS = {
  "2G": "#f44336",
  "3G": "#ff9800", 
  "4G": "#4caf50",
  Z_Format: "#2196f3",
  Z: "#2196f3",
};

// App constants
export const APP_CONFIG = {
  DRAWER_WIDTH: 280,
  DRAWER_WIDTH_COLLAPSED: 64,
  APP_NAME: "راصد",
  APP_NAME_EN: "RASED",
  VERSION: "2.0.0",
  COPYRIGHT: "© 2024 راصد - جميع الحقوق محفوظة",
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/api/auth/login/",
  LOGOUT: "/api/auth/logout/",
  USER_INFO: "/api/auth/user-info/",
  CHANGE_PASSWORD: "/api/auth/change-password/",
  MY_ACTIVITIES: "/api/auth/my-activities/",
  MY_SESSIONS: "/api/auth/my-sessions/",
  SECURITY_DASHBOARD: "/api/auth/security-dashboard/",
  
  // User Management
  USERS: "/api/admin/users/",
  USER_DETAILS: "/api/admin/users/{id}/",
  CREATE_USER: "/api/admin/users/create/",
  UPDATE_USER: "/api/admin/users/{id}/update/",
  DELETE_USER: "/api/admin/users/{id}/delete/",
  ACTIVATE_USER: "/api/admin/users/{id}/activate/",
  DEACTIVATE_USER: "/api/admin/users/{id}/deactivate/",
  
  // Roles and Permissions
  ROLES: "/api/admin/roles/",
  PERMISSIONS: "/api/admin/permissions/",
  
  // System Activities
  SYSTEM_ACTIVITIES: "/api/admin/activities/",
  SECURITY_ALERTS: "/api/admin/security-alerts/",
  DASHBOARD_STATS: "/api/admin/dashboard-stats/",
  
  // Analysis
  ANALYZE_EXCEL: "/api/analyze-excel/",
  ANALYZE_EXCEL_Z: "/api/analyze-excel-z/",
  COMPARE_SHEETS: "/api/compare-sheets/",
  
  // Sites
  SITE_STATISTICS: "/api/sites/statistics/",
  SITE_SEARCH: "/api/sites/simplified-search/",
  SITE_UPLOAD: "/api/sites/upload/",
};

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
    permissions: [
      PERMISSIONS.SEARCH_SITES,
      PERMISSIONS.VIEW_STATISTICS,
    ],
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
    permissions: [
      PERMISSIONS.VIEW_STATISTICS,
    ],
    color: "default",
  },
};

// Activity types for logging
export const ACTIVITY_TYPES = {
  LOGIN: "login",
  LOGOUT: "logout", 
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  VIEW: "view",
  UPLOAD: "upload",
  DOWNLOAD: "download",
  SEARCH: "search",
  ANALYZE: "analyze",
  PASSWORD_CHANGE: "password_change",
  FAILED_LOGIN: "failed_login",
  ACCOUNT_LOCKED: "account_locked",
};

// Security alert types
export const ALERT_TYPES = {
  FAILED_LOGIN: "failed_login",
  ACCOUNT_LOCKED: "account_locked", 
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  MULTIPLE_SESSIONS: "multiple_sessions",
  PERMISSION_VIOLATION: "permission_violation",
  DATA_ACCESS: "data_access",
};

// Alert severity levels
export const ALERT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high", 
  CRITICAL: "critical",
};

// Theme colors
export const THEME_COLORS = {
  PRIMARY: "#00ff88",
  SECONDARY: "#00cc6a",
  SUCCESS: "#4caf50",
  WARNING: "#ff9800",
  ERROR: "#f44336",
  INFO: "#2196f3",
  BACKGROUND: "#0f0f0f",
  SURFACE: "#1a1a1a",
};

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls'],
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

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  SESSION_KEY: "sessionKey",
  USER_INFO: "userInfo",
  THEME_PREFERENCE: "themePreference",
  LANGUAGE: "language",
  SIDEBAR_COLLAPSED: "sidebarCollapsed",
};

// Status messages
export const STATUS_MESSAGES = {
  LOADING: "جاري التحميل...",
  SAVING: "جاري الحفظ...",
  DELETING: "جاري الحذف...",
  SUCCESS: "تم بنجاح",
  ERROR: "حدث خطأ",
  NO_DATA: "لا توجد بيانات",
  UNAUTHORIZED: "غير مصرح",
  FORBIDDEN: "ممنوع",
  NOT_FOUND: "غير موجود",
  SERVER_ERROR: "خطأ في الخادم",
  NETWORK_ERROR: "خطأ في الشبكة",
  VALIDATION_ERROR: "خطأ في التحقق",
};

// Default values
export const DEFAULTS = {
  PAGE: 1,
  PER_PAGE: 20,
  TIMEOUT: 30000, // 30 seconds
  REFRESH_INTERVAL: 300000, // 5 minutes
  SESSION_WARNING_TIME: 300000, // 5 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION: 30, // minutes
  PASSWORD_MIN_LENGTH: 8,
  SEARCH_DEBOUNCE_DELAY: 500, // milliseconds
};

// Validation rules
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    ERROR_MESSAGE: "اسم المستخدم يجب أن يحتوي على 3-30 حرف (أحرف وأرقام فقط)",
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_DIGIT: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    ERROR_MESSAGE:
      "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حروف كبيرة وصغيرة وأرقام ورموز خاصة",
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ERROR_MESSAGE: "يرجى إدخال بريد إلكتروني صحيح",
  },
  PHONE: {
    PATTERN: /^07\d{8}$/,
    ERROR_MESSAGE: "يرجى إدخال رقم هاتف عراقي صحيح (07xxxxxxxx)",
  },
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

// Export all constants as a single object for easier importing
export const CONSTANTS = {
  NAVIGATION_ITEMS,
  SITE_TYPES,
  TECH_COLORS,
  APP_CONFIG,
  API_ENDPOINTS,
  PERMISSIONS,
  USER_ROLES,
  ACTIVITY_TYPES,
  ALERT_TYPES,
  ALERT_SEVERITY,
  THEME_COLORS,
  UPLOAD_LIMITS,
  PAGINATION,
  DATE_FORMATS,
  STORAGE_KEYS,
  STATUS_MESSAGES,
  DEFAULTS,
  VALIDATION,
  CHART_COLORS,
  MAP_CONFIG,
};

// Helper functions for constants
export const getPermissionDisplayName = (permission) => {
  const permissionNames = {
    [PERMISSIONS.VIEW_USERS]: "عرض المستخدمين",
    [PERMISSIONS.CREATE_USERS]: "إنشاء مستخدمين",
    [PERMISSIONS.EDIT_USERS]: "تعديل المستخدمين",
    [PERMISSIONS.DELETE_USERS]: "حذف المستخدمين",
    [PERMISSIONS.VIEW_ROLES]: "عرض الأدوار",
    [PERMISSIONS.CREATE_ROLES]: "إنشاء أدوار",
    [PERMISSIONS.EDIT_ROLES]: "تعديل الأدوار",
    [PERMISSIONS.DELETE_ROLES]: "حذف الأدوار",
    [PERMISSIONS.VIEW_ACTIVITIES]: "عرض النشاطات",
    [PERMISSIONS.VIEW_SECURITY_ALERTS]: "عرض التنبيهات الأمنية",
    [PERMISSIONS.MANAGE_SESSIONS]: "إدارة الجلسات",
    [PERMISSIONS.ANALYZE_EXCEL]: "تحليل ملفات Excel",
    [PERMISSIONS.COMPARE_SHEETS]: "مقارنة الملفات",
    [PERMISSIONS.UPLOAD_SITES]: "رفع بيانات الأبراج",
    [PERMISSIONS.SEARCH_SITES]: "البحث في الأبراج",
    [PERMISSIONS.MANAGE_SITES]: "إدارة بيانات الأبراج",
    [PERMISSIONS.VIEW_STATISTICS]: "عرض الإحصائيات",
    [PERMISSIONS.GENERATE_REPORTS]: "إنشاء التقارير",
    [PERMISSIONS.MANAGE_SYSTEM]: "إدارة النظام",
    [PERMISSIONS.BACKUP_RESTORE]: "النسخ الاحتياطي والاستعادة",
  };

  return permissionNames[permission] || permission;
};

export const getRoleColor = (roleName) => {
  const role = Object.values(USER_ROLES).find((r) => r.name === roleName);
  return role ? role.color : "default";
};

export const getActivityTypeDisplayName = (activityType) => {
  const activityNames = {
    [ACTIVITY_TYPES.LOGIN]: "تسجيل دخول",
    [ACTIVITY_TYPES.LOGOUT]: "تسجيل خروج",
    [ACTIVITY_TYPES.CREATE]: "إنشاء",
    [ACTIVITY_TYPES.UPDATE]: "تحديث",
    [ACTIVITY_TYPES.DELETE]: "حذف",
    [ACTIVITY_TYPES.VIEW]: "عرض",
    [ACTIVITY_TYPES.UPLOAD]: "رفع",
    [ACTIVITY_TYPES.DOWNLOAD]: "تحميل",
    [ACTIVITY_TYPES.SEARCH]: "بحث",
    [ACTIVITY_TYPES.ANALYZE]: "تحليل",
    [ACTIVITY_TYPES.PASSWORD_CHANGE]: "تغيير كلمة مرور",
    [ACTIVITY_TYPES.FAILED_LOGIN]: "محاولة دخول فاشلة",
    [ACTIVITY_TYPES.ACCOUNT_LOCKED]: "قفل حساب",
  };

  return activityNames[activityType] || activityType;
};

export const getAlertSeverityColor = (severity) => {
  const severityColors = {
    [ALERT_SEVERITY.LOW]: "info",
    [ALERT_SEVERITY.MEDIUM]: "warning",
    [ALERT_SEVERITY.HIGH]: "error",
    [ALERT_SEVERITY.CRITICAL]: "error",
  };

  return severityColors[severity] || "default";
};

export const getAlertSeverityDisplayName = (severity) => {
  const severityNames = {
    [ALERT_SEVERITY.LOW]: "منخفض",
    [ALERT_SEVERITY.MEDIUM]: "متوسط",
    [ALERT_SEVERITY.HIGH]: "عالي",
    [ALERT_SEVERITY.CRITICAL]: "حرج",
  };

  return severityNames[severity] || severity;
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

export const validatePassword = (password) => {
  const rules = VALIDATION.PASSWORD;
  const errors = [];

  if (password.length < rules.MIN_LENGTH) {
    errors.push(`كلمة المرور يجب أن تكون ${rules.MIN_LENGTH} أحرف على الأقل`);
  }

  if (password.length > rules.MAX_LENGTH) {
    errors.push(`كلمة المرور يجب أن تكون ${rules.MAX_LENGTH} حرف على الأكثر`);
  }

  if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل");
  }

  if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل");
  }

  if (rules.REQUIRE_DIGIT && !/\d/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل");
  }

  if (
    rules.REQUIRE_SPECIAL &&
    !new RegExp(
      `[${rules.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`
    ).test(password)
  ) {
    errors.push("كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    strength: calculatePasswordStrength(password),
  };
};

const calculatePasswordStrength = (password) => {
  let score = 0;

  // Length bonus
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z\d]/.test(password)) score += 20;

  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 15; // Sequential patterns

  if (score >= 80) return { level: "قوي جداً", color: "success" };
  if (score >= 60) return { level: "قوي", color: "success" };
  if (score >= 40) return { level: "متوسط", color: "warning" };
  if (score >= 20) return { level: "ضعيف", color: "error" };
  return { level: "ضعيف جداً", color: "error" };
};

export default CONSTANTS;