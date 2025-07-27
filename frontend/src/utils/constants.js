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
    roles: ["user", "admin"],
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
        roles: ["admin"],
        badge: "ADMIN",
      },
    ],
  },
  {
    id: "settings",
    title: "الإعدادات",
    icon: "Settings",
    path: "/settings",
    roles: ["user", "admin"],
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
  VERSION: "1.0.0",
  COPYRIGHT: "© 2024 راصد - جميع الحقوق محفوظة",
};

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: "/api/token/",
  USER_INFO: "/api/user-info/",
  ANALYZE_EXCEL: "/api/analyze-excel/",
  ANALYZE_EXCEL_Z: "/api/analyze-excel-z/",
  COMPARE_SHEETS: "/api/compare-sheets/",
  SITE_STATISTICS: "/api/sites/statistics/",
  SITE_SEARCH: "/api/sites/simplified-search/",
  SITE_UPLOAD: "/api/sites/upload/",
};
