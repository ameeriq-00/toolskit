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
  VisibilityOff as VisibilityOffIcon,
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
  const nearbyLayersRef = useRef([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [nearbyAsiaVisible, setNearbyAsiaVisible] = useState(false);
  const [nearbyZainVisible, setNearbyZainVisible] = useState(false);
  const [nearbyAsiaCount, setNearbyAsiaCount] = useState(0);
  const [nearbyZainCount, setNearbyZainCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Constants
  const COVERAGE_RADIUS_KM = 1;
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
    const techColor = "#ff3333";

    const mainPoint = calculateDestinationPoint(
      centerLat,
      centerLng,
      azimuthDegrees,
      COVERAGE_RADIUS_KM
    );

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

    const trianglePoints = [
      [centerLat, centerLng],
      leftPoint,
      mainPoint,
      rightPoint,
    ];

    const coverageTriangle = L.polygon(trianglePoints, {
      color: techColor,
      weight: 3,
      opacity: 1,
      fillColor: techColor,
      fillOpacity: 0.4,
      dashArray: "8, 4",
    }).addTo(map);

    const directionLine = L.polyline([[centerLat, centerLng], mainPoint], {
      color: techColor,
      weight: 4,
      opacity: 1,
      dashArray: "12, 8",
    }).addTo(map);

    const coverageCircle = L.circle([centerLat, centerLng], {
      color: techColor,
      weight: 2,
      opacity: 0.6,
      fillColor: "transparent",
      radius: COVERAGE_RADIUS_KM * 1000,
      dashArray: "16, 8",
    }).addTo(map);

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

  // Find nearby sites function - محسن لضمان عرض أقرب برجين
  const findNearbySites = async (siteType) => {
    if (!onFindNearby || !site) {
      console.error("❌ لا توجد دالة البحث أو بيانات البرج");
      return;
    }

    setLoading(true);
    try {
      console.log(`🔍 بدء البحث عن أقرب برجين من نوع: ${siteType}`);
      console.log("📍 بيانات البرج الحالي:", {
        id: site.site_id,
        name: site.site_name,
        tech: site.technology,
        coordinates: site.coordinates,
      });

      // طلب أقرب برجين صراحة
      const nearbySites = await onFindNearby(site, siteType);

      console.log(`📊 نتيجة البحث:`, {
        type: siteType,
        found: nearbySites?.length || 0,
        sites: nearbySites,
      });

      if (nearbySites && nearbySites.length > 0) {
        console.log(`✅ تم العثور على ${nearbySites.length} أبراج قريبة`);

        // طباعة تفاصيل كل برج
        nearbySites.forEach((nearbySite, index) => {
          console.log(`📌 البرج ${index + 1}:`, {
            name: nearbySite.site_name,
            id: nearbySite.site_id,
            technology: nearbySite.technology,
            distance: nearbySite.distance?.toFixed(2) + " كم",
            city: nearbySite.city,
          });
        });

        // مسح الأبراج القريبة السابقة
        clearNearbySites();

        // إضافة الأبراج الجديدة للخريطة
        addNearbySitesToMap(nearbySites, siteType);

        // تحديث حالة العرض
        if (siteType === "asia") {
          setNearbyAsiaVisible(true);
          setNearbyAsiaCount(nearbySites.length);
          setNearbyZainVisible(false);
          setNearbyZainCount(0);
          console.log(
            `🟢 تم تفعيل عرض أبراج آسيا (${nearbySites.length} أبراج)`
          );
        } else {
          setNearbyZainVisible(true);
          setNearbyZainCount(nearbySites.length);
          setNearbyAsiaVisible(false);
          setNearbyAsiaCount(0);
          console.log(
            `🔵 تم تفعيل عرض أبراج زين (${nearbySites.length} أبراج)`
          );
        }

        // عرض رسالة نجاح مع التفاصيل
        const message =
          `تم العثور على ${nearbySites.length} برج ${
            siteType === "asia" ? "آسيا" : "زين"
          } قريب:\n` +
          nearbySites
            .map(
              (s, i) =>
                `${i + 1}. ${s.site_name} (${s.distance?.toFixed(1)} كم)`
            )
            .join("\n");

        console.log(`🎉 ${message}`);
      } else {
        console.warn(
          `⚠️ لم يتم العثور على أبراج ${
            siteType === "asia" ? "آسيا" : "زين"
          } قريبة`
        );
        alert(
          `لم يتم العثور على أبراج ${
            siteType === "asia" ? "آسيا" : "زين"
          } قريبة من هذا الموقع`
        );
      }
    } catch (error) {
      console.error("💥 خطأ في البحث عن الأبراج القريبة:", error);
      alert("حدث خطأ أثناء البحث عن الأبراج القريبة. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
      console.log("🔄 انتهت عملية البحث");
    }
  };

  // Add nearby sites to map - محسن لعرض أقرب برجين بوضوح
  const addNearbySitesToMap = (nearbySites, siteType) => {
    if (!mapInstanceRef.current || !nearbySites || nearbySites.length === 0) {
      console.log("❌ لا توجد خريطة أو أبراج لعرضها");
      return;
    }

    const map = mapInstanceRef.current;
    const color = siteType === "asia" ? "#00ff00" : "#0066ff";
    const label = siteType === "asia" ? "آسيا" : "زين";

    console.log(
      `📍 بدء إضافة ${nearbySites.length} أبراج ${label} إلى الخريطة`
    );

    // التأكد من عرض أقرب برجين فقط
    const sitesToShow = nearbySites.slice(0, 2);
    console.log(
      `🎯 سيتم عرض ${sitesToShow.length} برج من أصل ${nearbySites.length}`
    );

    sitesToShow.forEach((nearbySite, index) => {
      const siteNumber = index + 1;
      console.log(`📌 معالجة البرج ${siteNumber}:`, {
        name: nearbySite.site_name,
        id: nearbySite.site_id,
        distance: nearbySite.distance?.toFixed(2) + " كم",
      });

      // حساب المسافة إذا لم تكن موجودة
      const distance =
        nearbySite.distance ||
        calculateDistance(
          site.coordinates.latitude,
          site.coordinates.longitude,
          nearbySite.coordinates.latitude,
          nearbySite.coordinates.longitude
        );

      // إنشاء أيقونة البرج القريب مع تصميم مميز لكل برج
      const nearbyIcon = L.divIcon({
        html: `
          <div style="
            background: linear-gradient(135deg, ${color}, ${color}dd);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            font-weight: bold;
            animation: nearbyPulse${siteNumber} 2s infinite;
            position: relative;
          ">${siteNumber}</div>
          
          <div style="
            position: absolute;
            top: 36px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            border: 1px solid white;
          ">${label} ${siteNumber}</div>
          
          <style>
            @keyframes nearbyPulse${siteNumber} {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
          </style>
        `,
        className: `nearby-marker-${siteType}-${siteNumber}`,
        iconSize: [38, 55],
        iconAnchor: [19, 19],
      });

      const nearbyMarker = L.marker(
        [nearbySite.coordinates.latitude, nearbySite.coordinates.longitude],
        { icon: nearbyIcon }
      ).addTo(map);

      // حفظ المارker في المرجع للحذف لاحقاً
      nearbyLayersRef.current.push(nearbyMarker);

      // Popup مفصل للبرج القريب
      const popupContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; min-width: 250px;">
          <h3 style="
            margin: 0 0 12px 0; 
            color: ${color}; 
            text-align: center; 
            border-bottom: 3px solid ${color}; 
            padding-bottom: 8px;
            background: linear-gradient(135deg, ${color}22, ${color}11);
            padding: 8px;
            border-radius: 6px 6px 0 0;
            margin: -12px -12px 12px -12px;
          ">
            🎯 ${label} ${siteNumber} - ${nearbySite.site_name}
          </h3>
          
          <div style="line-height: 1.8; padding: 0;">
            <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
              <p style="margin: 0; font-weight: bold; color: #333;">
                🏗️ رقم البرج: <span style="color: ${color};">${
        nearbySite.site_id
      }</span>
              </p>
            </div>
            
            <div style="background: #e9ecef; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
              <p style="margin: 0;">
                <strong>⚡ التقنية:</strong> 
                <span style="
                  background: ${color}; 
                  color: white; 
                  padding: 3px 8px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  font-weight: bold;
                  margin-right: 5px;
                ">${nearbySite.technology}</span>
              </p>
            </div>
            
            <div style="background: #fff3cd; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
              <p style="margin: 0;">
                <strong>📏 المسافة:</strong> 
                <span style="
                  background: #ff6b35; 
                  color: white; 
                  padding: 3px 8px; 
                  border-radius: 4px; 
                  font-weight: bold;
                  margin-right: 5px;
                ">${distance.toFixed(2)} كم</span>
              </p>
            </div>
            
            <div style="background: #d1ecf1; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
              <p style="margin: 0;"><strong>🏙️ المدينة:</strong> ${
                nearbySite.city
              }</p>
            </div>
            
            <div style="background: ${color}22; padding: 8px; border-radius: 4px; text-align: center;">
              <strong style="color: ${color};">🏆 الترتيب: البرج رقم ${siteNumber} ${
        siteNumber === 1 ? "(الأقرب)" : "(الثاني)"
      }</strong>
            </div>
          </div>
        </div>
      `;

      nearbyMarker.bindPopup(popupContent, {
        maxWidth: 350,
        closeButton: true,
        autoClose: false,
        closeOnClick: false,
      });

      // رسم خط اتصال للبرج القريب مع تأثيرات مختلفة
      const connectionLine = L.polyline(
        [
          [site.coordinates.latitude, site.coordinates.longitude],
          [nearbySite.coordinates.latitude, nearbySite.coordinates.longitude],
        ],
        {
          color: color,
          weight: siteNumber === 1 ? 5 : 4, // خط أسمك للبرج الأقرب
          opacity: siteNumber === 1 ? 0.9 : 0.7,
          dashArray: siteNumber === 1 ? "15, 5" : "8, 12", // أنماط مختلفة
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
            background: linear-gradient(135deg, white, #f8f9fa); 
            color: ${color}; 
            padding: 6px 10px; 
            border-radius: 8px; 
            font-size: 12px; 
            font-weight: bold;
            border: 2px solid ${color};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            white-space: nowrap;
            text-align: center;
          ">
            <div style="font-size: 10px; opacity: 0.8;">${label} ${siteNumber}</div>
            <div style="font-size: 13px; font-weight: bold;">${distance.toFixed(
              1
            )} كم</div>
            ${
              siteNumber === 1
                ? '<div style="font-size: 8px; color: #ff6b35;">الأقرب</div>'
                : ""
            }
          </div>`,
          className: `distance-label-${siteType}-${siteNumber}`,
          iconSize: [70, 35],
          iconAnchor: [35, 17],
        }),
      }).addTo(map);

      // حفظ تسمية المسافة في المرجع للحذف لاحقاً
      nearbyLayersRef.current.push(distanceLabel);

      console.log(
        `✅ تم إضافة البرج ${siteNumber} بنجاح: ${nearbySite.site_name}`
      );
    });

    console.log(
      `🎉 تم إضافة جميع الأبراج (${sitesToShow.length}) بنجاح إلى الخريطة`
    );

    // التكبير لإظهار جميع الأبراج
    if (sitesToShow.length > 0) {
      const group = new L.featureGroup([
        ...nearbyLayersRef.current.filter((layer) => layer instanceof L.Marker),
      ]);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
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

  // Clear nearby sites - محسن لحذف جميع الطبقات
  const clearNearbySites = () => {
    if (mapInstanceRef.current && nearbyLayersRef.current.length > 0) {
      console.log(
        `🧹 حذف ${nearbyLayersRef.current.length} طبقة من الأبراج القريبة`
      );

      nearbyLayersRef.current.forEach((layer) => {
        try {
          mapInstanceRef.current.removeLayer(layer);
        } catch (error) {
          console.warn("خطأ في حذف طبقة:", error);
        }
      });

      nearbyLayersRef.current = [];
    }

    setNearbyAsiaVisible(false);
    setNearbyZainVisible(false);
    setNearbyAsiaCount(0);
    setNearbyZainCount(0);
    console.log("✅ تم مسح جميع الأبراج القريبة من الخريطة");
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
          sx={{
            minWidth: 160,
            position: "relative",
            "&::after":
              nearbyAsiaVisible && nearbyAsiaCount > 0
                ? {
                    content: `"${nearbyAsiaCount}"`,
                    position: "absolute",
                    top: -8,
                    right: -8,
                    background: "#ff4444",
                    color: "white",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid white",
                  }
                : {},
          }}
        >
          {nearbyAsiaVisible
            ? `إخفاء آسيا (${nearbyAsiaCount})`
            : "أقرب برجين آسيا"}
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
          sx={{
            minWidth: 160,
            position: "relative",
            "&::after":
              nearbyZainVisible && nearbyZainCount > 0
                ? {
                    content: `"${nearbyZainCount}"`,
                    position: "absolute",
                    top: -8,
                    right: -8,
                    background: "#ff4444",
                    color: "white",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid white",
                  }
                : {},
          }}
        >
          {nearbyZainVisible
            ? `إخفاء زين (${nearbyZainCount})`
            : "أقرب برجين زين"}
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
            startIcon={<VisibilityOffIcon />}
          >
            مسح الكل
          </Button>
        )}
      </Box>

      {/* Enhanced Loading indicator */}
      {loading && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
              🔍 جاري البحث عن أقرب برجين... يرجى الانتظار
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Success indicator when sites are found */}
      {(nearbyAsiaVisible || nearbyZainVisible) && !loading && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
              ✅ تم عرض{" "}
              {nearbyAsiaVisible
                ? `${nearbyAsiaCount} برج آسيا`
                : `${nearbyZainCount} برج زين`}{" "}
              على الخريطة
              {(nearbyAsiaCount === 2 || nearbyZainCount === 2) &&
                " (أقرب برجين)"}
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