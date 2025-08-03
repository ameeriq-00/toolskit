// frontend/src/pages/Towers/SiteManagement.js
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Assessment as StatsIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
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
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [errors, setErrors] = useState([]);

  // Site type configurations
  const siteTypes = [
    {
      value: "2g",
      label: "أبراج 2G",
      description: "رفع معلومات أبراج الجيل الثاني",
      color: "primary",
      requiredColumns: [
        "BSC",
        "SiteName",
        "SiteID",
        "CellID",
        "Geo-City",
        "LAC",
        "MCC",
        "MNC",
        "Longitude",
        "Latitude",
        "Mtilt",
        "Etilt",
        "Azimuth(Degree)",
        "Antennaheight",
        "Ant_BeamWidth",
      ],
    },
    {
      value: "3g",
      label: "أبراج 3G",
      description: "رفع معلومات أبراج الجيل الثالث",
      color: "secondary",
      requiredColumns: [
        "RNC",
        "Site ID",
        "Cell ID",
        "Full Site Name",
        "Cell_Name",
        "LAC",
        "Geo-City",
        "Longitude",
        "Latitude",
        "Azimuth",
        "Mechanical Tilt",
        "Elect. Tilt",
        "Antenna Height",
      ],
    },
    {
      value: "4g",
      label: "أبراج 4G",
      description: "رفع معلومات أبراج الجيل الرابع",
      color: "success",
      requiredColumns: [
        "eNBId",
        "Cell ID",
        "Full Site Name",
        "Cell_Name",
        "TAC",
        "Geo-City",
        "Longitude",
        "Latitude",
        "Azimuth",
        "Mechanical Tilt",
        "Elect. Tilt",
        "Antenna Height",
      ],
    },
    {
      value: "z",
      label: "تنسيق Z",
      description: "رفع معلومات أبراج بتنسيق Z",
      color: "warning",
      requiredColumns: [
        "Governorate",
        "Site/eNBId",
        "Cell ID",
        "Site Name",
        "lat",
        "Long",
        "Bore",
        "LAC_Cell ID/ECGI",
      ],
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
      setErrors([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedSiteType) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // استخدام الدالة المصححة
      const response = await apiService.uploadSites(
        selectedSiteType,
        selectedFile
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadResult({
        success: true,
        message: response.message,
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
        document.getElementById("file-upload").value = "";
      }, 2000);
    } catch (error) {
      setUploadProgress(0);
      setUploadResult({
        success: false,
        message: error.response?.data?.error || apiService.formatError(error),
        errors: error.response?.data?.errors || [],
      });
    } finally {
      setUploading(false);
    }
  };

  const selectedSiteTypeConfig = siteTypes.find(
    (type) => type.value === selectedSiteType
  );

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
        {/* Statistics Cards */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <StatsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">إحصائيات النظام</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton onClick={loadStatistics} disabled={loadingStats}>
                  <RefreshIcon />
                </IconButton>
              </Box>

              {loadingStats ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : statistics ? (
                <Grid container spacing={2}>
                  {Object.entries(statistics.statistics).map(
                    ([type, count]) => (
                      <Grid item xs={12} sm={6} md={3} key={type}>
                        <Paper sx={{ p: 2, textAlign: "center" }}>
                          <Typography variant="h4" color="primary">
                            {count.toLocaleString()}
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
                      <Typography variant="h4" color="success.contrastText">
                        {statistics.total_sites.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="success.contrastText">
                        إجمالي الأبراج
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="warning">لا توجد إحصائيات متاحة</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upload Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <UploadIcon sx={{ mr: 1 }} />
                <Typography variant="h6">رفع ملف جديد</Typography>
              </Box>

              {/* Site Type Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>نوع الأبراج</InputLabel>
                <Select
                  value={selectedSiteType}
                  onChange={(e) => setSelectedSiteType(e.target.value)}
                  disabled={uploading}
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
                        {type.description}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* File Upload */}
              <Box sx={{ mb: 3 }}>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={uploading || !selectedSiteType}
                    sx={{ mb: 1 }}
                  >
                    اختيار ملف Excel
                  </Button>
                </label>

                {selectedFile && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`${selectedFile.name} (${(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)} MB)`}
                      color="primary"
                      variant="outlined"
                      onDelete={() => {
                        setSelectedFile(null);
                        document.getElementById("file-upload").value = "";
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    جاري رفع الملف... {uploadProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                </Box>
              )}

              {/* Upload Button */}
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || !selectedSiteType || uploading}
                startIcon={
                  uploading ? <CircularProgress size={20} /> : <UploadIcon />
                }
                fullWidth
                size="large"
              >
                {uploading ? "جاري الرفع..." : "رفع الملف"}
              </Button>

              {/* Upload Result */}
              {uploadResult && (
                <Fade in={true}>
                  <Box sx={{ mt: 3 }}>
                    <Alert
                      severity={uploadResult.success ? "success" : "error"}
                      icon={
                        uploadResult.success ? <SuccessIcon /> : <ErrorIcon />
                      }
                    >
                      <Typography variant="body1">
                        {uploadResult.message}
                      </Typography>

                      {uploadResult.success && uploadResult.successCount && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          تم رفع {uploadResult.successCount} برج بنجاح
                          {uploadResult.errorCount > 0 &&
                            ` مع ${uploadResult.errorCount} خطأ`}
                        </Typography>
                      )}
                    </Alert>

                    {/* Errors Table */}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          الأخطاء المكتشفة:
                        </Typography>
                        <Paper sx={{ maxHeight: 200, overflow: "auto" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>رقم الخطأ</TableCell>
                                <TableCell>التفاصيل</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {uploadResult.errors.map((error, index) => (
                                <TableRow key={index}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{error}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Required Columns Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <InfoIcon sx={{ mr: 1 }} />
                <Typography variant="h6">معلومات مطلوبة</Typography>
              </Box>

              {selectedSiteTypeConfig ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      {selectedSiteTypeConfig.description}
                    </Typography>
                  </Alert>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    الأعمدة المطلوبة في الملف:
                  </Typography>

                  <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                    {selectedSiteTypeConfig.requiredColumns.map(
                      (column, index) => (
                        <Chip
                          key={index}
                          label={column}
                          size="small"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      )
                    )}
                  </Box>
                </>
              ) : (
                <Alert severity="warning">
                  اختر نوع الأبراج أولاً لعرض الأعمدة المطلوبة
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                متطلبات الملف:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • نوع الملف: Excel (.xlsx, .xls)
                <br />
                • الحد الأقصى للحجم: 50 ميجابايت
                <br />• يجب أن تكون جميع الأعمدة المطلوبة موجودة
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SiteManagement;
