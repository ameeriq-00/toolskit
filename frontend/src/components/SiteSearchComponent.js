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
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Map as MapIcon,
  CellTower as TowerIcon,
} from "@mui/icons-material";
import axios from "axios";

const SiteSearchComponent = () => {
  // State للبحث
  const [searchParams, setSearchParams] = useState({
    format_type: "ALL",
    site_id: "",
    sector: "",
    site_name: "",
    cell_name: "",
    city: "",
  });

  // State للنتائج
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalFound, setTotalFound] = useState(0);

  // State للإعدادات المتقدمة
  const [advancedMode, setAdvancedMode] = useState(false);
  const [quickSearchKeyword, setQuickSearchKeyword] = useState("");

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

  const handleInputChange = (field, value) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearSearch = () => {
    setSearchParams({
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
  };

  const performSearch = async () => {
    if (
      !searchParams.site_id &&
      !searchParams.site_name &&
      !searchParams.cell_name
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
        searchParams,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.data.results || []);
        setTotalFound(response.data.data.total_found || 0);
      } else {
        setError(response.data.error || "لم يتم العثور على نتائج");
        setSearchResults([]);
        setTotalFound(0);
      }
    } catch (error) {
      setError(error.response?.data?.error || "خطأ في البحث");
      setSearchResults([]);
      setTotalFound(0);
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
          format_type: searchParams.format_type,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.data.results || []);
        setTotalFound(response.data.data.total_found || 0);
      } else {
        setError(response.data.error || "لم يتم العثور على نتائج");
        setSearchResults([]);
        setTotalFound(0);
      }
    } catch (error) {
      setError(error.response?.data?.error || "خطأ في البحث السريع");
      setSearchResults([]);
      setTotalFound(0);
    } finally {
      setLoading(false);
    }
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
    if (confidence >= 0.8) return "success";
    if (confidence >= 0.6) return "warning";
    return "error";
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

  const renderSearchForm = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SearchIcon sx={{ mr: 1 }} />
          <Typography variant="h6">بحث الأبراج</Typography>
          <Box sx={{ ml: "auto" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                />
              }
              label="البحث المتقدم"
            />
          </Box>
        </Box>

        {!advancedMode ? (
          // البحث السريع
          <Box>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              بحث سريع بكلمة مفتاحية واحدة
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع البحث</InputLabel>
                  <Select
                    value={searchParams.format_type}
                    onChange={(e) =>
                      handleInputChange("format_type", e.target.value)
                    }
                    label="نوع البحث"
                  >
                    <MenuItem value="ALL">جميع الأنواع</MenuItem>
                    <MenuItem value="2G">2G فقط</MenuItem>
                    <MenuItem value="3G">3G فقط</MenuItem>
                    <MenuItem value="4G">4G فقط</MenuItem>
                    <MenuItem value="Z">Z Format فقط</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="كلمة البحث (رقم البرج، اسم البرج، إلخ)"
                  value={quickSearchKeyword}
                  onChange={(e) => setQuickSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && performQuickSearch()}
                  placeholder="مثال: ANB0001 أو Alzawayah"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={performQuickSearch}
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={20} /> : <SearchIcon />
                    }
                    fullWidth
                  >
                    بحث
                  </Button>
                  <IconButton onClick={clearSearch} color="secondary">
                    <ClearIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // البحث المتقدم
          <Box>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              بحث متقدم مع خيارات متعددة
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع البحث</InputLabel>
                  <Select
                    value={searchParams.format_type}
                    onChange={(e) =>
                      handleInputChange("format_type", e.target.value)
                    }
                    label="نوع البحث"
                  >
                    <MenuItem value="ALL">الكل</MenuItem>
                    <MenuItem value="2G">2G</MenuItem>
                    <MenuItem value="3G">3G</MenuItem>
                    <MenuItem value="4G">4G</MenuItem>
                    <MenuItem value="Z">Z Format</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="رقم البرج"
                  value={searchParams.site_id}
                  onChange={(e) => handleInputChange("site_id", e.target.value)}
                  placeholder="ANB0001"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="رقم السكتر"
                  value={searchParams.sector}
                  onChange={(e) => handleInputChange("sector", e.target.value)}
                  placeholder="1"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="اسم البرج"
                  value={searchParams.site_name}
                  onChange={(e) =>
                    handleInputChange("site_name", e.target.value)
                  }
                  placeholder="Alzawayah"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>المدينة</InputLabel>
                  <Select
                    value={searchParams.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    label="المدينة"
                  >
                    <MenuItem value="">الكل</MenuItem>
                    {availableCities.map((city) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={performSearch}
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={20} /> : <SearchIcon />
                    }
                    fullWidth
                  >
                    بحث
                  </Button>
                  <IconButton onClick={clearSearch} color="secondary">
                    <ClearIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="اسم الخلية (اختياري)"
                  value={searchParams.cell_name}
                  onChange={(e) =>
                    handleInputChange("cell_name", e.target.value)
                  }
                  placeholder="U9_zawayah_ANB0001-A1"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    if (!searchResults.length && !loading) return null;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">نتائج البحث ({totalFound})</Typography>
          </Box>

          {searchResults.map((site, index) => (
            <Accordion key={`${site.technology}-${site.id}`} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <Chip
                    label={site.technology}
                    size="small"
                    sx={{
                      bgcolor: getTechnologyColor(site.technology),
                      color: "white",
                      mr: 2,
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {site.site_name}
                  </Typography>
                  <Chip
                    label={`${Math.round(site.match_confidence * 100)}%`}
                    size="small"
                    color={getConfidenceColor(site.match_confidence)}
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {site.site_id}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      معلومات أساسية
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>رقم البرج</TableCell>
                          <TableCell>{site.site_id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>رقم الخلية</TableCell>
                          <TableCell>{site.cell_id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>اسم الخلية</TableCell>
                          <TableCell>{site.cell_name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>المدينة</TableCell>
                          <TableCell>{site.city}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      الإحداثيات والمعلومات التقنية
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>خط العرض</TableCell>
                          <TableCell>{site.coordinates.latitude}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>خط الطول</TableCell>
                          <TableCell>{site.coordinates.longitude}</TableCell>
                        </TableRow>
                        {site.technical_info.azimuth && (
                          <TableRow>
                            <TableCell>الاتجاه</TableCell>
                            <TableCell>
                              {site.technical_info.azimuth}°
                            </TableCell>
                          </TableRow>
                        )}
                        {site.technical_info.antenna_height && (
                          <TableRow>
                            <TableCell>ارتفاع الهوائي</TableCell>
                            <TableCell>
                              {site.technical_info.antenna_height}م
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LocationIcon />}
                        onClick={() => {
                          const { latitude, longitude } = site.coordinates;
                          window.open(
                            `https://maps.google.com/maps?q=${latitude},${longitude}`,
                            "_blank"
                          );
                        }}
                      >
                        عرض على الخريطة
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<InfoIcon />}
                        onClick={() => {
                          // يمكن إضافة modal للتفاصيل الكاملة
                          console.log("تفاصيل كاملة:", site);
                        }}
                      >
                        تفاصيل كاملة
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
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
      {renderSearchForm()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {renderResults()}
    </Container>
  );
};

export default SiteSearchComponent;
