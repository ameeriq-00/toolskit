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
  Switch,
  FormControlLabel,
  Divider,
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
  // State للبحث
  const [searchInput, setSearchInput] = useState("");
  const [sectorInput, setSectorInput] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("ALL");
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);

  // State للبحث المتقدم
  const [advancedParams, setAdvancedParams] = useState({
    site_name: "",
    cell_name: "",
    city: "",
  });

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

  const performSearch = async () => {
    if (!searchInput.trim()) {
      setError("يرجى إدخال رقم البرج أو معلومات البحث");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let response;

      if (!useAdvancedSearch) {
        // البحث المبسط
        const searchData = {
          site_id: searchInput.trim(),
          format_type: technologyFilter,
        };

        // إضافة السكتر إذا كان موجوداً
        if (sectorInput.trim()) {
          searchData.sector = sectorInput.trim();
        }

        response = await axios.post(
          "http://localhost:8000/api/sites/simplified-search/",
          searchData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        // البحث المتقدم
        const searchData = {
          format_type: technologyFilter,
          site_id: searchInput.trim(),
          sector: sectorInput.trim() || undefined,
          site_name: advancedParams.site_name.trim() || undefined,
          cell_name: advancedParams.cell_name.trim() || undefined,
          city: advancedParams.city || undefined,
        };

        response = await axios.post(
          "http://localhost:8000/api/sites/search/",
          searchData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

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

  const clearSearch = () => {
    setSearchInput("");
    setSectorInput("");
    setTechnologyFilter("ALL");
    setAdvancedParams({
      site_name: "",
      cell_name: "",
      city: "",
    });
    setSearchResults([]);
    setError("");
    setTotalFound(0);
    setSearchInfo(null);
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

  const renderSearchHelp = () => (
    <Alert severity="info" sx={{ mb: 3 }}>
      <Typography variant="body2">
        <strong>أمثلة البحث المدعومة:</strong>
        <br />• <code>2199</code> - جميع سكتورات البرج 2199
        <br />• <code>21997</code> - البرج 2199 السكتر 7
        <br />• <code>BAG2199</code> - البرج 2199 مع الكود
        <br />• <code>2199-A3</code> - البرج 2199 السكتر A3
        <br />• <strong>ملاحظة:</strong> الحروف (A1, B2, C3) موجودة فقط في تقنية
        3G
      </Typography>
    </Alert>
  );

  const renderSearchForm = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SearchIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">البحث في الأبراج - النظام الجديد</Typography>
        </Box>

        {renderSearchHelp()}

        {/* خيار التبديل بين البحث البسيط والمتقدم */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useAdvancedSearch}
                onChange={(e) => setUseAdvancedSearch(e.target.checked)}
              />
            }
            label="استخدام البحث المتقدم"
          />
        </Box>

        {/* البحث الأساسي */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="رقم البرج *"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="2199, BAG2199, 21997..."
              helperText="مطلوب"
              error={!searchInput && error}
              onKeyPress={(e) => e.key === "Enter" && performSearch()}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="السكتر"
              value={sectorInput}
              onChange={(e) => setSectorInput(e.target.value)}
              placeholder="A3, B2, 7..."
              helperText="اختياري"
              onKeyPress={(e) => e.key === "Enter" && performSearch()}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>التقنية</InputLabel>
              <Select
                value={technologyFilter}
                onChange={(e) => setTechnologyFilter(e.target.value)}
                label="التقنية"
              >
                <MenuItem value="ALL">الكل</MenuItem>
                <MenuItem value="2G">2G</MenuItem>
                <MenuItem value="3G">3G</MenuItem>
                <MenuItem value="4G">4G</MenuItem>
                <MenuItem value="Z">Z Format</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={performSearch}
                disabled={loading || !searchInput.trim()}
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

        {/* البحث المتقدم */}
        {useAdvancedSearch && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom>
              خيارات البحث المتقدم
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="اسم البرج"
                  value={advancedParams.site_name}
                  onChange={(e) =>
                    setAdvancedParams({
                      ...advancedParams,
                      site_name: e.target.value,
                    })
                  }
                  placeholder="Salhiya, Mansour..."
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="اسم الخلية"
                  value={advancedParams.cell_name}
                  onChange={(e) =>
                    setAdvancedParams({
                      ...advancedParams,
                      cell_name: e.target.value,
                    })
                  }
                  placeholder="U9_Salhiya_BAG2199-A3"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>المدينة</InputLabel>
                  <Select
                    value={advancedParams.city}
                    onChange={(e) =>
                      setAdvancedParams({
                        ...advancedParams,
                        city: e.target.value,
                      })
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
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderSearchInfo = () => {
    if (!searchInfo) return null;

    return (
      <Card sx={{ mb: 2, bgcolor: "primary.light" }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="body2" color="primary.contrastText">
            <strong>تفاصيل البحث:</strong>{" "}
            {searchInfo.original_input &&
              `المدخل: "${searchInfo.original_input}"`}
            {searchInfo.parsed_site && ` - البرج: ${searchInfo.parsed_site}`}
            {searchInfo.parsed_sector &&
              ` - السكتر: ${searchInfo.parsed_sector}`}
            {` - التقنية: ${searchInfo.format_type}`}
            {searchInfo.search_type &&
              ` - النوع: ${
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
                    نوع المطابقة
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
                        label={site.match_type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    </TableCell>
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
                <strong>رقم الخلية:</strong> {selectedSite.cell_id} |{" "}
                <strong>نوع المطابقة:</strong> {selectedSite.match_type} |{" "}
                <strong>الثقة:</strong>{" "}
                {Math.round(selectedSite.match_confidence * 100)}%
              </Typography>
            </Box>
            <SiteCoverageMap site={selectedSite} />
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
            أدخل رقم البرج في الحقل أعلاه للبحث في جميع التقنيات
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mt: 1, display: "block" }}
          >
            النظام الجديد يدعم البحث الذكي مع دقة عالية
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        <TowerIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        بحث معلومات الأبراج - النظام المحدث
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        نظام البحث الجديد يدعم التعرف الذكي على أنماط الترقيم لجميع التقنيات
      </Typography>

      {renderStatisticsCard()}
      {renderSearchForm()}
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
            جاري البحث باستخدام النظام الجديد...
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