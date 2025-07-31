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

  async refreshSession() {
    const sessionKey = localStorage.getItem("sessionKey");
    const response = await api.post("/api/auth/refresh-session/", {
      session_key: sessionKey,
    });
    return response.data;
  },

  async reportSuspiciousActivity(activityData) {
    const response = await api.post(
      "/api/auth/report-suspicious/",
      activityData
    );
    return response.data;
  },

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

  // ===== User Management (Admin) =====
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/admin/users/?${queryString}`);
    return response.data;
  },

  async getUserDetails(userId) {
    const response = await api.get(`/api/admin/users/${userId}/`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post("/api/admin/users/create/", userData);
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

  async activateUser(userId, expiresAt = null) {
    const response = await api.post(`/api/admin/users/${userId}/activate/`, {
      account_expires_at: expiresAt,
    });
    return response.data;
  },

  async deactivateUser(userId, reason = "") {
    const response = await api.post(`/api/admin/users/${userId}/deactivate/`, {
      reason,
    });
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

  // ===== Original Excel Analysis =====
  async analyzeExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/analyze-excel/", formData);
    return response.data;
  },

  async analyzeExcelZ(mainFile, imeiFile) {
    const formData = new FormData();
    formData.append("main_file", mainFile);
    formData.append("imei_file", imeiFile);
    const response = await api.post("/api/analyze-excel-z/", formData);
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
    const response = await api.post("/api/compare-sheets/", formData);
    return response.data;
  },

  // ===== Site Management =====
  async uploadSites(type, file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/sites/upload/${type}/`, formData);
    return response.data;
  },

  async getUploadStatistics() {
    const response = await api.get("/api/sites/upload/statistics/");
    return response.data;
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

  // ===== Nearby Sites - النسخة المُحدثة =====
  async findNearbySites(searchData) {
    const response = await api.post("/api/sites/nearby/", searchData);
    return response.data;
  },

  async findNearbyAsiaSites(siteData, limit = 2) {
    // تعديل هيكل البيانات ليتطابق مع Backend
    const requestData = {
      site_data: siteData, // ✅ تغليف البيانات بـ site_data
      limit: limit,
    };
    console.log("🔍 Frontend API - البيانات المرسلة لـ آسيا:", requestData);

    const response = await api.post("/api/sites/nearby/asia/", requestData);
    return response.data;
  },

  async findNearbyZainSites(siteData, limit = 2) {
    // تعديل هيكل البيانات ليتطابق مع Backend
    const requestData = {
      site_data: siteData, // ✅ تغليف البيانات بـ site_data
      limit: limit,
    };
    console.log("🔍 Frontend API - البيانات المرسلة لـ زين:", requestData);

    const response = await api.post("/api/sites/nearby/zain/", requestData);
    return response.data;
  },

  async getNearbySitesInRadius(lat, lon, radius, technology = "all") {
    // تحديث المعاملات لتتطابق مع Backend
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      radius: radius.toString(),
      technology: technology,
    });

    const response = await api.get(`/api/sites/nearby/radius/?${params}`);
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
    return !!localStorage.getItem("token");
  },

  getSessionKey() {
    return localStorage.getItem("sessionKey");
  },

  // ===== Real-time Updates =====
  async keepSessionAlive() {
    try {
      await this.refreshSession();
      return true;
    } catch (error) {
      console.warn("Failed to refresh session:", error);
      return false;
    }
  },

  // ===== Error Handling =====
  formatError(error) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "حدث خطأ غير متوقع";
  },
};

// Auto-refresh session every 30 minutes
if (apiService.isAuthenticated()) {
  setInterval(() => {
    apiService.keepSessionAlive();
  }, 30 * 60 * 1000); // 30 minutes
}

export default apiService;
