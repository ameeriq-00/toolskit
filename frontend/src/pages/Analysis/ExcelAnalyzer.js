import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Grid,
  Chip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";
import { useFileUpload } from "../../hooks/useApi";
import DataTable from "../../components/common/DataTable";
import TimeAnalysisDashboard from "../../components/analysis/TimeAnalysisDashboard";
import MovementMap from "../../components/analysis/MovementMap";
import SiteMap from "../../components/analysis/SiteMap";
import MostVisitedSitesDashboard from "../../components/analysis/MostVisitedSitesDashboard";
import ImeiAnalysisDashboard from "../../components/analysis/ImeiAnalysisDashboard";
import * as XLSX from "xlsx";

const ExcelAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const { loading, error, uploadProgress, uploadFile, clearError } =
    useFileUpload();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    clearError();

    // Read original data for analysis
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
          setOriginalData(jsonData);
        } catch (err) {
          console.error("Error processing file:", err);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Error reading file:", err);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    const result = await uploadFile(selectedFile, "excel");
    if (result.success) {
      setAnalysisResult(result.data);
      setActiveTab(0);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setOriginalData(null);
    setActiveTab(0);
    clearError();
    // Reset file input
    const fileInput = document.getElementById("excel-file-input");
    if (fileInput) fileInput.value = "";
  };

  const tabs = [
    { label: "الجسور ", component: "filtered_calls" },
    { label: "استخدام IMEI", component: "imei_usage" },
    { label: "أكثر المواقع زيارة", component: "most_visited_sites" },
    { label: "تحليل الوقت", component: "time_analysis" },
    { label: "تحليل التنقلات", component: "movement_analysis" },
    { label: "خريطة المواقع", component: "site_map" },
  ];

  const renderTabContent = () => {
    if (!analysisResult) return null;

    switch (activeTab) {
      case 0:
        return <DataTable data={analysisResult.filtered_calls} />;
      case 1:
        return <ImeiAnalysisDashboard imeiData={analysisResult.imei_usage} />;
      case 2:
        return (
          <MostVisitedSitesDashboard
            sites={analysisResult.most_visited_sites}
          />
        );
      case 3:
        return (
          <TimeAnalysisDashboard
            timeData={analysisResult.time_analysis}
            callPatterns={analysisResult.call_patterns}
            originalData={originalData}
            isZFormat={false}
          />
        );
      case 4:
        return <MovementMap movementData={analysisResult.movement_analysis} />;
      case 5:
        return <SiteMap sites={analysisResult.most_visited_sites} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <AnalyticsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            تحليل اسيا
        </Typography>
        <Typography variant="body1" color="text.secondary">
          تحليل شامل لبيانات المكالمات والمواقع والتنقلات
        </Typography>
      </Box>

      {/* File Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <UploadIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            رفع ملف Excel للتحليل
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <input
                accept=".xlsx,.xls"
                id="excel-file-input"
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <label htmlFor="excel-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ height: 56, textAlign: "left" }}
                >
                  {selectedFile
                    ? selectedFile.name
                    : "اختر ملف Excel (.xlsx, .xls)"}
                </Button>
              </label>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                  fullWidth
                  startIcon={loading ? null : <AnalyticsIcon />}
                >
                  {loading ? "جاري التحليل..." : "بدء التحليل"}
                </Button>
                {(selectedFile || analysisResult) && (
                  <Button
                    variant="outlined"
                    onClick={resetAnalysis}
                    disabled={loading}
                  >
                    إعادة تعيين
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Upload Progress */}
          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {uploadProgress < 100
                  ? "جاري رفع الملف..."
                  : "جاري معالجة البيانات..."}
              </Typography>
            </Box>
          )}

          {/* File Info */}
          {selectedFile && !loading && (
            <Box
              sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
            >
              <Typography variant="body2">
                <strong>الملف المحدد:</strong> {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>الحجم:</strong>{" "}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>خطأ في التحليل:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Success Alert */}
      {analysisResult && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<SuccessIcon />}>
          <Typography variant="body2">
            <strong>تم التحليل بنجاح!</strong> تم معالجة البيانات وإنشاء
            التقارير
          </Typography>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardContent>
            {/* Results Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ملخص النتائج
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`${
                    analysisResult.filtered_calls?.length || 0
                  } مكالمة مفلترة`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${
                    analysisResult.most_visited_sites?.length || 0
                  } موقع`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`${analysisResult.imei_usage?.length || 0} جهاز IMEI`}
                  color="info"
                  variant="outlined"
                />
                {analysisResult.time_analysis && (
                  <Chip
                    label={`${
                      analysisResult.time_analysis.statistical_summary
                        ?.total_calls || 0
                    } إجمالي المكالمات`}
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
              >
                {tabs.map((tab, index) => (
                  <Tab key={index} label={tab.label} />
                ))}
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box>{renderTabContent()}</Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ExcelAnalyzer;