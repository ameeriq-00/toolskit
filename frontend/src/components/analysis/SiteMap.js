import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Dialog, DialogContent } from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from "@mui/icons-material";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const SiteMap = ({ sites, height = "600px" }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force re-render

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
    if (!sites || sites.length === 0 || !mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Clear the container
    mapRef.current.innerHTML = "";

    try {
      // Filter valid sites
      const validSites = sites.filter((site) => {
        const lat = parseFloat(site.LAT);
        const lon = parseFloat(site.LON);
        return (
          !isNaN(lat) &&
          !isNaN(lon) &&
          lat >= -90 &&
          lat <= 90 &&
          lon >= -180 &&
          lon <= 180
        );
      });

      if (validSites.length === 0) return;

      // Create new map
      const map = L.map(mapRef.current, {
        center: [parseFloat(validSites[0].LAT), parseFloat(validSites[0].LON)],
        zoom: 10,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Group sites by coordinates
      const groupedSites = validSites.reduce((acc, site) => {
        const lat = parseFloat(site.LAT);
        const lon = parseFloat(site.LON);
        const key = `${lat},${lon}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(site);
        return acc;
      }, {});

      // Create markers
      Object.entries(groupedSites).forEach(([coords, siteGroup], index) => {
        const [lat, lon] = coords.split(",").map(Number);
        const totalVisits = siteGroup.reduce(
          (sum, site) => sum + (site.Number_of_Visits || 0),
          0
        );

        // Create custom icon based on visit count
        const getMarkerColor = (visits) => {
          if (visits > 100) return "#ff0000";
          if (visits > 50) return "#ff8800";
          if (visits > 10) return "#ffff00";
          return "#00ff00";
        };

        const customIcon = L.divIcon({
          html: `<div style="
            background-color: ${getMarkerColor(totalVisits)};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: black;
            font-weight: bold;
            font-size: 10px;
          ">${totalVisits}</div>`,
          className: "custom-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h4>المواقع في هذا الموقع (${totalVisits} زيارة)</h4>
            ${siteGroup
              .map(
                (site) => `
              <div style="margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee;">
                <strong>${
                  site.Site_Name || site.SITE_NAME || "غير محدد"
                }</strong><br>
                معرف الموقع: ${site.Site_ID || site.SITE_ID}<br>
                عدد الزيارات: ${site.Number_of_Visits || 0}<br>
                الإحداثيات: ${site.LAT}, ${site.LON}
              </div>
            `
              )
              .join("")}
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });
      });

      // Fit map to show all markers
      if (validSites.length > 1) {
        const group = new L.featureGroup(
          Object.keys(groupedSites).map((coords) => {
            const [lat, lon] = coords.split(",").map(Number);
            return L.marker([lat, lon]);
          })
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [sites, mapKey, isFullScreen]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // Force map re-render after fullscreen toggle
    setTimeout(() => {
      setMapKey((prev) => prev + 1);
    }, 100);
  };

  if (!sites || sites.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed #333",
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h6" color="text.secondary">
          لا توجد بيانات موقع متاحة
        </Typography>
      </Box>
    );
  }

  const MapContent = () => (
    <Box sx={{ position: "relative", height: "100%" }}>
      <Button
        variant="contained"
        onClick={toggleFullScreen}
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          minWidth: "auto",
          p: 1,
        }}
      >
        {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </Button>

      <div
        ref={mapRef}
        key={mapKey}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 8,
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ height }}>
      {!isFullScreen && <MapContent />}

      <Dialog fullScreen open={isFullScreen} onClose={toggleFullScreen}>
        <DialogContent sx={{ p: 0, height: "100vh" }}>
          <MapContent />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SiteMap;
