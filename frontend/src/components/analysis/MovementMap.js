// frontend/src/components/analysis/MovementMap.js
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  DateRange as DateRangeIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const MovementMap = ({ movementData }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState("daily");
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed] = useState(2000);
  const [mapKey, setMapKey] = useState(0);

  const periodsData =
    viewMode === "daily"
      ? movementData?.daily_movements
      : movementData?.weekly_movements;

  const periods = periodsData?.days || periodsData?.weeks || [];
  const currentPeriodMovements = periods[currentPeriodIndex]
    ? periodsData.movements[periods[currentPeriodIndex]]
    : null;

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("Map cleanup:", e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!currentPeriodMovements || !mapRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn("Map removal:", e);
      }
      mapInstanceRef.current = null;
    }

    const timeoutId = setTimeout(() => {
      if (!mapRef.current) return;

      mapRef.current.innerHTML = "";

      try {
        const getMapCenter = () => {
          if (!currentPeriodMovements.locations?.length) {
            return [33.3152, 44.3661];
          }
          return [
            currentPeriodMovements.locations[0].lat,
            currentPeriodMovements.locations[0].lon,
          ];
        };

        const map = L.map(mapRef.current, {
          center: getMapCenter(),
          zoom: 13,
          zoomControl: true,
          preferCanvas: true,
        });

        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        const createCustomIcon = (color, size = 12) => {
          return L.divIcon({
            html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
            className: "custom-icon",
            iconSize: [size + 4, size + 4],
            iconAnchor: [(size + 4) / 2, (size + 4) / 2],
          });
        };

        if (
          currentPeriodMovements.movements &&
          Array.isArray(currentPeriodMovements.movements)
        ) {
          currentPeriodMovements.movements.forEach((movement) => {
            L.polyline(
              [
                [movement.from_site.lat, movement.from_site.lon],
                [movement.to_site.lat, movement.to_site.lon],
              ],
              {
                color: "#2196f3",
                weight: 3,
                opacity: 0.8,
                dashArray: "10, 10",
              }
            ).addTo(map);

            const fromMarker = L.marker(
              [movement.from_site.lat, movement.from_site.lon],
              { icon: createCustomIcon("#4CAF50", 14) }
            ).addTo(map);

            const toMarker = L.marker(
              [movement.to_site.lat, movement.to_site.lon],
              { icon: createCustomIcon("#f44336", 14) }
            ).addTo(map);

            fromMarker.bindPopup(`
              <div style="min-width: 200px;">
                <strong>📍 ${movement.from_site.name}</strong><br>
                <span style="color: #666;">الموقع: ${
                  movement.from_site.id
                }</span><br>
                <span style="color: #666;">⏰ ${
                  movement.timestamp || "غير محدد"
                }</span>
              </div>
            `);

            toMarker.bindPopup(`
              <div style="min-width: 200px;">
                <strong>🎯 ${movement.to_site.name}</strong><br>
                <span style="color: #666;">الموقع: ${movement.to_site.id}</span><br>
                <span style="color: #2196f3;">📏 المسافة: ${movement.distance} كم</span>
              </div>
            `);
          });

          if (currentPeriodMovements.locations?.length > 0) {
            try {
              const bounds = L.latLngBounds(
                currentPeriodMovements.locations.map((loc) => [
                  loc.lat,
                  loc.lon,
                ])
              );
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            } catch (e) {
              console.warn("Fit bounds:", e);
            }
          }
        }
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentPeriodMovements, mapKey, isFullScreen]);

  useEffect(() => {
    let interval;
    if (isPlaying && periods.length > 0) {
      interval = setInterval(() => {
        setCurrentPeriodIndex((prev) =>
          prev === periods.length - 1 ? 0 : prev + 1
        );
      }, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, periods.length, playbackSpeed]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentPeriodIndex(0);
    setMapKey((prev) => prev + 1);
  }, [viewMode]);

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handlePeriodChange = (event) => {
    setCurrentPeriodIndex(event.target.value);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentPeriodIndex < periods.length - 1) {
      setCurrentPeriodIndex((prev) => prev + 1);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentPeriodIndex > 0) {
      setCurrentPeriodIndex((prev) => prev - 1);
      setIsPlaying(false);
    }
  };

  const getDateRangeForWeek = (weekStr) => {
    try {
      if (!weekStr || typeof weekStr !== "string") {
        return "أسبوع غير صالح";
      }

      const matches = weekStr.match(/(\d{4})-W(\d{1,2})/);
      if (!matches || matches.length < 3) {
        return weekStr;
      }

      const year = parseInt(matches[1]);
      const weekNum = parseInt(matches[2]);

      if (
        isNaN(year) ||
        isNaN(weekNum) ||
        year < 1900 ||
        year > 2100 ||
        weekNum < 1 ||
        weekNum > 53
      ) {
        return weekStr;
      }

      const firstDayOfYear = new Date(year, 0, 1);
      const daysToAdd = (weekNum - 1) * 7;
      const weekStart = new Date(firstDayOfYear);
      weekStart.setDate(firstDayOfYear.getDate() + daysToAdd);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return `${weekStart.toLocaleDateString(
        "ar-IQ"
      )} - ${weekEnd.toLocaleDateString("ar-IQ")}`;
    } catch (error) {
      console.error("Date range error:", error);
      return "خطأ في التاريخ";
    }
  };

  const toggleFullScreen = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn("Fullscreen cleanup:", e);
      }
      mapInstanceRef.current = null;
    }

    setIsFullScreen(!isFullScreen);
    setTimeout(() => {
      setMapKey((prev) => prev + 1);
    }, 300);
  };

  const formatPeriodLabel = (period, index) => {
    if (viewMode === "weekly") {
      return `الأسبوع ${index + 1}: ${getDateRangeForWeek(period)}`;
    } else {
      try {
        const date = new Date(period);
        return `اليوم ${index + 1}: ${date.toLocaleDateString("ar-IQ", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`;
      } catch (e) {
        return `اليوم ${index + 1}: ${period}`;
      }
    }
  };

  if (!movementData) {
    return (
      <Box
        sx={{
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed #333",
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h6" color="text.secondary">
          لا توجد بيانات تنقل متاحة
        </Typography>
      </Box>
    );
  }

  if (!periods || periods.length === 0) {
    return (
      <Box
        sx={{
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed #333",
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h6" color="text.secondary">
          لا توجد فترات زمنية متاحة للعرض
        </Typography>
      </Box>
    );
  }

  const renderStats = () => {
    if (!currentPeriodMovements) return null;

    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: "background.default" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                إجمالي التنقلات
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#2196f3" }}
              >
                {currentPeriodMovements.total_movements || 0}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                المسافة الإجمالية
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#4CAF50" }}
              >
                {currentPeriodMovements.total_distance || 0} كم
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                المواقع الفريدة
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#FF9800" }}
              >
                {currentPeriodMovements.locations?.length || 0}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                الفترة الحالية
              </Typography>
              <Chip
                icon={<CalendarIcon />}
                label={
                  formatPeriodLabel(
                    periods[currentPeriodIndex],
                    currentPeriodIndex
                  ).split(": ")[1]
                }
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, fontWeight: "bold" }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const MapContent = () => (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      {renderStats()}

      <div
        ref={mapRef}
        key={mapKey}
        style={{
          height: isFullScreen ? "70vh" : "500px",
          width: "100%",
          borderRadius: 8,
        }}
      />

      <Paper sx={{ p: 2, mt: 2, bgcolor: "background.paper" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="daily">
              <EventIcon sx={{ mr: 1 }} />
              يومي
            </ToggleButton>
            <ToggleButton value="weekly">
              <DateRangeIcon sx={{ mr: 1 }} />
              أسبوعي
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={currentPeriodIndex === 0}
              size="small"
            >
              <SkipPreviousIcon />
              السابق
            </Button>
            <Button
              variant={isPlaying ? "contained" : "outlined"}
              onClick={togglePlayback}
              size="small"
              color={isPlaying ? "error" : "primary"}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              {isPlaying ? "إيقاف" : "تشغيل"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleNext}
              disabled={currentPeriodIndex === periods.length - 1}
              size="small"
            >
              التالي
              <SkipNextIcon />
            </Button>
          </Box>

          <Button
            variant="contained"
            onClick={toggleFullScreen}
            sx={{ ml: "auto" }}
            size="small"
          >
            {isFullScreen ? (
              <>
                <FullscreenExitIcon sx={{ mr: 1 }} />
                تصغير
              </>
            ) : (
              <>
                <FullscreenIcon sx={{ mr: 1 }} />
                ملء الشاشة
              </>
            )}
          </Button>
        </Box>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>اختر الفترة الزمنية</InputLabel>
          <Select
            value={currentPeriodIndex}
            onChange={handlePeriodChange}
            label="اختر الفترة الزمنية"
            MenuProps={{ PaperProps: { style: { maxHeight: 400 } } }}
          >
            {periods.map((period, index) => (
              <MenuItem key={index} value={index}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <Typography>{formatPeriodLabel(period, index)}</Typography>
                  {periodsData.movements[period] && (
                    <Chip
                      size="small"
                      label={`${
                        periodsData.movements[period].total_movements || 0
                      } تنقل`}
                      color={
                        index === currentPeriodIndex ? "primary" : "default"
                      }
                      sx={{ ml: 2 }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          sx={{ mt: 2, p: 1.5, bgcolor: "background.default", borderRadius: 1 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            💡 <strong>نصيحة:</strong> استخدم القائمة المنسدلة للانتقال مباشرة
            لأي يوم.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            🗺️ انقر على العلامات لمشاهدة التفاصيل.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      {!isFullScreen && <MapContent />}

      <Dialog fullScreen open={isFullScreen} onClose={toggleFullScreen}>
        <DialogContent sx={{ p: 2, bgcolor: "background.default" }}>
          <MapContent />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MovementMap;
