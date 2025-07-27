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
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API methods
const apiService = {
  // Auth
  async login(credentials) {
    const response = await api.post("/api/token/", credentials);
    const { access } = response.data;
    localStorage.setItem("token", access);
    return response.data;
  },

  async getUserInfo() {
    const response = await api.get("/api/user-info/");
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
  },

  // Excel Analysis
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

  // Sheets Comparison
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

  // Site Management
  async getSiteStatistics() {
    const response = await api.get("/api/sites/statistics/");
    return response.data;
  },

  async searchSites(searchData) {
    const response = await api.post(
      "/api/sites/simplified-search/",
      searchData
    );
    return response.data;
  },

  async uploadSiteData(file, siteType) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/sites/upload/${siteType}/`, formData);
    return response.data;
  },

  // ===== NEW: Nearby Sites Functions =====

  /**
   * البحث عن الأبراج القريبة باستخدام معرف البرج والتقنية
   */
  async findNearbySites(siteId, technology, searchType = "asia", limit = 2) {
    const response = await api.post("/api/sites/nearby/", {
      site_id: siteId,
      technology: technology,
      search_type: searchType,
      limit: limit,
    });
    return response.data;
  },

  /**
   * البحث عن أقرب أبراج آسيا (2G, 3G, 4G)
   */
  async findNearbyAsiaSites(siteData, limit = 2) {
    const response = await api.post("/api/sites/nearby/asia/", {
      site_data: siteData,
      limit: limit,
    });
    return response.data;
  },

  /**
   * البحث عن أقرب أبراج زين (Z Format)
   */
  async findNearbyZainSites(siteData, limit = 2) {
    const response = await api.post("/api/sites/nearby/zain/", {
      site_data: siteData,
      limit: limit,
    });
    return response.data;
  },

  /**
   * الحصول على جميع الأبراج في نطاق معين
   */
  async getSitesInRadius(lat, lon, radius = 5, technology = "all") {
    const response = await api.get("/api/sites/nearby/radius/", {
      params: {
        lat: lat,
        lon: lon,
        radius: radius,
        technology: technology,
      },
    });
    return response.data;
  },

  /**
   * دالة مساعدة للبحث عن الأبراج القريبة من موقع معين
   */
  async findNearbyByType(siteData, searchType) {
    if (searchType === "asia") {
      return await this.findNearbyAsiaSites(siteData);
    } else if (searchType === "zain") {
      return await this.findNearbyZainSites(siteData);
    } else {
      throw new Error('نوع البحث غير صحيح. استخدم "asia" أو "zain"');
    }
  },

  /**
   * حساب المسافة بين نقطتين (استخدام محلي)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Generic methods
  async get(endpoint) {
    const response = await api.get(endpoint);
    return response.data;
  },

  async post(endpoint, data) {
    const response = await api.post(endpoint, data);
    return response.data;
  },
};

export default apiService;