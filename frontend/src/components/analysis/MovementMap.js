import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Paper,
  Grid,
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
} from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
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

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!currentPeriodMovements || !mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Clear the container
    mapRef.current.innerHTML = "";

    try {
      // Get center coordinates
      const getMapCenter = () => {
        if (!currentPeriodMovements.locations.length) {
          return [33.3152, 44.3661]; // Default to Baghdad
        }
        return [
          currentPeriodMovements.locations[0].lat,
          currentPeriodMovements.locations[0].lon,
        ];
      };

      // Create new map
      const map = L.map(mapRef.current, {
        center: getMapCenter(),
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Arrow options for movement lines
      const arrowOptions = {
        color: "#2196f3",
        weight: 3,
        opacity: 0.8,
        dashArray: "10, 10",
      };

      // Create custom icons
      const createCustomIcon = (color, size = 12) => {
        return L.divIcon({
          html: `<div style="
            background-color: ${color}; 
            width: ${size}px; 
            height: ${size}px; 
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
          "></div>`,
          className: "custom-icon",
          iconSize: [size + 4, size + 4],
          iconAnchor: [(size + 4) / 2, (size + 4) / 2],
        });
      };

      // Render movements
      if (currentPeriodMovements.movements) {
        currentPeriodMovements.movements.forEach((movement, index) => {
          // Add movement line
          const polyline = L.polyline(
            [
              [movement.from_site.lat, movement.from_site.lon],
              [movement.to_site.lat, movement.to_site.lon],
            ],
            arrowOptions
          ).addTo(map);

          // Add markers
          const fromMarker = L.marker(
            [movement.from_site.lat, movement.from_site.lon],
            { icon: createCustomIcon("#4CAF50") }
          ).addTo(map);

          const toMarker = L.marker(
            [movement.to_site.lat, movement.to_site.lon],
            { icon: createCustomIcon("#f44336") }
          ).addTo(map);

          // Add popups
          fromMarker.bindPopup(`
            <div>
              <strong>${movement.from_site.name}</strong><br>
              الوقت: ${movement.timestamp || "غير محدد"}
            </div>
          `);

          toMarker.bindPopup(`
            <div>
              <strong>${movement.to_site.name}</strong><br>
              الوجهة
            </div>
          `);
        });
      }
    } catch (error) {
      console.error("Error initializing movement map:", error);
    }
  }, [currentPeriodMovements, mapKey, isFullScreen]);

  // Playback effect
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

  // Reset when view mode changes
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

  const handleSliderChange = (event, newValue) => {
    setCurrentPeriodIndex(newValue);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentPeriodIndex < periods.length - 1) {
      setCurrentPeriodIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPeriodIndex > 0) {
      setCurrentPeriodIndex((prev) => prev - 1);
    }
  };

  const getDateRangeForWeek = (weekStr) => {
    const matches = weekStr.match(/(\d{4})-W(\d{1,2})/);
    if (!matches) return "Invalid Week";

    const year = parseInt(matches[1]);
    const weekNum = parseInt(matches[2]);
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (weekNum - 1) * 7;
    const weekStart = new Date(firstDayOfYear);
    weekStart.setDate(firstDayOfYear.getDate() + daysToAdd);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return `${weekStart.toLocaleDateString(
      "ar-IQ"
    )} - ${weekEnd.toLocaleDateString("ar-IQ")}`;
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    setTimeout(() => {
      setMapKey((prev) => prev + 1);
    }, 100);
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

  const renderStats = () => {
    if (!currentPeriodMovements) return null;

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">إجمالي التنقلات</Typography>
            <Typography variant="h6">
              {currentPeriodMovements.total_movements || 0}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">المسافة الإجمالية</Typography>
            <Typography variant="h6">
              {currentPeriodMovements.total_distance || 0} كم
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">المواقع الفريدة</Typography>
            <Typography variant="h6">
              {currentPeriodMovements.locations?.length || 0}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">الفترة الحالية</Typography>
            <Typography variant="h6">
              {viewMode === "weekly"
                ? getDateRangeForWeek(periods[currentPeriodIndex])
                : new Date(periods[currentPeriodIndex]).toLocaleDateString(
                    "ar-IQ"
                  )}
            </Typography>
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
          height: isFullScreen ? "80vh" : "500px",
          width: "100%",
          borderRadius: 8,
        }}
      />

      <Box sx={{ p: 2, bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{ mr: 2 }}
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

          <Button
            onClick={handlePrevious}
            disabled={currentPeriodIndex === 0}
            sx={{ mr: 1 }}
          >
            <SkipPreviousIcon />
          </Button>
          <Button onClick={togglePlayback} sx={{ mr: 1 }}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentPeriodIndex === periods.length - 1}
          >
            <SkipNextIcon />
          </Button>

          <Button
            variant="contained"
            onClick={toggleFullScreen}
            sx={{ ml: "auto" }}
          >
            {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </Button>
        </Box>

        <Slider
          value={currentPeriodIndex}
          onChange={handleSliderChange}
          min={0}
          max={Math.max(0, periods.length - 1)}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) =>
            viewMode === "weekly"
              ? getDateRangeForWeek(periods[value])
              : new Date(periods[value]).toLocaleDateString("ar-IQ")
          }
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      {!isFullScreen && <MapContent />}

      <Dialog fullScreen open={isFullScreen} onClose={toggleFullScreen}>
        <DialogContent sx={{ p: 2 }}>
          <MapContent />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MovementMap;
