import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
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
  MyLocation as NearbyIcon,
} from "@mui/icons-material";
import { useSiteSearch } from "../../hooks/useApi";
import { TECH_COLORS } from "../../utils/constants";
import SiteCoverageMap from "../../components/analysis/SiteCoverageMap";
import apiService from "../../services/api";

const TowerSearch = () => {
  const [searchInput, setSearchInput] = useState("");
  const [sectorInput, setSectorInput] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("ALL");
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);
  const [advancedParams, setAdvancedParams] = useState({
    site_name: "",
    cell_name: "",
    city: "",
  });
  const [searchResults, setSearchResults] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [searchInfo, setSearchInfo] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const { loading, error, searchSites, getStatistics } = useSiteSearch();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const statsResult = await getStatistics();
    if (statsResult.success) {
      setStatistics(statsResult.data);
    }
    // Mock cities data for now
    setAvailableCities(["بغداد", "البصرة", "الموصل", "أربيل", "كركوك"]);
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      alert("يرجى إدخال رقم البرج أو معلومات البحث");
      return;
    }

    const searchData = {
      site_id: searchInput.trim(),
      format_type: technologyFilter,
      ...(sectorInput.trim() && { sector: sectorInput.trim() }),
      ...(useAdvancedSearch && {
        ...(advancedParams.site_name.trim() && {
          site_name: advancedParams.site_name.trim(),
        }),
        ...(advancedParams.cell_name.trim() && {
          cell_name: advancedParams.cell_name.trim(),
        }),
        ...(advancedParams.city && { city: advancedParams.city }),
      }),
    };

    const result = await searchSites(searchData);
    if (result.success) {
      setSearchResults(result.data.data?.results || []);
      setTotalFound(result.data.data?.total_found || 0);
      setSearchInfo(result.data.data?.search_info);
    } else {
      setSearchResults([]);
      setTotalFound(0);
      setSearchInfo(null);
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSectorInput("");
    setTechnologyFilter("ALL");
    setAdvancedParams({ site_name: "", cell_name: "", city: "" });
    setSearchResults([]);
    setTotalFound(0);
    setSearchInfo(null);
  };

  const getTechnologyColor = (technology) => {
    return TECH_COLORS[technology] || "#757575";
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

  // دالة البحث عن الأبراج القريبة - NEW FEATURE
  const handleFindNearby = async (site, siteType) => {
    try {
      console.log("البحث عن الأبراج القريبة...", { site, siteType });

      // تحضير بيانات البرج للبحث
      const siteData = {
        site_id: site.site_id,
        site_name: site.site_name,
        technology: site.technology,
        coordinates: site.coordinates,
      };

      let result;
      if (siteType === "asia") {
        result = await apiService.findNearbyAsiaSites(siteData, 2);
      } else if (siteType === "zain") {
        result = await apiService.findNearbyZainSites(siteData, 2);
      }

      if (result && result.success) {
        return result.data.nearby_sites || [];
      } else {
        console.error("فشل في البحث عن الأبراج القريبة:", result?.error);
        return [];
      }
    } catch (error) {
      console.error("خطأ في البحث عن الأبراج القريبة:", error);
      return [];
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <TowerIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          بحث معلومات الأبراج
        </Typography>
        <Typography variant="body1" color="text.secondary">
          نظام البحث المتقدم يدعم التعرف الذكي على أنماط الترقيم لجميع التقنيات
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
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
      )}

      {/* Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SearchIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            البحث في الأبراج
          </Typography>

          {/* Search Help */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>أمثلة البحث المدعومة:</strong>
              <br />• <code>2199</code> - جميع سكتورات البرج 2199
              <br />• <code>21997</code> - البرج 2199 السكتر 7
              <br />• <code>BAG2199</code> - البرج 2199 مع الكود
              <br />• <code>2199-A3</code> - البرج 2199 السكتر A3
            </Typography>
          </Alert>

          {/* Advanced Search Toggle */}
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

          {/* Basic Search */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="رقم البرج *"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="2199, BAG2199..."
                helperText="مطلوب"
                error={!searchInput && !!error}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
                  onClick={handleSearch}
                  disabled={loading || !searchInput.trim()}
                  startIcon={<SearchIcon />}
                >
                  بحث
                </Button>
                <IconButton onClick={clearSearch} color="secondary">
                  <ClearIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          {/* Advanced Search Options */}
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

      {/* Search Info */}
      {searchInfo && (
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
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>خطأ:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Results Table */}
      {searchResults.length > 0 && (
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
              <Typography variant="h6">نتائج البحث</Typography>
              <Chip
                label={`${totalFound} نتيجة`}
                color="primary"
                variant="outlined"
              />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>التقنية</TableCell>
                    <TableCell>رقم البرج</TableCell>
                    <TableCell>رقم الخلية</TableCell>
                    <TableCell>اسم البرج</TableCell>
                    <TableCell>اسم الخلية</TableCell>
                    <TableCell>المدينة</TableCell>
                    <TableCell>نوع المطابقة</TableCell>
                    <TableCell>الثقة</TableCell>
                    <TableCell>العمليات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((site, index) => (
                    <TableRow key={`${site.technology}-${site.id}`}>
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

            {/* Results Summary */}
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
      )}

      {/* Empty State */}
      {!loading && searchResults.length === 0 && !error && (
        <Card sx={{ textAlign: "center", py: 4 }}>
          <CardContent>
            <TowerIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              ابدأ البحث عن الأبراج
            </Typography>
            <Typography variant="body2" color="textSecondary">
              أدخل رقم البرج في الحقل أعلاه للبحث في جميع التقنيات
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Map Dialog with Enhanced Coverage Map */}
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
              🎯 موقع البرج: {selectedSite?.site_name}
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
              {/* استخدام الخريطة المحدثة مع دعم الأبراج القريبة */}
              <SiteCoverageMap
                site={selectedSite}
                height="500px"
                onFindNearby={handleFindNearby}
              />
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
    </Box>
  );
};

export default TowerSearch;