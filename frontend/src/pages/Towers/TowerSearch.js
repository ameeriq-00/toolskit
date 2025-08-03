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
  Collapse,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Map as MapIcon,
  LocationOn as LocationIcon,
  CellTower as TowerIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Analytics as StatsIcon,
} from "@mui/icons-material";
import { useSiteSearch } from "../../hooks/useApi";
import { TECH_COLORS } from "../../utils/constants";
import SiteCoverageMap from "../../components/analysis/SiteCoverageMap";
import apiService from "../../services/api";

const TowerSearch = () => {
  // ========== STATE MANAGEMENT ==========
  const [searchInput, setSearchInput] = useState("");
  const [sectorInput, setSectorInput] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("ALL");
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const [advancedParams, setAdvancedParams] = useState({
    site_name: "",
    cell_name: "",
    city: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [searchInfo, setSearchInfo] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [availableCities] = useState([
    "بغداد",
    "البصرة",
    "الموصل",
    "أربيل",
    "كركوك",
  ]);

  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const { loading, error, searchSites, getStatistics } = useSiteSearch();

  // ========== LIFECYCLE HOOKS ==========
  useEffect(() => {
    loadInitialData();
  }, []);

  // ========== DATA LOADING ==========
  const loadInitialData = async () => {
    try {
      const statsResult = await getStatistics();
      if (statsResult.success) {
        setStatistics(statsResult.data);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  // ========== SEARCH FUNCTIONS ==========
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      alert("يرجى إدخال رقم البرج أو معلومات البحث");
      return;
    }

    const searchData = {
      site_id: searchInput.trim(),
      format_type: technologyFilter,
      ...(sectorInput.trim() && { sector: sectorInput.trim() }),
      ...(useAdvancedSearch && buildAdvancedSearchParams()),
    };

    try {
      const result = await searchSites(searchData);
      if (result.success) {
        setSearchResults(result.data.data?.results || []);
        setTotalFound(result.data.data?.total_found || 0);
        setSearchInfo(result.data.data?.search_info);
      } else {
        resetSearchResults();
      }
    } catch (err) {
      console.error("Search error:", err);
      resetSearchResults();
    }
  };

  const buildAdvancedSearchParams = () => {
    const params = {};
    if (advancedParams.site_name.trim()) {
      params.site_name = advancedParams.site_name.trim();
    }
    if (advancedParams.cell_name.trim()) {
      params.cell_name = advancedParams.cell_name.trim();
    }
    if (advancedParams.city) {
      params.city = advancedParams.city;
    }
    return params;
  };

  const resetSearchResults = () => {
    setSearchResults([]);
    setTotalFound(0);
    setSearchInfo(null);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSectorInput("");
    setTechnologyFilter("ALL");
    setAdvancedParams({ site_name: "", cell_name: "", city: "" });
    resetSearchResults();
  };

  // ========== NEARBY SITES SEARCH ==========
  const handleFindNearby = async (site, siteType) => {
    try {
      console.log("🔍 البحث عن الأبراج القريبة...", { site, siteType });

      const siteData = {
        site_id: site.site_id,
        site_name: site.site_name,
        technology: site.technology,
        coordinates: {
          latitude: parseFloat(site.coordinates.latitude),
          longitude: parseFloat(site.coordinates.longitude),
        },
      };

      let result;
      if (siteType === "asia") {
        result = await apiService.findNearbyAsiaSites(siteData, 2);
      } else if (siteType === "zain") {
        result = await apiService.findNearbyZainSites(siteData, 2);
      }

      if (result?.success) {
        const nearbySites = result.data.nearby_sites || [];
        console.log(`🎯 تم العثور على ${nearbySites.length} أبراج قريبة`);
        return nearbySites.slice(0, 2);
      }

      console.warn("⚠️ لم يتم العثور على أي أبراج قريبة");
      return [];
    } catch (error) {
      console.error("💥 خطأ في البحث عن الأبراج القريبة:", error);
      return [];
    }
  };

  // ========== MAP FUNCTIONS ==========
  const handleMapOpen = (site) => {
    setSelectedSite(site);
    setMapDialogOpen(true);
  };

  const handleMapClose = () => {
    setMapDialogOpen(false);
    setSelectedSite(null);
  };

  // ========== UTILITY FUNCTIONS ==========
  const getTechnologyColor = (technology) => {
    return TECH_COLORS[technology] || "#757575";
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "success";
    if (confidence >= 0.8) return "warning";
    return "error";
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const openGoogleMaps = (site) => {
    const { latitude, longitude } = site.coordinates;
    window.open(
      `https://maps.google.com/maps?q=${latitude},${longitude}`,
      "_blank"
    );
  };

  // ========== RENDER COMPONENTS ==========
  const renderStatisticsCard = () => {
    if (!statistics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              إحصائيات قواعد البيانات
            </Typography>
            <IconButton
              onClick={() => setShowStats(!showStats)}
              sx={{ ml: "auto" }}
              size="small"
            >
              {showStats ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Box>

          <Collapse in={showStats}>
            <Grid container spacing={2}>
              {Object.entries(statistics.statistics || {}).map(
                ([tech, count]) => (
                  <Grid item xs={6} sm={2.4} key={tech}>
                    <Box
                      textAlign="center"
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: "black",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: getTechnologyColor(tech),
                          fontWeight: "bold",
                        }}
                      >
                        {count.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {tech === "Z_Format" ? "Z Format" : tech}
                      </Typography>
                    </Box>
                  </Grid>
                )
              )}
              <Grid item xs={12} sm={2.4}>
                <Box
                  textAlign="center"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "black",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {statistics.total_sites?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="white">
                    إجمالي الأبراج
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  const renderSearchForm = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          <SearchIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          البحث في الأبراج
        </Typography>

        {/* Search Help */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>أمثلة البحث المدعومة:</strong>
            <br />• 2199 - جميع سكتورات البرج 2199
            <br />• 21997 - البرج 2199 السكتر 7
            <br />• BAG2199 - البرج 2199 مع الكود
            <br />• 2199-A3 - البرج 2199 السكتر A3
          </Typography>
        </Alert>

        {/* Basic Search Fields */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="رقم البرج *"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="2199, BAG2199..."
              helperText="مطلوب"
              error={!searchInput && !!error}
              onKeyPress={handleKeyPress}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="السكتور"
              value={sectorInput}
              onChange={(e) => setSectorInput(e.target.value)}
              placeholder="A3, B2, 7..."
              helperText="اختياري"
              onKeyPress={handleKeyPress}
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

          <Grid item xs={12} sm={4}>
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
              <IconButton
                onClick={clearSearch}
                color="secondary"
                sx={{ minWidth: 48 }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Advanced Search Toggle */}
        <Box sx={{ mt: 3 }}>
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

        {/* Advanced Search Options */}
        <Collapse in={useAdvancedSearch}>
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle1" gutterBottom color="primary">
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
          </Box>
        </Collapse>
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
              ` - السكتور: ${searchInfo.parsed_sector}`}
            {` - التقنية: ${searchInfo.format_type}`}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderResultsTable = () => {
    if (searchResults.length === 0) return null;

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
                  <TableRow key={`${site.technology}-${site.id}-${index}`}>
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
                          onClick={() => openGoogleMaps(site)}
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
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              ملخص النتائج:
            </Typography>
            <Grid container spacing={1}>
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
        </CardContent>
      </Card>
    );
  };

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
            <Box sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>التقنية:</strong> {selectedSite.technology} |{" "}
                <strong>رقم البرج:</strong> {selectedSite.site_id} |{" "}
                <strong>رقم الخلية:</strong> {selectedSite.cell_id} |{" "}
                <strong>نوع المطابقة:</strong> {selectedSite.match_type} |{" "}
                <strong>الثقة:</strong>{" "}
                {Math.round(selectedSite.match_confidence * 100)}%
              </Typography>
            </Box>
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
          onClick={() => openGoogleMaps(selectedSite)}
          color="primary"
          variant="contained"
        >
          فتح في Google Maps
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ========== MAIN RENDER ==========
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

      {/* Statistics */}
      {renderStatisticsCard()}

      {/* Search Form */}
      {renderSearchForm()}

      {/* Search Info */}
      {renderSearchInfo()}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>خطأ:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Results Table */}
      {renderResultsTable()}

      {/* Empty State */}
      {renderEmptyState()}

      {/* Map Dialog */}
      {renderMapDialog()}
    </Box>
  );
};

export default TowerSearch;
