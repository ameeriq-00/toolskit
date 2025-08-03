// frontend/src/pages/Towers/SiteManagement.js - نسخة مبسطة آمنة
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Assessment as StatsIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/api";

const SiteManagement = () => {
  // ========== STATE MANAGEMENT ==========
  const { user } = useAuth();
  const [selectedSiteType, setSelectedSiteType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Site type configurations
  const siteTypes = [
    {
      value: "2g",
      label: "أبراج 2G",
      description: "رفع معلومات أبراج الجيل الثاني",
      color: "primary",
    },
    {
      value: "3g",
      label: "أبراج 3G",
      description: "رفع معلومات أبراج الجيل الثالث",
      color: "secondary",
    },
    {
      value: "4g",
      label: "أبراج 4G",
      description: "رفع معلومات أبراج الجيل الرابع",
      color: "success",
    },
    {
      value: "z",
      label: "تنسيق Z",
      description: "رفع معلومات أبراج بتنسيق Z",
      color: "warning",
    },
  ];

  // ========== EFFECTS ==========
  useEffect(() => {
    loadStatistics();
  }, []);

  // ========== HANDLERS ==========
  const loadStatistics = async () => {
    setLoadingStats(true);
    try {
      const response = await apiService.getUploadStatistics();
      console.log("Statistics loaded:", response);
      setStatistics(response);
    } catch (error) {
      console.error("Error loading statistics:", error);
      setStatistics(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [".xlsx", ".xls"];
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        setUploadResult({
          success: false,
          message: "نوع الملف غير مدعوم. يرجى رفع ملف Excel (.xlsx أو .xls)",
        });
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadResult({
          success: false,
          message: "حجم الملف كبير جداً. الحد الأقصى 50 ميجابايت",
        });
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedSiteType) {
      setUploadResult({
        success: false,
        message: "يرجى اختيار الملف ونوع الأبراج",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiService.uploadSites(
        selectedSiteType,
        selectedFile
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadResult({
        success: true,
        message: response.message || "تم رفع الملف بنجاح",
        successCount: response.success_count,
        errorCount: response.error_count,
        errors: response.errors || [],
      });

      // Reload statistics
      await loadStatistics();

      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        setSelectedSiteType("");
        const fileInput = document.getElementById("file-upload");
        if (fileInput) fileInput.value = "";
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);

      clearInterval();
      setUploadProgress(0);

      setUploadResult({
        success: false,
        message: apiService.formatError(error),
        errors: error.response?.data?.errors || [],
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedSiteType("");
    setUploadResult(null);
    setUploadProgress(0);
    const fileInput = document.getElementById("file-upload");
    if (fileInput) fileInput.value = "";
  };

  // ========== RENDER ==========
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          إدارة بيانات الأبراج
        </Typography>
        <Typography variant="body1" color="text.secondary">
          رفع وإدارة معلومات أبراج الاتصالات بجميع الأجيال
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <StatsIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">إحصائيات النظام</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton onClick={loadStatistics} disabled={loadingStats}>
                  <RefreshIcon />
                </IconButton>
              </Box>

              {loadingStats ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : statistics ? (
                <Grid container spacing={2}>
                  {Object.entries(statistics.statistics || {}).map(
                    ([type, count]) => (
                      <Grid item xs={12} sm={6} md={3} key={type}>
                        <Paper sx={{ p: 2, textAlign: "center" }}>
                          <Typography
                            variant="h4"
                            color="primary"
                            fontWeight="bold"
                          >
                            {count?.toLocaleString() || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type === "2G" && "أبراج 2G"}
                            {type === "3G" && "أبراج 3G"}
                            {type === "4G" && "أبراج 4G"}
                            {type === "Z_Format" && "تنسيق Z"}
                          </Typography>
                        </Paper>
                      </Grid>
                    )
                  )}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: "center",
                        bgcolor: "success.light",
                      }}
                    >
                      <Typography
                        variant="h4"
                        color="success.contrastText"
                        fontWeight="bold"
                      >
                        {statistics.total_sites?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="success.contrastText">
                        إجمالي الأبراج
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Alert
                  severity="warning"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={loadStatistics}
                    >
                      إعادة المحاولة
                    </Button>
                  }
                >
                  لا توجد إحصائيات متاحة أو حدث خطأ في التحميل
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upload Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <UploadIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">رفع بيانات الأبراج</Typography>
              </Box>

              {/* Site Type Selection */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>نوع الأبراج</InputLabel>
                    <Select
                      value={selectedSiteType}
                      label="نوع الأبراج"
                      onChange={(e) => setSelectedSiteType(e.target.value)}
                    >
                      {siteTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Chip
                              label={type.label}
                              color={type.color}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2">
                              {type.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{ height: 56 }}
                    >
                      {selectedFile ? selectedFile.name : "اختيار ملف Excel"}
                    </Button>
                  </label>
                </Grid>
              </Grid>

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    جاري رفع الملف... {uploadProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                </Box>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity={uploadResult.success ? "success" : "error"}>
                    <Typography variant="subtitle2">
                      {uploadResult.message}
                    </Typography>

                    {uploadResult.success && uploadResult.successCount && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        تم رفع {uploadResult.successCount} سجل بنجاح
                        {uploadResult.errorCount > 0 &&
                          ` (${uploadResult.errorCount} خطأ)`}
                      </Typography>
                    )}

                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">الأخطاء:</Typography>
                        <ul>
                          {uploadResult.errors
                            .slice(0, 5)
                            .map((error, index) => (
                              <li key={index}>
                                <Typography variant="body2">{error}</Typography>
                              </li>
                            ))}
                          {uploadResult.errors.length > 5 && (
                            <li>
                              <Typography variant="body2" fontStyle="italic">
                                ... و {uploadResult.errors.length - 5} أخطاء
                                أخرى
                              </Typography>
                            </li>
                          )}
                        </ul>
                      </Box>
                    )}
                  </Alert>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!selectedFile || !selectedSiteType || uploading}
                  startIcon={<UploadIcon />}
                >
                  {uploading ? "جاري الرفع..." : "رفع الملف"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={uploading}
                >
                  إعادة تعيين
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SiteManagement;
