import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Map as MapIcon,
  LocationOn as LocationIcon,
  CellTower as TowerIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import axios from "axios";
import SiteCoverageMap from "./SiteCoverageMap";

const SiteSearchComponent = () => {
  // State for search mode
  const [searchMode, setSearchMode] = useState("simplified");

  // State للبحث المبسط
  const [simplifiedParams, setSimplifiedParams] = useState({
    site_id: "",
    sector: "",
    format_type: "ALL",
  });
  const [showAllSectors, setShowAllSectors] = useState(true);

  // State للبحث المتقدم
  const [advancedParams, setAdvancedParams] = useState({
    format_type: "ALL",
    site_id: "",
    sector: "",
    site_name: "",
    cell_name: "",
    city: "",
  });
  const [quickSearchKeyword, setQuickSearchKeyword] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);

  // State للنتائج
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalFound, setTotalFound] = useState(0);
  const [searchInfo, setSearchInfo] = useState(null);

  // State للخريطة
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  // State للإحصائيات
  const [statistics, setStatistics] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);

  // تحميل البيانات الأولية
  useEffect(() => {
    fetchStatistics();
    fetchAvailableCities();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/sites/statistics/",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error);
    }
  };

  const fetchAvailableCities = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/sites/cities/",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setAvailableCities(response.data.cities);
      }
    } catch (error) {
      console.error("خطأ في جلب المدن:", error);
    }
  };

  // البحث المبسط
  const handleSimplifiedInputChange = (field, value) => {
    setSimplifiedParams((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "sector" && value.trim()) {
      setShowAllSectors(false);
    } else if (field === "sector" && !value.trim()) {
      setShowAllSectors(true);
    }
  };

  const performSimplifiedSearch = async () => {
    if (!simplifiedParams.site_id.trim()) {
      setError("يرجى إدخال رقم البرج");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const searchData = {
        site_id: simplifiedParams.site_id.trim(),
        format_type: simplifiedParams.format_type,
      };

      if (!showAllSectors && simplifiedParams.sector.trim()) {
        searchData.sector = simplifiedParams.sector.trim();
      }

      const response = await axios.post(
        "http://localhost:8000/api/sites/simplified-search/",
        searchData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.data.results || []);
        setTotalFound(response.data.data.total_found || 0);
        setSearchInfo(response.data.data.search_info);
      } else {
        setError(response.data.error || "لم يتم العثور على نتائج");
        setSearchResults([]);
        setTotalFound(0);
        setSearchInfo(null);
      }
    } catch (error) {
      setError(error.response?.data?.error || "خطأ في البحث");
      setSearchResults([]);
      setTotalFound(0);
      setSearchInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // البحث المتقدم
  const handleAdvancedInputChange = (field, value) => {
    setAdvancedParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const performAdvancedSearch = async () => {
    if (
      !advancedParams.site_id &&
      !advancedParams.site_name &&
      !advancedParams.cell_name
    ) {
      setError(
        "يجب إدخال واحد على الأقل من: رقم البرج، اسم البرج، أو اسم الخلية"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8000/api/sites/search/",
        advancedParams,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.data.results || []);
        setTotalFound(response.data.data.total_found || 0);
        setSearchInfo(response.data.data.search_info);
      } else {
        setError(response.data.error || "لم يتم العثور على نتائج");
        setSearchResults([]);
        setTotalFound(0);
        setSearchInfo(null);
      }
    } catch (error) {
      setError(error.response?.data?.error || "خطأ في البحث");
      setSearchResults([]);
      setTotalFound(0);
      setSearchInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const performQuickSearch = async () => {
    if (!quickSearchKeyword.trim()) {
      setError("يرجى إدخال كلمة مفتاحية للبحث");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8000/api/sites/quick-search/",
        {
          keyword: quickSearchKeyword,
          format_type: advancedParams.format_type,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.data.results || []);
        setTotalFound(response.data.data.total_found || 0);
        setSearchInfo(response.data.data.search_info);
      } else {
        setError(response.data.error || "لم يتم العثور على نتائج");
        setSearchResults([]);
        setTotalFound(0);
        setSearchInfo(null);
      }
    } catch (error) {
      setError(error.response?.data?.error || "خطأ في البحث السريع");
      setSearchResults([]);
      setTotalFound(0);
      setSearchInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSimplifiedParams({
      site_id: "",
      sector: "",
      format_type: "ALL",
    });
    setAdvancedParams({
      format_type: "ALL",
      site_id: "",
      sector: "",
      site_name: "",
      cell_name: "",
      city: "",
    });
    setQuickSearchKeyword("");
    setSearchResults([]);
    setError("");
    setTotalFound(0);
    setSearchInfo(null);
    setShowAllSectors(true);
  };

  const getTechnologyColor = (technology) => {
    const colors = {
      "2G": "#f44336",
      "3G": "#ff9800",
      "4G": "#4caf50",
      Z_Format: "#2196f3",
    };
    return colors[technology] || "#757575";
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "success";
    if (confidence >= 0.8) return "warning";
    return "error";
  };

  const handleMapOpen = (site) => {
    setSelectedSite(site);
    setMapDialogOpen(true);
  };

  const handleMapClose = () => {
    setMapDialogOpen(false);
    setSelectedSite(null);
  };

  const renderStatisticsCard = () => {
    if (!statistics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TowerIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            إحصائيات قواعد البيانات
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(statistics.statistics || {}).map(
              ([tech, count]) => (
                <Grid item xs={6} sm={3} key={tech}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={getTechnologyColor(tech)}>
                      {count.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {tech === "Z_Format" ? "Z Format" : tech}
                    </Typography>
                  </Box>
                </Grid>
              )
            )}
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {statistics.total_sites?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  إجمالي الأبراج
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderSearchModeSelector = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          اختر نوع البحث
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value)}
          >
            <FormControlLabel
              value="simplified"
              control={<Radio />}
              label="البحث المبسط (رقم البرج + السكتر)"
            />
            <FormControlLabel
              value="advanced"
              control={<Radio />}
              label="البحث المتقدم (خيارات متعددة)"
            />
          </RadioGroup>
        </FormControl>
      </CardContent>
    </Card>
  );

  const renderSimplifiedSearch = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SearchIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">بحث مبسط بالبرج والسكتر</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>طريقة البحث:</strong>
            <br />
            • أدخل رقم البرج فقط للحصول على جميع السكتورات
            <br />
            • أدخل رقم البرج + السكتر للحصول على نتيجة محددة
            <br />• مثال: SUL3874 أو SUL3874 + B2
          </Typography>
        </Alert>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="رقم البرج *"
              value={simplifiedParams.site_id}
              onChange={(e) =>
                handleSimplifiedInputChange("site_id", e.target.value)
              }
              placeholder="SUL3874, ANB0001, ..."
              helperText="مطلوب"
              error={!simplifiedParams.site_id && error}
              onKeyPress={(e) => e.key === "Enter" && performSimplifiedSearch()}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="السكتر"
              value={simplifiedParams.sector}
              onChange={(e) =>
                handleSimplifiedInputChange("sector", e.target.value)
              }
              placeholder="B2, A1, 1, ..."
              helperText={showAllSectors ? "جميع السكتورات" : "سكتر محدد"}
              disabled={showAllSectors}
              onKeyPress={(e) => e.key === "Enter" && performSimplifiedSearch()}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>نوع التقنية</InputLabel>
              <Select
                value={simplifiedParams.format_type}
                onChange={(e) =>
                  handleSimplifiedInputChange("format_type", e.target.value)
                }
                label="نوع التقنية"
              >
                <MenuItem value="ALL">جميع التقنيات</MenuItem>
                <MenuItem value="2G">2G فقط</MenuItem>
                <MenuItem value="3G">3G فقط</MenuItem>
                <MenuItem value="4G">4G فقط</MenuItem>
                <MenuItem value="Z">Z Format فقط</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAllSectors}
                  onChange={(e) => {
                    setShowAllSectors(e.target.checked);
                    if (e.target.checked) {
                      setSimplifiedParams((prev) => ({ ...prev, sector: "" }));
                    }
                  }}
                />
              }
              label="جميع السكتورات"
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={performSimplifiedSearch}
                disabled={loading || !simplifiedParams.site_id.trim()}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SearchIcon />
                }
              >
                بحث
              </Button>
              <IconButton onClick={clearSearch} color="secondary">
                <ClearIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAdvancedSearch = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SearchIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">البحث المتقدم</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                />
              }
              label="البحث المتقدم بالخيارات"
            />
          </Grid>
        </Grid>

        {!advancedMode ? (
          // بحث سريع
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="بحث سريع"
                value={quickSearchKeyword}
                onChange={(e) => setQuickSearchKeyword(e.target.value)}
                placeholder="رقم البرج، اسم البرج، أو اسم الخلية"
                onKeyPress={(e) => e.key === "Enter" && performQuickSearch()}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>نوع التقنية</InputLabel>
                <Select
                  value={advancedParams.format_type}
                  onChange={(e) =>
                    handleAdvancedInputChange("format_type", e.target.value)
                  }
                  label="نوع التقنية"
                >
                  <MenuItem value="ALL">جميع التقنيات</MenuItem>
                  <MenuItem value="2G">2G فقط</MenuItem>
                  <MenuItem value="3G">3G فقط</MenuItem>
                  <MenuItem value="4G">4G فقط</MenuItem>
                  <MenuItem value="Z">Z Format فقط</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={performQuickSearch}
                disabled={loading || !quickSearchKeyword.trim()}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SearchIcon />
                }
              >
                بحث سريع
              </Button>
            </Grid>
          </Grid>
        ) : (
          // بحث متقدم
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>نوع التقنية</InputLabel>
                  <Select
                    value={advancedParams.format_type}
                    onChange={(e) =>
                      handleAdvancedInputChange("format_type", e.target.value)
                    }
                    label="نوع التقنية"
                  >
                    <MenuItem value="ALL">جميع التقنيات</MenuItem>
                    <MenuItem value="2G">2G فقط</MenuItem>
                    <MenuItem value="3G">3G فقط</MenuItem>
                    <MenuItem value="4G">4G فقط</MenuItem>
                    <MenuItem value="Z">Z Format فقط</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="رقم البرج"
                  value={advancedParams.site_id}
                  onChange={(e) =>
                    handleAdvancedInputChange("site_id", e.target.value)
                  }
                  placeholder="ANB0001"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="السكتر"
                  value={advancedParams.sector}
                  onChange={(e) =>
                    handleAdvancedInputChange("sector", e.target.value)
                  }
                  placeholder="1, A1, B2"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="اسم البرج"
                  value={advancedParams.site_name}
                  onChange={(e) =>
                    handleAdvancedInputChange("site_name", e.target.value)
                  }
                  placeholder="Alzawayah"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="اسم الخلية"
                  value={advancedParams.cell_name}
                  onChange={(e) =>
                    handleAdvancedInputChange("cell_name", e.target.value)
                  }
                  placeholder="U9_zawayah_ANB0001-A1"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>المدينة</InputLabel>
                  <Select
                    value={advancedParams.city}
                    onChange={(e) =>
                      handleAdvancedInputChange("city", e.target.value)
                    }
                    label="المدينة"
                  >
                    <MenuItem value="">جميع المدن</MenuItem>
                    {availableCities.map((city) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={performAdvancedSearch}
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={20} /> : <SearchIcon />
                  }
                >
                  بحث متقدم
                </Button>
              </Grid>
            </Grid>
          </>
        )}

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={clearSearch}
            color="secondary"
            startIcon={<ClearIcon />}
          >
            مسح جميع الحقول
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderSearchInfo = () => {
    if (!searchInfo) return null;

    return (
      <Card sx={{ mb: 2, bgcolor: "primary.light" }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="body2" color="primary.contrastText">
            <strong>تم البحث عن:</strong>{" "}
            {searchInfo.site_id && `رقم البرج: ${searchInfo.site_id}`}
            {searchInfo.sector && ` - السكتر: ${searchInfo.sector}`}
            {` - التقنية: ${searchInfo.format_type}`}
            {searchInfo.search_type &&
              ` - نوع البحث: ${
                searchInfo.search_type === "exact_sector"
                  ? "سكتر محدد"
                  : "جميع السكتورات"
              }`}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderResultsTable = () => {
    if (!searchResults.length && !loading) return null;

    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">نتائج البحث ({totalFound})</Typography>
            {totalFound > 0 && (
              <Chip
                label={`${totalFound} نتيجة`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    التقنية
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    رقم البرج
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    رقم الخلية
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    اسم البرج
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    اسم الخلية
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    المدينة
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    الثقة
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    العمليات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map((site, index) => (
                  <TableRow
                    key={`${site.technology}-${site.id}`}
                    sx={{
                      backgroundColor:
                        index % 2 === 0 ? "action.hover" : "background.paper",
                      "&:hover": {
                        backgroundColor: "action.selected",
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={site.technology}
                        size="small"
                        sx={{
                          bgcolor: getTechnologyColor(site.technology),
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: "medium" }}>
                      {site.site_id}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {site.cell_id}
                    </TableCell>
                    <TableCell>{site.site_name}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={site.cell_name}
                    >
                      {site.cell_name}
                    </TableCell>
                    <TableCell>{site.city}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${Math.round(site.match_confidence * 100)}%`}
                        size="small"
                        color={getConfidenceColor(site.match_confidence)}
                        variant={
                          site.match_confidence >= 0.9 ? "filled" : "outlined"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          title="عرض على الخريطة"
                          onClick={() => handleMapOpen(site)}
                        >
                          <MapIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          title="فتح في Google Maps"
                          onClick={() => {
                            const { latitude, longitude } = site.coordinates;
                            window.open(
                              `https://maps.google.com/maps?q=${latitude},${longitude}`,
                              "_blank"
                            );
                          }}
                        >
                          <LocationIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ملخص النتائج */}
          {searchResults.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                ملخص النتائج:
              </Typography>
              <Grid container spacing={2}>
                {["2G", "3G", "4G", "Z_Format"].map((tech) => {
                  const count = searchResults.filter(
                    (site) => site.technology === tech
                  ).length;
                  if (count === 0) return null;
                  return (
                    <Grid item key={tech}>
                      <Chip
                        label={`${tech}: ${count}`}
                        size="small"
                        sx={{
                          bgcolor: getTechnologyColor(tech),
                          color: "white",
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderMapDialog = () => (
    <Dialog
      open={mapDialogOpen}
      onClose={handleMapClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            موقع البرج: {selectedSite?.site_name}
          </Typography>
          <IconButton onClick={handleMapClose} color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedSite && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>التقنية:</strong> {selectedSite.technology} |{" "}
                <strong>رقم البرج:</strong> {selectedSite.site_id} |{" "}
                <strong>رقم الخلية:</strong> {selectedSite.cell_id}
              </Typography>
            </Box>
            <SiteCoverageMap sites={[selectedSite]} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleMapClose}>إغلاق</Button>
        <Button
          onClick={() => {
            const { latitude, longitude } = selectedSite.coordinates;
            window.open(
              `https://maps.google.com/maps?q=${latitude},${longitude}`,
              "_blank"
            );
          }}
          color="primary"
        >
          فتح في Google Maps
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderEmptyState = () => {
    if (loading || searchResults.length > 0 || error) return null;

    return (
      <Card sx={{ textAlign: "center", py: 4 }}>
        <CardContent>
          <TowerIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            ابدأ البحث عن الأبراج
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {searchMode === "simplified"
              ? "أدخل رقم البرج في الحقل أعلاه للبحث في جميع التقنيات"
              : "استخدم البحث السريع أو البحث المتقدم للعثور على الأبراج"}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        <TowerIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        بحث معلومات الأبراج
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        ابحث عن معلومات الأبراج في جميع التقنيات (2G, 3G, 4G, Z Format)
      </Typography>

      {renderStatisticsCard()}
      {renderSearchModeSelector()}

      {/* عرض البحث المبسط أو المتقدم حسب الاختيار */}
      {searchMode === "simplified"
        ? renderSimplifiedSearch()
        : renderAdvancedSearch()}

      {renderSearchInfo()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>خطأ:</strong> {error}
          </Typography>
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2, alignSelf: "center" }}>
            جاري البحث...
          </Typography>
        </Box>
      )}

      {renderResultsTable()}
      {renderEmptyState()}
      {renderMapDialog()}
    </Container>
  );
};

export default SiteSearchComponent;
