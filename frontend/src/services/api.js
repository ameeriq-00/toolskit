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
