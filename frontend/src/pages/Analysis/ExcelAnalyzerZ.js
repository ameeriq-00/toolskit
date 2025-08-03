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
  Divider,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Timeline as TimelineIcon,
  CheckCircle as SuccessIcon,
  Description as FileIcon,
} from "@mui/icons-material";
import { useFileUpload } from "../../hooks/useApi";
import DataTable from "../../components/common/DataTable";
import TimeAnalysisDashboard from "../../components/analysis/TimeAnalysisDashboard";
import MovementMap from "../../components/analysis/MovementMap";
import SiteMap from "../../components/analysis/SiteMap";
import MostVisitedSitesDashboard from "../../components/analysis/MostVisitedSitesDashboard";
import ImeiAnalysisDashboard from "../../components/analysis/ImeiAnalysisDashboard";
import * as XLSX from "xlsx";

const ExcelAnalyzerZ = () => {
  const [mainFile, setMainFile] = useState(null);
  const [imeiFile, setImeiFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const { loading, error, uploadProgress, uploadFile, clearError } =
    useFileUpload();

  const handleMainFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setMainFile(file);
    clearError();

    // Read original data for Z format (skip first 5 rows)
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            range: 5, // Skip first 5 rows for Z format
            raw: false,
          });
          setOriginalData(jsonData);
        } catch (err) {
          console.error("Error processing main file:", err);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Error reading main file:", err);
    }
  };

  const handleImeiFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      alert("يرجى رفع ملف Excel صالح (.xlsx) لملف IMEI");
      return;
    }

    setImeiFile(file);
    clearError();
  };

  const handleAnalyze = async () => {
    if (!mainFile || !imeiFile) {
      alert("يرجى رفع كلا الملفين قبل التحليل");
      return;
    }

    const result = await uploadFile({ mainFile, imeiFile }, "excel-z");
    if (result.success) {
      setAnalysisResult(result.data);
      setActiveTab(0);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const resetAnalysis = () => {
    setMainFile(null);
    setImeiFile(null);
    setAnalysisResult(null);
    setOriginalData(null);
    setActiveTab(0);
    clearError();
    // Reset file inputs
    const mainInput = document.getElementById("main-file-input");
    const imeiInput = document.getElementById("imei-file-input");
    if (mainInput) mainInput.value = "";
    if (imeiInput) imeiInput.value = "";
  };

  const tabs = [
    { label: " الجسور", component: "filtered_calls" },
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
            isZFormat={true}
          />
        );
      case 4:
        return <MovementMap movementData={analysisResult.movement_analysis} />;
      case 5:
        return <SiteMap sites={analysisResult.most_visited_sites || []} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <TimelineIcon sx={{ mr: 1, verticalAlign: "middle" }} />
             تحليل زين
        </Typography>
        <Typography variant="body1" color="text.secondary">
          تحليل متخصص للتنسيق Z مع ملفات IMEI منفصلة
        </Typography>
      </Box>

      {/* File Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <UploadIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            رفع الملفات للتحليل
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>ملاحظة:</strong> تنسيق Z يتطلب ملفين منفصلين - الملف
              الرئيسي وملف IMEI
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Main File */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                الملف الرئيسي *
              </Typography>
              <input
                accept=".xlsx"
                id="main-file-input"
                type="file"
                onChange={handleMainFileChange}
                style={{ display: "none" }}
              />
              <label htmlFor="main-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ height: 56, justifyContent: "flex-start" }}
                  startIcon={<FileIcon />}
                >
                  {mainFile ? mainFile.name : "اختر الملف الرئيسي (.xlsx)"}
                </Button>
              </label>
              {mainFile && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  الحجم: {(mainFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Grid>

            {/* IMEI File */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                ملف IMEI *
              </Typography>
              <input
                accept=".xlsx"
                id="imei-file-input"
                type="file"
                onChange={handleImeiFileChange}
                style={{ display: "none" }}
              />
              <label htmlFor="imei-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ height: 56, justifyContent: "flex-start" }}
                  startIcon={<FileIcon />}
                >
                  {imeiFile ? imeiFile.name : "اختر ملف IMEI (.xlsx)"}
                </Button>
              </label>
              {imeiFile && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  الحجم: {(imeiFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!mainFile || !imeiFile || loading}
                  size="large"
                  startIcon={loading ? null : <TimelineIcon />}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? "جاري التحليل..." : "بدء التحليل"}
                </Button>
                {(mainFile || imeiFile || analysisResult) && (
                  <Button
                    variant="outlined"
                    onClick={resetAnalysis}
                    disabled={loading}
                    size="large"
                  >
                    إعادة تعيين
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Upload Progress */}
          {loading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, textAlign: "center" }}
              >
                {uploadProgress < 100
                  ? "جاري رفع الملفات..."
                  : "جاري معالجة البيانات..."}
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
            <strong>تم التحليل بنجاح!</strong> تم معالجة ملفات Z وإنشاء التقارير
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
                ملخص النتائج - تنسيق Z
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

export default ExcelAnalyzerZ;