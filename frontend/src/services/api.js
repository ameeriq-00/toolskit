// frontend/src/services/api.js - الملف الأصلي الكامل مع التصحيحات
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("sessionKey");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API methods
const apiService = {
  // ===== Enhanced Authentication =====
  async login(credentials) {
    const response = await api.post("/api/auth/login/", credentials);
    const { access_token, session_key, user } = response.data.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("sessionKey", session_key);
    localStorage.setItem("userInfo", JSON.stringify(user));

    return response.data;
  },

  async logout() {
    const sessionKey = localStorage.getItem("sessionKey");
    try {
      await api.post("/api/auth/logout/", { session_key: sessionKey });
    } catch (error) {
      console.warn("Logout request failed:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("sessionKey");
    localStorage.removeItem("userInfo");
  },

  async getUserInfo() {
    const response = await api.get("/api/auth/user-info/");
    const userInfo = response.data.data;
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    return userInfo;
  },

  async changeMyPassword(passwordData) {
    const response = await api.post("/api/auth/change-password/", passwordData);
    return response.data;
  },

  async getMyActivities(limit = 50) {
    const response = await api.get(`/api/auth/my-activities/?limit=${limit}`);
    return response.data;
  },

  async getMySessions() {
    const response = await api.get("/api/auth/my-sessions/");
    return response.data;
  },

  async getSecurityDashboard() {
    const response = await api.get("/api/auth/security-dashboard/");
    return response.data;
  },

  async unlockMyAccount(unlockData) {
    const response = await api.post("/api/auth/unlock-account/", unlockData);
    return response.data;
  },

  async refreshSession() {
    const response = await api.post("/api/auth/refresh-session/");
    return response.data;
  },

  async reportSuspiciousActivity(reportData) {
    const response = await api.post("/api/auth/report-suspicious/", reportData);
    return response.data;
  },

  // ===== Validation Endpoints =====
  async checkUsernameAvailability(username) {
    const response = await api.post("/api/auth/check-username/", { username });
    return response.data;
  },

  async validatePasswordStrength(password) {
    const response = await api.post("/api/auth/validate-password/", {
      password,
    });
    return response.data;
  },

  // ===== Legacy Auth Support =====
  async numberLookup(phoneNumber) {
    const response = await api.post("/api/number-lookup/", {
      phone_number: phoneNumber,
    });
    return response.data;
  },

  // ===== User Management =====
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/admin/users/?${queryString}`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post("/api/admin/users/create/", userData);
    return response.data;
  },

  async getUserDetails(userId) {
    const response = await api.get(`/api/admin/users/${userId}/`);
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.put(
      `/api/admin/users/${userId}/update/`,
      userData
    );
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/api/admin/users/${userId}/delete/`);
    return response.data;
  },

  async activateUser(userId) {
    const response = await api.post(`/api/admin/users/${userId}/activate/`);
    return response.data;
  },

  async deactivateUser(userId) {
    const response = await api.post(`/api/admin/users/${userId}/deactivate/`);
    return response.data;
  },

  async changeUserPassword(userId, newPassword) {
    const response = await api.post(
      `/api/admin/users/${userId}/change-password/`,
      {
        new_password: newPassword,
      }
    );
    return response.data;
  },

  async getUserActivities(userId) {
    const response = await api.get(`/api/admin/users/${userId}/activities/`);
    return response.data;
  },

  // ===== Roles Management =====
  async getRoles() {
    const response = await api.get("/api/admin/roles/");
    return response.data;
  },

  async getUserPermissions() {
    const response = await api.get("/api/admin/permissions/");
    return response.data;
  },

  // ===== System Activities & Security =====
  async getSystemActivities(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/admin/activities/?${queryString}`);
    return response.data;
  },

  async getSecurityAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/admin/security-alerts/?${queryString}`
    );
    return response.data;
  },

  async resolveSecurityAlert(alertId, notes = "") {
    const response = await api.post(
      `/api/admin/security-alerts/${alertId}/resolve/`,
      {
        notes,
      }
    );
    return response.data;
  },

  async getDashboardStatistics() {
    const response = await api.get("/api/admin/dashboard-stats/");
    return response.data;
  },

  async terminateSession(sessionId) {
    const response = await api.post(
      `/api/admin/sessions/${sessionId}/terminate/`
    );
    return response.data;
  },

  // ===== Excel Analysis =====
  async analyzeExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/analyze-excel/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async analyzeExcelZ(mainFile, imeiFile) {
    const formData = new FormData();
    formData.append("main_file", mainFile);
    formData.append("imei_file", imeiFile);
    const response = await api.post("/api/analyze-excel-z/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ===== Sheets Comparison =====
  async compareSheets(filesData) {
    const formData = new FormData();
    filesData.forEach((fileData, index) => {
      formData.append(`file_${index}`, fileData.file);
      formData.append(`file_${index}_name`, fileData.name);
      formData.append(`file_${index}_format`, fileData.format);
    });
    const response = await api.post("/api/compare-sheets/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ===== Site Management - مُصحح ومُحدث =====
  async uploadSites(type, file) {
    const formData = new FormData();
    formData.append("file", file);

    // ✅ استخدام المسارات الجديدة أولاً، ثم القديمة كـ fallback
    const newEndpoints = {
      "2g": "/api/sites/upload/2g/",
      "3g": "/api/sites/upload/3g/",
      "4g": "/api/sites/upload/4g/",
      z: "/api/sites/upload/z/",
    };

    const oldEndpoints = {
      "2g": "/api/upload-2g-sites/",
      "3g": "/api/upload-3g-sites/",
      "4g": "/api/upload-4g-sites/",
      z: "/api/upload-z-format-sites/",
    };

    const newEndpoint = newEndpoints[type];
    const oldEndpoint = oldEndpoints[type];

    if (!newEndpoint && !oldEndpoint) {
      throw new Error(`نوع الأبراج غير مدعوم: ${type}`);
    }

    console.log(`🚀 Uploading ${type} sites to: ${newEndpoint}`);

    try {
      // جرب المسار الجديد أولاً
      const response = await api.post(newEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404 && oldEndpoint) {
        // إذا فشل المسار الجديد، جرب القديم
        console.log(`⚠️ Falling back to old endpoint: ${oldEndpoint}`);
        const response = await api.post(oldEndpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      }
      throw error;
    }
  },

  async getUploadStatistics() {
    // ✅ جرب المسار الجديد أولاً، ثم القديم
    try {
      const response = await api.get("/api/sites/upload/statistics/");
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("⚠️ Falling back to old statistics endpoint");
        const response = await api.get("/api/upload-statistics/");
        return response.data;
      }
      throw error;
    }
  },

  // دوال منفصلة لكل نوع (للاستخدام المباشر)
  async upload2GSites(file) {
    return this.uploadSites("2g", file);
  },

  async upload3GSites(file) {
    return this.uploadSites("3g", file);
  },

  async upload4GSites(file) {
    return this.uploadSites("4g", file);
  },

  async uploadZFormatSites(file) {
    return this.uploadSites("z", file);
  },

  // ===== Site Search =====
  async simplifiedSiteSearch(searchData) {
    const response = await api.post(
      "/api/sites/simplified-search/",
      searchData
    );
    return response.data;
  },

  async quickSiteSearch(searchData) {
    const response = await api.post("/api/sites/quick-search/", searchData);
    return response.data;
  },

  async advancedSiteSearch(searchData) {
    const response = await api.post("/api/sites/advanced-search/", searchData);
    return response.data;
  },

  async searchSites(searchData) {
    const response = await api.post("/api/sites/search/", searchData);
    return response.data;
  },

  async getSiteStatistics() {
    const response = await api.get("/api/sites/statistics/");
    return response.data;
  },

  async getSiteDetails(siteId, technology) {
    const response = await api.get(
      `/api/sites/${siteId}/${technology}/details/`
    );
    return response.data;
  },

  async getSearchStatistics() {
    const response = await api.get("/api/sites/statistics/");
    return response.data;
  },

  async getAvailableCities() {
    const response = await api.get("/api/sites/cities/");
    return response.data;
  },

  // ===== Nearby Sites =====
  async findNearbySites(searchData) {
    const response = await api.post("/api/sites/nearby/", searchData);
    return response.data;
  },

  async findNearbyAsiaSites(siteData, limit = 2) {
    const requestData = {
      site_data: siteData,
      limit: limit,
    };
    console.log("🔍 Frontend API - البيانات المرسلة لـ آسيا:", requestData);

    const response = await api.post("/api/sites/nearby/asia/", requestData);
    return response.data;
  },

  async findNearbyZainSites(siteData, limit = 2) {
    const requestData = {
      site_data: siteData,
      limit: limit,
    };
    console.log("🔍 Frontend API - البيانات المرسلة لـ زين:", requestData);

    const response = await api.post("/api/sites/nearby/zain/", requestData);
    return response.data;
  },

  async getNearbySitesInRadius(lat, lon, radius, technology = "all") {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      radius: radius.toString(),
      technology: technology,
    });

    const response = await api.get(`/api/sites/nearby/radius/?${params}`);
    return response.data;
  },

  // ===== Test Endpoints =====
  async testNearbySearch(testData) {
    const response = await api.post("/api/sites/nearby/test/", testData);
    return response.data;
  },

  // ===== Utility Functions =====
  hasPermission(permission) {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const permissions = userInfo.permissions || [];
    return permissions.includes(permission) || userInfo.is_superuser;
  },

  getCurrentUser() {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  },

  isAuthenticated() {
    return !!(
      localStorage.getItem("token") && localStorage.getItem("userInfo")
    );
  },

  clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionKey");
    localStorage.removeItem("userInfo");
  },

  // ===== Error Handling =====
  formatError(error) {
    if (error.response) {
      // الخادم أرجع استجابة مع كود خطأ
      const status = error.response.status;
      const data = error.response.data;

      if (status === 400) {
        return data.error || data.message || "بيانات غير صحيحة";
      } else if (status === 401) {
        return "غير مخول للوصول - يرجى تسجيل الدخول مرة أخرى";
      } else if (status === 403) {
        return "ليس لديك صلاحية للوصول لهذه الوظيفة";
      } else if (status === 404) {
        return "المورد المطلوب غير موجود";
      } else if (status === 500) {
        return "خطأ في الخادم - يرجى المحاولة لاحقاً";
      } else {
        return data.error || data.message || `خطأ ${status}`;
      }
    } else if (error.request) {
      // الطلب تم إرساله لكن لم يتم استلام رد
      return "لا يمكن الاتصال بالخادم - تحقق من الاتصال بالإنترنت";
    } else {
      // خطأ في إعداد الطلب
      return error.message || "حدث خطأ غير متوقع";
    }
  },

  // ===== File Upload Helpers =====
  async uploadFileWithProgress(endpoint, formData, onProgress) {
    return api.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  // ===== Network Status =====
  async checkServerHealth() {
    try {
      const response = await api.get("/api/health/", { timeout: 5000 });
      return { status: "healthy", data: response.data };
    } catch (error) {
      return { status: "unhealthy", error: this.formatError(error) };
    }
  },

  // ===== Cache Management =====
  clearCache() {
    // مسح التخزين المؤقت للبيانات المتكررة
    const cacheKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith("cache_")
    );
    cacheKeys.forEach((key) => localStorage.removeItem(key));
  },

  setCacheItem(key, data, expirationMinutes = 60) {
    const item = {
      data: data,
      timestamp: Date.now(),
      expiration: expirationMinutes * 60 * 1000,
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  },

  getCacheItem(key) {
    try {
      const itemStr = localStorage.getItem(`cache_${key}`);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = Date.now();

      if (now - item.timestamp > item.expiration) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.data;
    } catch (error) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
  },

  // ===== Development Helpers =====
  enableDebugMode() {
    localStorage.setItem("api_debug", "true");
    console.log("🔧 API Debug Mode Enabled");
  },

  disableDebugMode() {
    localStorage.removeItem("api_debug");
    console.log("🔧 API Debug Mode Disabled");
  },

  isDebugMode() {
    return localStorage.getItem("api_debug") === "true";
  },

  logRequest(config) {
    if (this.isDebugMode()) {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        headers: config.headers,
      });
    }
  },

  logResponse(response) {
    if (this.isDebugMode()) {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
  },

  logError(error) {
    if (this.isDebugMode()) {
      console.error("❌ API Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
    }
  },

  // ===== Advanced Features =====
  async batchRequest(requests) {
    try {
      const promises = requests.map((request) =>
        api.request(request).catch((error) => ({ error, request }))
      );

      const results = await Promise.all(promises);

      return {
        success: results.filter((result) => !result.error),
        failed: results.filter((result) => result.error),
      };
    } catch (error) {
      throw new Error(`Batch request failed: ${error.message}`);
    }
  },

  async retryRequest(requestConfig, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await api.request(requestConfig);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  },

  // ===== Specialized Search Functions =====
  async searchByCoordinates(lat, lon, radius = 1000) {
    const response = await api.post("/api/sites/search-coordinates/", {
      latitude: lat,
      longitude: lon,
      radius: radius,
    });
    return response.data;
  },

  async searchByCellId(cellId, technology = "all") {
    const response = await api.post("/api/sites/search-cell/", {
      cell_id: cellId,
      technology: technology,
    });
    return response.data;
  },

  async searchBySiteName(siteName, fuzzy = true) {
    const response = await api.post("/api/sites/search-name/", {
      site_name: siteName,
      fuzzy_match: fuzzy,
    });
    return response.data;
  },

  // ===== Data Export Functions =====
  async exportSearchResults(searchParams, format = "xlsx") {
    const response = await api.post(
      "/api/sites/export/",
      {
        ...searchParams,
        export_format: format,
      },
      {
        responseType: "blob",
      }
    );
    return response;
  },

  async exportStatistics(dateRange, format = "pdf") {
    const response = await api.post(
      "/api/statistics/export/",
      {
        start_date: dateRange.start,
        end_date: dateRange.end,
        format: format,
      },
      {
        responseType: "blob",
      }
    );
    return response;
  },

  // ===== Backup & Restore =====
  async backupData(dataTypes = ["sites", "users", "activities"]) {
    const response = await api.post("/api/admin/backup/", {
      data_types: dataTypes,
    });
    return response.data;
  },

  async restoreData(backupFile) {
    const formData = new FormData();
    formData.append("backup_file", backupFile);

    const response = await api.post("/api/admin/restore/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ===== Advanced Analytics =====
  async getAdvancedAnalytics(params = {}) {
    const response = await api.post("/api/analytics/advanced/", params);
    return response.data;
  },

  async getTrendAnalysis(metric, timeRange) {
    const response = await api.post("/api/analytics/trends/", {
      metric: metric,
      time_range: timeRange,
    });
    return response.data;
  },

  async getComparisonReport(data1, data2, comparisonType = "overlap") {
    const response = await api.post("/api/analytics/compare/", {
      dataset1: data1,
      dataset2: data2,
      comparison_type: comparisonType,
    });
    return response.data;
  },
};

export default apiService;