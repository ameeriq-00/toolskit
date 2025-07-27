import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  MyLocation as NearbyIcon,
} from "@mui/icons-material";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const SiteCoverageMap = ({ site, height = "500px", onFindNearby }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const nearbyLayersRef = useRef([]); // لتتبع طبقات الأبراج القريبة
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [nearbyAsiaVisible, setNearbyAsiaVisible] = useState(false);
  const [nearbyZainVisible, setNearbyZainVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Constants
  const COVERAGE_RADIUS_KM = 1; // 1 كيلومتر
  const COVERAGE_RADIUS_DEG = COVERAGE_RADIUS_KM / 111;

  // Calculate destination point
  const calculateDestinationPoint = (lat, lng, bearingDegrees, distanceKm) => {
    const R = 6371;
    const φ1 = (lat * Math.PI) / 180;
    const λ1 = (lng * Math.PI) / 180;
    const θ = (bearingDegrees * Math.PI) / 180;
    const δ = distanceKm / R;

    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );

    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
      );

    return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
  };

  // Draw military-style coverage triangle
  const drawMilitaryCoveragePattern = (
    map,
    centerLat,
    centerLng,
    azimuthDegrees
  ) => {
    const techColor = "#ff3333"; // أحمر عسكري

    // حساب نقاط المثلث
    const mainPoint = calculateDestinationPoint(
      centerLat,
      centerLng,
      azimuthDegrees,
      COVERAGE_RADIUS_KM
    );

    // زوايا أضيق للمثلث (45 درجة بدلاً من 60)
    const leftAngle = (azimuthDegrees - 22.5 + 360) % 360;
    const rightAngle = (azimuthDegrees + 22.5) % 360;

    const leftPoint = calculateDestinationPoint(
      centerLat,
      centerLng,
      leftAngle,
      COVERAGE_RADIUS_KM
    );

    const rightPoint = calculateDestinationPoint(
      centerLat,
      centerLng,
      rightAngle,
      COVERAGE_RADIUS_KM
    );

    // رسم المثلث الأحمر مع النقطة في المركز
    const trianglePoints = [
      [centerLat, centerLng], // نقطة البرج (قاعدة المثلث)
      leftPoint, // النقطة اليسرى
      mainPoint, // رأس المثلث (الاتجاه)
      rightPoint, // النقطة اليمنى
    ];

    // المثلث الرئيسي باللون الأحمر
    const coverageTriangle = L.polygon(trianglePoints, {
      color: techColor,
      weight: 3,
      opacity: 1,
      fillColor: techColor,
      fillOpacity: 0.4,
      dashArray: "8, 4",
    }).addTo(map);

    // خط الاتجاه الرئيسي
    const directionLine = L.polyline([[centerLat, centerLng], mainPoint], {
      color: techColor,
      weight: 4,
      opacity: 1,
      dashArray: "12, 8",
    }).addTo(map);

    // دائرة التغطية (1 كم)
    const coverageCircle = L.circle([centerLat, centerLng], {
      color: techColor,
      weight: 2,
      opacity: 0.6,
      fillColor: "transparent",
      radius: COVERAGE_RADIUS_KM * 1000,
      dashArray: "16, 8",
    }).addTo(map);

    // إضافة تسميات الاتجاه
    const directionMarker = L.marker(mainPoint, {
      icon: L.divIcon({
        html: `<div style="
          background: ${techColor}; 
          color: white; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 11px; 
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(255,51,51,0.4);
          border: 1px solid white;
        ">${azimuthDegrees}°</div>`,
        className: "direction-label",
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      }),
    }).addTo(map);

    // Tooltip للمثلث
    coverageTriangle.bindTooltip(
      `منطقة التغطية الرئيسية<br>الاتجاه: ${azimuthDegrees}°<br>المدى: ${COVERAGE_RADIUS_KM} كم`,
      { permanent: false }
    );

    return {
      triangle: coverageTriangle,
      circle: coverageCircle,
      line: directionLine,
    };
  };

  // Find nearby sites function
  const findNearbySites = async (siteType) => {
    if (!onFindNearby || !site) return;

    setLoading(true);
    try {
      console.log(`البحث عن الأبراج القريبة من نوع: ${siteType}`);

      const nearbySites = await onFindNearby(site, siteType);

      console.log(
        `تم العثور على ${nearbySites?.length || 0} أبراج قريبة:`,
        nearbySites
      );

      if (nearbySites && nearbySites.length > 0) {
        // مسح الأبراج القريبة السابقة
        clearNearbySites();

        // Add nearby sites to map
        addNearbySitesToMap(nearbySites, siteType);

        if (siteType === "asia") {
          setNearbyAsiaVisible(true);
          setNearbyZainVisible(false);
        } else {
          setNearbyZainVisible(true);
          setNearbyAsiaVisible(false);
        }
      } else {
        alert(
          `لم يتم العثور على أبراج ${
            siteType === "asia" ? "آسيا" : "زين"
          } قريبة`
        );
      }
    } catch (error) {
      console.error("Error finding nearby sites:", error);
      alert("حدث خطأ أثناء البحث عن الأبراج القريبة");
    } finally {
      setLoading(false);
    }
  };

  // Add nearby sites to map - مصحح لعرض أقرب برجين
  const addNearbySitesToMap = (nearbySites, siteType) => {
    if (!mapInstanceRef.current || !nearbySites || nearbySites.length === 0) {
      console.log("لا توجد خريطة أو أبراج لعرضها");
      return;
    }

    const map = mapInstanceRef.current;
    const color = siteType === "asia" ? "#00ff00" : "#0066ff"; // أخضر لآسيا، أزرق لزين
    const label = siteType === "asia" ? "آسيا" : "زين";

    console.log(`إضافة ${nearbySites.length} أبراج ${label} إلى الخريطة`);

    // إضافة كل الأبراج القريبة (حتى لو كان أكثر من 2)
    nearbySites.forEach((nearbySite, index) => {
      console.log(
        `إضافة البرج ${index + 1}: ${
          nearbySite.site_name
        } - المسافة: ${nearbySite.distance?.toFixed(2)} كم`
      );

      // حساب المسافة إذا لم تكن موجودة
      const distance =
        nearbySite.distance ||
        calculateDistance(
          site.coordinates.latitude,
          site.coordinates.longitude,
          nearbySite.coordinates.latitude,
          nearbySite.coordinates.longitude
        );

      // إنشاء أيقونة البرج القريب
      const nearbyIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            animation: nearbyPulse 2s infinite;
          ">${index + 1}</div>
          <style>
            @keyframes nearbyPulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          </style>
        `,
        className: `nearby-marker-${siteType}`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const nearbyMarker = L.marker(
        [nearbySite.coordinates.latitude, nearbySite.coordinates.longitude],
        { icon: nearbyIcon }
      ).addTo(map);

      // حفظ المارker في المرجع للحذف لاحقاً
      nearbyLayersRef.current.push(nearbyMarker);

      // Popup للبرج القريب
      const popupContent = `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: ${color}; text-align: center;">
            🎯 ${label} ${index + 1} - ${nearbySite.site_name}
          </h4>
          <div style="line-height: 1.6; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px;">
            <p style="margin: 4px 0;"><strong>🏗️ رقم البرج:</strong> ${
              nearbySite.site_id
            }</p>
            <p style="margin: 4px 0;"><strong>⚡ التقنية:</strong> 
              <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                ${nearbySite.technology}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>📏 المسافة:</strong> ${distance.toFixed(
              2
            )} كم</p>
            <p style="margin: 4px 0;"><strong>🏙️ المدينة:</strong> ${
              nearbySite.city
            }</p>
          </div>
        </div>
      `;

      nearbyMarker.bindPopup(popupContent, { maxWidth: 300 });

      // رسم خط اتصال للبرج القريب
      const connectionLine = L.polyline(
        [
          [site.coordinates.latitude, site.coordinates.longitude],
          [nearbySite.coordinates.latitude, nearbySite.coordinates.longitude],
        ],
        {
          color: color,
          weight: 3,
          opacity: 0.8,
          dashArray: "10, 10",
        }
      ).addTo(map);

      // حفظ الخط في المرجع للحذف لاحقاً
      nearbyLayersRef.current.push(connectionLine);

      // إضافة تسمية المسافة في منتصف الخط
      const midPoint = [
        (site.coordinates.latitude + nearbySite.coordinates.latitude) / 2,
        (site.coordinates.longitude + nearbySite.coordinates.longitude) / 2,
      ];

      const distanceLabel = L.marker(midPoint, {
        icon: L.divIcon({
          html: `<div style="
            background: white; 
            color: ${color}; 
            padding: 3px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: bold;
            border: 2px solid ${color};
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">${distance.toFixed(1)} كم</div>`,
          className: `distance-label-${siteType}`,
          iconSize: [50, 20],
          iconAnchor: [25, 10],
        }),
      }).addTo(map);

      // حفظ تسمية المسافة في المرجع للحذف لاحقاً
      nearbyLayersRef.current.push(distanceLabel);
    });

    console.log(
      `تم إضافة ${nearbySites.length} أبراج ${label} بنجاح إلى الخريطة`
    );
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Clear nearby sites - مُحسن لحذف جميع الطبقات
  const clearNearbySites = () => {
    if (mapInstanceRef.current && nearbyLayersRef.current.length > 0) {
      console.log(
        `حذف ${nearbyLayersRef.current.length} طبقة من الأبراج القريبة`
      );

      // حذف جميع الطبقات المحفوظة
      nearbyLayersRef.current.forEach((layer) => {
        try {
          mapInstanceRef.current.removeLayer(layer);
        } catch (error) {
          console.warn("خطأ في حذف طبقة:", error);
        }
      });

      // تنظيف المرجع
      nearbyLayersRef.current = [];
    }

    setNearbyAsiaVisible(false);
    setNearbyZainVisible(false);
    console.log("تم مسح جميع الأبراج القريبة من الخريطة");
  };

  // Initialize map
  useEffect(() => {
    if (!site || !site.coordinates || !mapRef.current) return;

    const { latitude, longitude } = site.coordinates;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Clear container
    if (mapRef.current) {
      mapRef.current.innerHTML = "";
    }

    // Clear nearby layers reference
    nearbyLayersRef.current = [];

    try {
      // Create the map
      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Satellite tile layer
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri",
          maxZoom: 18,
        }
      ).addTo(map);

      // Create tower icon (red military style)
      const towerIcon = L.divIcon({
        html: `
          <div style="
            background-color: #ff3333;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            animation: militaryPulse 2s infinite;
          ">
            📡
          </div>
          <style>
            @keyframes militaryPulse {
              0% { transform: scale(1); box-shadow: 0 3px 10px rgba(255,51,51,0.7); }
              50% { transform: scale(1.1); box-shadow: 0 3px 15px rgba(255,51,51,1); }
              100% { transform: scale(1); box-shadow: 0 3px 10px rgba(255,51,51,0.7); }
            }
          </style>
        `,
        className: "tower-marker",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // Add tower marker
      const towerMarker = L.marker([latitude, longitude], {
        icon: towerIcon,
      }).addTo(map);

      // Get azimuth
      let azimuth = site.technical_info?.azimuth;
      if (azimuth === null || azimuth === undefined || isNaN(azimuth)) {
        azimuth = 0;
      }

      // Popup content
      const popupContent = `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; min-width: 250px;">
          <h4 style="margin: 0 0 10px 0; color: #ff3333; text-align: center; border-bottom: 2px solid #ff3333; padding-bottom: 5px;">
            🎯 ${site.site_name}
          </h4>
          <div style="line-height: 1.6; background: rgba(255,51,51,0.1); padding: 10px; border-radius: 5px;">
            <p style="margin: 4px 0;"><strong>🏗️ رقم البرج:</strong> ${
              site.site_id
            }</p>
            <p style="margin: 4px 0;"><strong>📱 رقم الخلية:</strong> ${
              site.cell_id || "غير محدد"
            }</p>
            <p style="margin: 4px 0;"><strong>⚡ التقنية:</strong> 
              <span style="background: #ff3333; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                ${site.technology}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>🏙️ المدينة:</strong> ${
              site.city
            }</p>
            <p style="margin: 4px 0;"><strong>🧭 الاتجاه:</strong> ${azimuth}°</p>
            <p style="margin: 4px 0;"><strong>📡 نطاق التغطية:</strong> ${COVERAGE_RADIUS_KM} كم</p>
          </div>
        </div>
      `;

      towerMarker.bindPopup(popupContent, { maxWidth: 350 });

      // Draw military coverage pattern
      drawMilitaryCoveragePattern(map, latitude, longitude, azimuth);

      // Fit bounds
      const coverageBounds = L.latLngBounds([
        [latitude - COVERAGE_RADIUS_DEG, longitude - COVERAGE_RADIUS_DEG],
        [latitude + COVERAGE_RADIUS_DEG, longitude + COVERAGE_RADIUS_DEG],
      ]);
      map.fitBounds(coverageBounds.pad(0.1));
    } catch (error) {
      console.error("Error initializing coverage map:", error);
    }
  }, [site, isFullScreen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      nearbyLayersRef.current = [];
    };
  }, []);

  if (!site || !site.coordinates) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          border: "2px dashed #ddd",
          borderRadius: "8px",
        }}
      >
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>📡</div>
          <div>لا توجد بيانات موقع متاحة</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Control buttons */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Button
          variant={nearbyAsiaVisible ? "contained" : "outlined"}
          color="success"
          onClick={() =>
            nearbyAsiaVisible ? clearNearbySites() : findNearbySites("asia")
          }
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <NearbyIcon />}
          size="small"
        >
          {nearbyAsiaVisible ? "إخفاء آسيا" : "أقرب برجين آسيا"}
        </Button>

        <Button
          variant={nearbyZainVisible ? "contained" : "outlined"}
          color="info"
          onClick={() =>
            nearbyZainVisible ? clearNearbySites() : findNearbySites("zain")
          }
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <NearbyIcon />}
          size="small"
        >
          {nearbyZainVisible ? "إخفاء زين" : "أقرب برجين زين"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => setIsFullScreen(true)}
          startIcon={<FullscreenIcon />}
          size="small"
        >
          ملء الشاشة
        </Button>

        {(nearbyAsiaVisible || nearbyZainVisible) && (
          <Button
            variant="outlined"
            color="warning"
            onClick={clearNearbySites}
            size="small"
          >
            مسح الكل
          </Button>
        )}
      </Box>

      {/* Loading indicator */}
      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              جاري البحث عن الأبراج القريبة...
            </Typography>
          </Box>
        </Alert>
      )}

      <div
        ref={mapRef}
        style={{
          height: isFullScreen ? "80vh" : height,
          width: "100%",
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default SiteCoverageMap;