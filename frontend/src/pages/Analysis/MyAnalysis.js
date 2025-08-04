// frontend/src/pages/Analysis/MyAnalysis.js - نسخة مصححة

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  Tabs,
  Tab,
  Snackbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Description as FileIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  PhoneAndroid as PhoneIcon,
  Analytics as AnalyticsIcon,
  CompareArrows as CompareIcon,
  AccountTree as NetworkIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

// استيراد مكونات التحليل
import DataTable from "../../components/common/DataTable";
import TimeAnalysisDashboard from "../../components/analysis/TimeAnalysisDashboard";
import MovementMap from "../../components/analysis/MovementMap";
import SiteMap from "../../components/analysis/SiteMap";
import MostVisitedSitesDashboard from "../../components/analysis/MostVisitedSitesDashboard";
import ImeiAnalysisDashboard from "../../components/analysis/ImeiAnalysisDashboard";
import OverlapMatrix from "../../components/analysis/OverlapMatrix";
import NetworkGraph from "../../components/analysis/NetworkGraph";

const MyAnalysis = () => {
  // State variables
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, analysis: null });
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Constants
  const analysisTypeLabels = {
    standard: "تحليل أسيا",
    z_format: "تحليل زين",
    comparison: "مقارنة الملفات"
  };

  const analysisTypeColors = {
    standard: "primary",
    z_format: "secondary", 
    comparison: "success"
  };

  // Helper functions
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatExpiryDays = (days) => {
    if (days <= 0) return "منتهي";
    if (days === 1) return "يوم واحد";
    if (days === 2) return "يومان";
    if (days <= 10) return `${days} أيام`;
    return `${days} يوم`;
  };

  const getExpiryColor = (days) => {
    if (days <= 0) return "error";
    if (days <= 3) return "warning";
    if (days <= 7) return "info";
    return "success";
  };

  const getFilteredAnalyses = () => {
    if (!searchTerm.trim()) return analyses;
    
    return analyses.filter(analysis => 
      analysis.display_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.sheet_owner_number && analysis.sheet_owner_number.includes(searchTerm))
    );
  };

  // تحديد التبويبات حسب نوع التحليل
  const getTabsForAnalysisType = (analysisType) => {
    const commonTab = { icon: <InfoIcon />, label: "نظرة عامة" };
    
    if (analysisType === "comparison" || analysisType.includes("مقارنة")) {
      return [
        commonTab,
        { icon: <NetworkIcon />, label: "الشبكة التفاعلية" }
      ];
    } else {
      return [
        commonTab,
        { icon: <AnalyticsIcon />, label: "المكالمات" },
        { icon: <PhoneIcon />, label: "تحليل IMEI" },
        { icon: <LocationIcon />, label: "المواقع" },
        { icon: <ScheduleIcon />, label: "الأوقات" },
        { icon: <TrendingUpIcon />, label: "خريطة الحركة" },
        { icon: <LocationIcon />, label: "خريطة المواقع" }
      ];
    }
  };

  // API functions
  const loadAnalyses = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const params = {
        page: page.toString(),
        per_page: "10"
      };

      if (selectedType) {
        params.type = selectedType;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log("جاري تحميل التحليلات مع المعاملات:", params);
      
      const response = await apiService.getUserAnalysisHistory(params);
      
      console.log("استجابة الخادم:", response);
      
      setAnalyses(response.results || []);
      setTotalPages(response.total_pages || 1);
      setTotalCount(response.total_count || 0);
      
    } catch (err) {
      console.error("خطأ في تحميل التحليلات:", err);
      setError("حدث خطأ في تحميل التحليلات: " + err.message);
      showSnackbar("فشل في تحميل التحليلات", "error");
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyses(false);
    showSnackbar("تم تحديث القائمة");
  };

  const handleViewAnalysis = async (analysis) => {
    try {
      console.log("جاري تحميل تفاصيل التحليل:", analysis.id);
      
      const response = await apiService.getAnalysisById(analysis.id);
      
      console.log("تفاصيل التحليل:", response);
      
      setSelectedAnalysis({
        ...analysis,
        fullResults: response
      });
      setPreviewDialog(true);
      setPreviewTab(0);
      
    } catch (err) {
      console.error("خطأ في تحميل تفاصيل التحليل:", err);
      setError("حدث خطأ في تحميل تفاصيل التحليل: " + err.message);
      showSnackbar("فشل في تحميل التفاصيل", "error");
    }
  };

  const handleDeleteAnalysis = async () => {
    try {
      console.log("جاري حذف التحليل:", deleteDialog.analysis.id);
      
      await apiService.deleteAnalysis(deleteDialog.analysis.id);
      
      console.log("تم حذف التحليل بنجاح");
      
      setDeleteDialog({ open: false, analysis: null });
      showSnackbar(`تم حذف "${deleteDialog.analysis.display_filename}" بنجاح`);
      
      // إعادة تحميل القائمة
      await loadAnalyses(false);
      
    } catch (err) {
      console.error("خطأ في حذف التحليل:", err);
      setError("حدث خطأ في حذف التحليل: " + err.message);
      showSnackbar("فشل في حذف التحليل", "error");
      setDeleteDialog({ open: false, analysis: null });
    }
  };

  // Preview content renderer - محسن لأنواع التحليل المختلفة
  const renderPreviewContent = () => {
    if (!selectedAnalysis?.fullResults) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <CircularProgress />
        </Box>
      );
    }

    const results = selectedAnalysis.fullResults;
    const analysisType = selectedAnalysis.analysis_type;
    const isComparison =
      analysisType === "comparison" || analysisType.includes("مقارنة");

    if (isComparison) {
      // للمقارنة - تبويبات مختلفة
      switch (previewTab) {
        case 0:
          // نظرة عامة للمقارنة
          return (
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <CompareIcon sx={{ mr: 1 }} />
                  معلومات المقارنة
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      نوع التحليل
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      مقارنة ملفات I2
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ الإنشاء
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(selectedAnalysis.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      انتهاء الصلاحية
                    </Typography>
                    <Chip
                      label={formatExpiryDays(
                        selectedAnalysis.days_until_expiry
                      )}
                      color={getExpiryColor(selectedAnalysis.days_until_expiry)}
                      size="small"
                    />
                  </Grid>
                  {/* البحث في البيانات الفعلية للمقارنة */}
                  {results.summary && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          عدد الملفات
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {results.summary.total_sheets ||
                            results.sheets?.length ||
                            0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          الأرقام المشتركة
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {results.summary.common_contacts ||
                            results.common_numbers?.length ||
                            0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          إجمالي الأرقام الفريدة
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          {results.summary.unique_contacts ||
                            results.total_unique_numbers ||
                            0}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {/* في حالة عدم وجود summary، ابحث في البيانات الخام */}
                  {!results.summary && results.sheets && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          عدد الملفات
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {results.sheets.length}
                        </Typography>
                      </Grid>
                      {results.common_numbers && (
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            الأرقام المشتركة
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {results.common_numbers.length}
                          </Typography>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          );

        case 1:
          // الشبكة التفاعلية للمقارنة
          console.log("Network data structure:", results);

          // البحث في مختلف هياكل البيانات المحتملة
          let networkData = null;

          if (results.network_analysis) {
            networkData = results.network_analysis;
          } else if (results.network_data) {
            networkData = results.network_data;
          } else if (results.graph_data) {
            networkData = results.graph_data;
          } else if (results.nodes && results.links) {
            networkData = { nodes: results.nodes, links: results.links };
          }

          if (networkData) {
            return <NetworkGraph data={networkData} />;
          } else {
            return (
              <Alert severity="warning">
                <Typography variant="body1" gutterBottom>
                  لا توجد بيانات شبكة متاحة
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  هيكل البيانات المتاح: {Object.keys(results).join(", ")}
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                  <Typography variant="caption" component="pre">
                    {JSON.stringify(results, null, 2).substring(0, 500)}...
                  </Typography>
                </Box>
              </Alert>
            );
          }

        default:
          return <Alert severity="error">تبويب غير صحيح</Alert>;
      }
    } else {
      // للتحليلات العادية (أسيا وزين)
      switch (previewTab) {
        case 0:
          // نظرة عامة - نفس الكود السابق
          return (
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <InfoIcon sx={{ mr: 1 }} />
                  معلومات التحليل
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      نوع التحليل
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {apiService.getAnalysisTypeLabel(
                        selectedAnalysis.analysis_type
                      ) || selectedAnalysis.analysis_type}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      رقم الشيت
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedAnalysis.sheet_owner_number || "غير محدد"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ الإنشاء
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(selectedAnalysis.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      انتهاء الصلاحية
                    </Typography>
                    <Chip
                      label={formatExpiryDays(
                        selectedAnalysis.days_until_expiry
                      )}
                      color={getExpiryColor(selectedAnalysis.days_until_expiry)}
                      size="small"
                    />
                  </Grid>
                  {results.filtered_calls && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        عدد المكالمات
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {results.filtered_calls.length?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                  )}
                  {results.most_visited_sites && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        عدد المواقع
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {results.most_visited_sites.length?.toLocaleString() ||
                          0}
                      </Typography>
                    </Grid>
                  )}
                  {results.imei_usage && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        أجهزة IMEI
                      </Typography>
                      <Typography variant="h6" color="secondary.main">
                        {Object.keys(results.imei_usage).length || 0}
                      </Typography>
                    </Grid>
                  )}
                  {results.analysis_info?.processing_time && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        وقت المعالجة
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {results.analysis_info.processing_time} ثانية
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          );

        case 1:
          // المكالمات المفلترة
          return results.filtered_calls ? (
            <DataTable
              data={results.filtered_calls}
              title="المكالمات المفلترة"
            />
          ) : (
            <Alert severity="info">لا توجد بيانات مكالمات متاحة</Alert>
          );

        case 2:
          // تحليل IMEI
          return results.imei_usage ? (
            <ImeiAnalysisDashboard
              imeiData={results.imei_usage}
              originalData={results.filtered_calls}
            />
          ) : (
            <Alert severity="info">لا توجد بيانات IMEI متاحة</Alert>
          );

        case 3:
          // أكثر المواقع زيارة - مع تشخيص مؤقت
          console.log("Sites data full:", results.most_visited_sites);

          if (
            results.most_visited_sites &&
            Array.isArray(results.most_visited_sites) &&
            results.most_visited_sites.length > 0
          ) {
            // تحويل البيانات للتنسيق المتوقع من المكون
            const normalizedSites = results.most_visited_sites.map((site) => ({
              // استخدم التنسيق الصحيح للمكون
              site_name:
                site.SITE_NAME || site.site_name || site.name || site.SITE_ID,
              site_id: site.SITE_ID || site.site_id,
              latitude: site.LAT || site.latitude || site.lat,
              longitude: site.LON || site.longitude || site.lon || site.long,
              city: site.CITY || site.city,
              visits: site.Number_of_Visits || site.visits || site.count || 1,
              // احتفظ بالبيانات الأصلية أيضاً
              ...site,
            }));

            console.log("Normalized sites:", normalizedSites.slice(0, 2));

            return <MostVisitedSitesDashboard sites={normalizedSites} />;
          }

          return (
            <Alert severity="info">
              <Typography variant="body1">
                لا توجد بيانات مواقع متاحة
              </Typography>
              <Typography variant="body2" color="text.secondary">
                عدد المواقع الخام: {results.most_visited_sites?.length || 0}
              </Typography>
            </Alert>
          );

        case 4:
          // تحليل الأوقات
          return results.time_analysis ? (
            <TimeAnalysisDashboard
              timeData={results.time_analysis}
              callPatterns={results.call_patterns}
              originalData={results.filtered_calls}
              isZFormat={
                selectedAnalysis.analysis_type.includes("z_format") ||
                selectedAnalysis.analysis_type.includes("زين")
              }
            />
          ) : (
            <Alert severity="info">لا توجد بيانات تحليل الوقت متاحة</Alert>
          );

        case 5:
          // خريطة الحركة
          return results.movement_analysis ? (
            <MovementMap movementData={results.movement_analysis} />
          ) : (
            <Alert severity="info">لا توجد بيانات حركة متاحة</Alert>
          );

        case 6:
          // خريطة المواقع
          if (
            results.most_visited_sites &&
            Array.isArray(results.most_visited_sites) &&
            results.most_visited_sites.length > 0
          ) {
            // تحويل البيانات للتنسيق المتوقع من SiteMap
            const mapSites = results.most_visited_sites.map((site) => ({
              ...site,
              // تأكد من وجود الحقول المطلوبة
              Site_ID: site.SITE_ID || site.site_id,
              Site_Name: site.SITE_NAME || site.site_name || site.name,
              SITE_NAME: site.SITE_NAME || site.site_name || site.name,
              LAT: site.LAT || site.latitude || site.lat,
              LON: site.LON || site.longitude || site.lon || site.long,
              Number_of_Visits:
                site.Number_of_Visits || site.visits || site.count || 1,
            }));

            console.log("Map sites data:", mapSites.slice(0, 2));

            return <SiteMap sites={mapSites} height="500px" />;
          } else {
            return <Alert severity="info">لا توجد بيانات خريطة متاحة</Alert>;
          }

        default:
          return <Alert severity="error">تبويب غير صحيح</Alert>;
      }
    }
  };


  // Effects
  useEffect(() => {
    loadAnalyses();
  }, [page, selectedType]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        loadAnalyses();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Loading state
  if (loading && analyses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          جاري تحميل التحليلات...
        </Typography>
      </Box>
    );
  }

  const filteredAnalyses = getFilteredAnalyses();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1, fontSize: 32 }} />
          تحليلاتي المحفوظة
        </Typography>
        <Typography variant="body1" color="text.secondary">
          تاريخ التحليلات المحفوظة مع إمكانية الوصول السريع والإدارة الشاملة
        </Typography>
      </Box>

      {/* إحصائيات سريعة */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: "primary.50" }}>
            <CardContent>
              <AnalyticsIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
              <Typography variant="h4" color="primary.main">
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                إجمالي التحليلات
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: "success.50" }}>
            <CardContent>
              <TrendingUpIcon sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {analyses.filter(a => a.days_until_expiry > 7).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                صالحة لأكثر من أسبوع
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: "warning.50" }}>
            <CardContent>
              <ScheduleIcon sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {analyses.filter(a => a.days_until_expiry <= 7 && a.days_until_expiry > 0).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                تنتهي خلال أسبوع
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: "error.50" }}>
            <CardContent>
              <TimeIcon sx={{ fontSize: 40, color: "error.main", mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {analyses.filter(a => a.days_until_expiry <= 0).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                منتهية الصلاحية
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* فلاتر البحث */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>نوع التحليل</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="نوع التحليل"
                >
                  <MenuItem value="">جميع الأنواع</MenuItem>
                  <MenuItem value="standard">تحليل أسيا</MenuItem>
                  <MenuItem value="z_format">تحليل زين</MenuItem>
                  <MenuItem value="comparison">مقارنة الملفات</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="البحث في أسماء الملفات أو أرقام الشيتات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                disabled={refreshing}
                fullWidth
              >
                {refreshing ? "جاري التحديث..." : "تحديث القائمة"}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {filteredAnalyses.length} من {totalCount}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* رسائل الخطأ */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* جدول التحليلات */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>اسم الملف</TableCell>
                <TableCell>نوع التحليل</TableCell>
                <TableCell>رقم الشيت</TableCell>
                <TableCell>تاريخ الإنشاء</TableCell>
                <TableCell>انتهاء الصلاحية</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAnalyses.map((analysis) => (
                <TableRow key={analysis.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {analysis.analysis_type === "comparison" || analysis.analysis_type.includes("مقارنة") ? 
                        <CompareIcon sx={{ mr: 1, color: "text.secondary" }} /> :
                        <FileIcon sx={{ mr: 1, color: "text.secondary" }} />
                      }
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {analysis.display_filename}
                        </Typography>
                        {analysis.version_number > 1 && (
                          <Chip 
                            size="small" 
                            label={`النسخة ${analysis.version_number}`}
                            color="info"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={apiService.getAnalysisTypeLabel(analysis.analysis_type) || analysis.analysis_type}
                      color={analysisTypeColors[analysis.analysis_type] || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {analysis.sheet_owner_number || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(analysis.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<TimeIcon />}
                      label={formatExpiryDays(analysis.days_until_expiry)}
                      color={getExpiryColor(analysis.days_until_expiry)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="معاينة">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewAnalysis(analysis)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, analysis })}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* حالة عدم وجود بيانات */}
        {filteredAnalyses.length === 0 && !loading && (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <HistoryIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد تحليلات محفوظة"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? `لم يتم العثور على تحليلات تحتوي على "${searchTerm}"`
                : "ابدأ بإجراء تحليل جديد لرؤية نتائجك هنا"
              }
            </Typography>
            {!searchTerm && (
              <Button 
                variant="contained" 
                onClick={() => navigate('/excel-analyzer')}
                sx={{ mr: 1 }}
              >
                تحليل جديد
               </Button>
            )}
          </Box>
        )}

        {/* ترقيم الصفحات */}
        {totalPages > 1 && (
          <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              disabled={loading}
              size={isMobile ? "small" : "medium"}
            />
          </Box>
        )}
      </Card>

      {/* نافذة المعاينة الكاملة */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              معاينة: {selectedAnalysis?.display_filename}
            </Typography>
            <IconButton onClick={() => setPreviewDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedAnalysis && (
            <Box sx={{ height: '100%' }}>
              {/* تبويبات المعاينة - ديناميكية حسب نوع التحليل */}
              <Tabs
                value={previewTab}
                onChange={(_, newValue) => setPreviewTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
              >
                {getTabsForAnalysisType(selectedAnalysis.analysis_type).map((tab, index) => (
                  <Tab key={index} icon={tab.icon} label={tab.label} />
                ))}
              </Tabs>

              {/* محتوى المعاينة */}
              <Box sx={{ p: 3, height: 'calc(100% - 60px)', overflow: 'auto' }}>
                {renderPreviewContent()}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewDialog(false)} size="large">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, analysis: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <DeleteIcon sx={{ mr: 1, color: "error.main" }} />
            تأكيد الحذف
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              هل أنت متأكد من حذف التحليل التالي؟
            </Typography>
            <Typography variant="h6" color="error.main">
              "{deleteDialog.analysis?.display_filename}"
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • سيتم حذف جميع النتائج والبيانات المرتبطة بهذا التحليل
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • هذا الإجراء لا يمكن التراجع عنه
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • قد تحتاج لإعادة التحليل من الملف الأصلي مرة أخرى
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false, analysis: null })}
            size="large"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleDeleteAnalysis} 
            color="error" 
            variant="contained"
            size="large"
            startIcon={<DeleteIcon />}
          >
            حذف نهائي
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar للإشعارات */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* إشعار التحديث التلقائي */}
      {refreshing && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 80, 
            right: 20, 
            zIndex: 1300,
            bgcolor: 'primary.main',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            boxShadow: 3
          }}
        >
          <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
          <Typography variant="body2">
            جاري تحديث القائمة...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MyAnalysis;