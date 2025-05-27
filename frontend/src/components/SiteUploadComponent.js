import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import axios from "axios";

const SiteUploadComponent = () => {
  const [selectedType, setSelectedType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState("");

  const siteTypes = [
    { value: "2g", label: "2G Sites", description: "أبراج الجيل الثاني" },
    { value: "3g", label: "3G Sites", description: "أبراج الجيل الثالث" },
    { value: "4g", label: "4G Sites", description: "أبراج الجيل الرابع" },
    { value: "z", label: "Z Format", description: "تنسيق Z" },
  ];

  const requiredColumns = {
    "2g": [
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
    "3g": [
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
    "4g": [
      "SiteID",
      "CellID",
      "Province ID",
      "GEOCity",
      "FullSiteName",
      "CellName",
      "Technology",
      "LAC/TAC",
      "AntennaHeight",
      "Azimuth",
      "RFPlanLongitude",
      "RFPlanLatitude",
    ],
    z: [
      "Governorate",
      "Site/eNBId",
      "Cell ID",
      "Site Name",
      "lat",
      "Long",
      "Bore",
      "LAC_Cell ID/ECGI",
    ],
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/sites/upload/statistics/",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (
      file &&
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setSelectedFile(file);
      setError("");
      setUploadResult(null);
    } else {
      setError("يرجى اختيار ملف Excel صالح (.xlsx)");
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedType || !selectedFile) {
      setError("يرجى اختيار نوع البرج والملف");
      return;
    }

    setUploading(true);
    setError("");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/sites/upload/${selectedType}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadResult(response.data);
      fetchStatistics(); // تحديث الإحصائيات
      setSelectedFile(null);
      setSelectedType("");

      // إعادة تعيين input file
      const fileInput = document.getElementById("file-upload");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setError(error.response?.data?.error || "خطأ في رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const renderColumnsList = () => {
    if (!selectedType) return null;

    const columns = requiredColumns[selectedType] || [];

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <InfoIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            الأعمدة المطلوبة للنوع{" "}
            {siteTypes.find((t) => t.value === selectedType)?.label}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {columns.map((column, index) => (
              <Chip
                key={index}
                label={column}
                variant="outlined"
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <StorageIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            إحصائيات قواعد البيانات الحالية
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error">
                  {statistics.statistics?.["2G"]?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption">أبراج 2G</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {statistics.statistics?.["3G"]?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption">أبراج 3G</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {statistics.statistics?.["4G"]?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption">أبراج 4G</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {statistics.statistics?.["Z_Format"]?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption">Z Format</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box textAlign="center">
                <Typography variant="h5" color="primary">
                  {statistics.total_sites?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  إجمالي الأبراج في النظام
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderUploadForm = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <UploadIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          رفع معلومات الأبراج
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>نوع الأبراج</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                label="نوع الأبراج"
              >
                {siteTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography variant="body1">{type.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
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
              accept=".xlsx"
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ height: "56px" }}
              >
                {selectedFile ? selectedFile.name : "اختر ملف Excel (.xlsx)"}
              </Button>
            </label>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedType || !selectedFile || uploading}
              fullWidth
              size="large"
              startIcon={
                uploading ? <CircularProgress size={20} /> : <UploadIcon />
              }
            >
              {uploading ? "جاري الرفع..." : "رفع الملف"}
            </Button>
          </Grid>
        </Grid>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ mt: 1 }}
            >
              جاري معالجة الملف، يرجى الانتظار...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    if (!uploadResult) return null;

    const isSuccess = uploadResult.success_count > 0;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert
            severity={isSuccess ? "success" : "error"}
            icon={isSuccess ? <SuccessIcon /> : <ErrorIcon />}
            sx={{ mb: 2 }}
          >
            {uploadResult.message}
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {uploadResult.success_count}
                </Typography>
                <Typography variant="caption">نجح الرفع</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {uploadResult.error_count}
                </Typography>
                <Typography variant="caption">فشل الرفع</Typography>
              </Box>
            </Grid>
          </Grid>

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                أخطاء الرفع (أول 10):
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>الخطأ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadResult.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" color="error">
                            {error}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        <UploadIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        إدارة معلومات الأبراج
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        رفع وإدارة معلومات الأبراج لجميع التقنيات (2G, 3G, 4G, Z Format)
      </Typography>

      {renderStatistics()}
      {renderUploadForm()}
      {renderColumnsList()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderResults()}
    </Container>
  );
};

export default SiteUploadComponent;
