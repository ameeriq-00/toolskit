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

  // ===== ENHANCED: Nearby Sites Functions =====

  /**
   * البحث عن أقرب أبراج آسيا (2G, 3G, 4G) - محسن لضمان إرجاع برجين
   */
  async findNearbyAsiaSites(siteData, limit = 2) {
    try {
      console.log("🔍 طلب البحث عن أبراج آسيا:", { siteData, limit });

      // التأكد من أن limit = 2 على الأقل
      const requestLimit = Math.max(limit, 2);

      const response = await api.post("/api/sites/nearby/asia/", {
        site_data: {
          site_id: siteData.site_id,
          site_name: siteData.site_name,
          technology: siteData.technology,
          coordinates: {
            latitude: parseFloat(siteData.coordinates.latitude),
            longitude: parseFloat(siteData.coordinates.longitude),
          },
        },
        limit: requestLimit,
      });

      console.log("✅ استجابة أبراج آسيا:", response.data);

      if (response.data.success) {
        const nearbyAsiaSites = response.data.data.nearby_sites || [];

        // التأكد من إرجاع أقرب برجين على الأقل (إذا توفرا)
        const finalSites = nearbyAsiaSites.slice(0, requestLimit);

        console.log(
          `📍 تم العثور على ${finalSites.length} برج آسيا قريب:`,
          finalSites
        );

        return {
          success: true,
          data: {
            nearby_sites: finalSites,
            total_found: finalSites.length,
            search_type: "asia",
          },
        };
      } else {
        console.error("❌ فشل في البحث عن أبراج آسيا:", response.data.error);
        return {
          success: false,
          error: response.data.error || "فشل في البحث عن أبراج آسيا",
        };
      }
    } catch (error) {
      console.error("💥 خطأ في البحث عن أبراج آسيا:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "خطأ في الاتصال بالخادم",
      };
    }
  },

  /**
   * البحث عن أقرب أبراج زين (Z Format) - محسن لضمان إرجاع برجين
   */
  async findNearbyZainSites(siteData, limit = 2) {
    try {
      console.log("🔍 طلب البحث عن أبراج زين:", { siteData, limit });

      // التأكد من أن limit = 2 على الأقل
      const requestLimit = Math.max(limit, 2);

      const response = await api.post("/api/sites/nearby/zain/", {
        site_data: {
          site_id: siteData.site_id,
          site_name: siteData.site_name,
          technology: siteData.technology,
          coordinates: {
            latitude: parseFloat(siteData.coordinates.latitude),
            longitude: parseFloat(siteData.coordinates.longitude),
          },
        },
        limit: requestLimit,
      });

      console.log("✅ استجابة أبراج زين:", response.data);

      if (response.data.success) {
        const nearbyZainSites = response.data.data.nearby_sites || [];

        // التأكد من إرجاع أقرب برجين على الأقل (إذا توفرا)
        const finalSites = nearbyZainSites.slice(0, requestLimit);

        console.log(
          `📍 تم العثور على ${finalSites.length} برج زين قريب:`,
          finalSites
        );

        return {
          success: true,
          data: {
            nearby_sites: finalSites,
            total_found: finalSites.length,
            search_type: "zain",
          },
        };
      } else {
        console.error("❌ فشل في البحث عن أبراج زين:", response.data.error);
        return {
          success: false,
          error: response.data.error || "فشل في البحث عن أبراج زين",
        };
      }
    } catch (error) {
      console.error("💥 خطأ في البحث عن أبراج زين:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "خطأ في الاتصال بالخادم",
      };
    }
  },

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
  async findNearbyByType(siteData, searchType, limit = 2) {
    if (searchType === "asia") {
      return await this.findNearbyAsiaSites(siteData, limit);
    } else if (searchType === "zain") {
      return await this.findNearbyZainSites(siteData, limit);
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

  /**
   * اختبار النظام - للتطوير فقط
   */
  async testNearbySearch() {
    try {
      const response = await api.post("/api/sites/nearby/test/");
      return response.data;
    } catch (error) {
      console.error("خطأ في اختبار البحث:", error);
      throw error;
    }
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