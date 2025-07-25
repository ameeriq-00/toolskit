import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// إصلاح أيقونات Leaflet الافتراضية
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// CSS للانيميشن
const mapStyles = `
  @keyframes towerPulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .tower-pulse {
    animation: towerPulse 2s infinite;
  }
  
  .coverage-tooltip {
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    border: none !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    font-weight: bold !important;
    padding: 8px 12px !important;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
  }
`;

// إدراج الأنماط
if (
  typeof document !== "undefined" &&
  !document.getElementById("coverage-map-styles")
) {
  const styleElement = document.createElement("style");
  styleElement.id = "coverage-map-styles";
  styleElement.textContent = mapStyles;
  document.head.appendChild(styleElement);
}

const SiteCoverageMap = ({ site, height = "500px" }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // ثوابت التصميم
  const COVERAGE_RADIUS_KM = 6; // نصف قطر التغطية بالكيلومتر
  const COVERAGE_RADIUS_DEG = COVERAGE_RADIUS_KM / 111; // تحويل إلى درجات (تقريبي)

  // ألوان التقنيات
  const getTechColor = (tech) => {
    const colors = {
      "2G": "#f44336",
      "3G": "#ff9800",
      "4G": "#4caf50",
      Z_Format: "#2196f3",
      Z: "#2196f3",
    };
    return colors[tech] || "#757575";
  };

  // دالة حساب نقطة جديدة بناءً على الاتجاه والمسافة
  const calculateDestinationPoint = (lat, lng, bearingDegrees, distanceKm) => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const φ1 = (lat * Math.PI) / 180; // lat1 بالراديان
    const λ1 = (lng * Math.PI) / 180; // lng1 بالراديان
    const θ = (bearingDegrees * Math.PI) / 180; // الاتجاه بالراديان
    const δ = distanceKm / R; // المسافة النسبية

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

  useEffect(() => {
    if (!site || !site.coordinates) return;

    const { latitude, longitude } = site.coordinates;

    // إنشاء الخريطة
    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // طبقة القمر الصناعي
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
        maxZoom: 18,
      }
    ).addTo(map);

    // لون التقنية
    const techColor = getTechColor(site.technology);

    // إنشاء أيقونة البرج
    const towerIcon = L.divIcon({
      html: `
        <div style="
          background-color: ${techColor};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        " class="tower-pulse">
          📡
        </div>
      `,
      className: "tower-marker",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // إضافة نقطة البرج
    const towerMarker = L.marker([latitude, longitude], {
      icon: towerIcon,
    }).addTo(map);

    // محتوى النافذة المنبثقة
    let azimuth = site.technical_info?.azimuth;
    if (azimuth === null || azimuth === undefined || isNaN(azimuth)) {
      azimuth = 0; // القيمة الافتراضية
    }

    const popupContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; min-width: 250px;">
        <h4 style="margin: 0 0 10px 0; color: ${techColor}; text-align: center; border-bottom: 2px solid ${techColor}; padding-bottom: 5px;">
          ${site.site_name}
        </h4>
        <div style="line-height: 1.6;">
          <p style="margin: 4px 0;"><strong>رقم البرج:</strong> ${
            site.site_id
          }</p>
          <p style="margin: 4px 0;"><strong>رقم الخلية:</strong> ${
            site.cell_id || "غير محدد"
          }</p>
          <p style="margin: 4px 0;"><strong>التقنية:</strong> 
            <span style="background: ${techColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
              ${site.technology}
            </span>
          </p>
          <p style="margin: 4px 0;"><strong>المدينة:</strong> ${site.city}</p>
          <p style="margin: 4px 0;"><strong>الاتجاه:</strong> ${azimuth}° ${
      site.technical_info?.azimuth === null ||
      site.technical_info?.azimuth === undefined
        ? "(افتراضي)"
        : ""
    }</p>
          <p style="margin: 4px 0;"><strong>نطاق التغطية:</strong> ${COVERAGE_RADIUS_KM} كم</p>
          ${
            site.match_confidence
              ? `<p style="margin: 4px 0;"><strong>درجة الثقة:</strong> ${Math.round(
                  site.match_confidence * 100
                )}%</p>`
              : ""
          }
          ${
            site.match_type
              ? `<p style="margin: 4px 0;"><strong>نوع المطابقة:</strong> ${site.match_type}</p>`
              : ""
          }
        </div>
      </div>
    `;

    towerMarker.bindPopup(popupContent, { maxWidth: 350 });

    // رسم التغطية
    drawCoveragePattern(map, latitude, longitude, azimuth, techColor);

    // ضبط العرض ليشمل التغطية كاملة
    const coverageBounds = L.latLngBounds([
      [latitude - COVERAGE_RADIUS_DEG, longitude - COVERAGE_RADIUS_DEG],
      [latitude + COVERAGE_RADIUS_DEG, longitude + COVERAGE_RADIUS_DEG],
    ]);
    map.fitBounds(coverageBounds.pad(0.1));

    // تنظيف عند الإلغاء
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [site]);

  // دالة رسم نمط التغطية
  const drawCoveragePattern = (
    map,
    centerLat,
    centerLng,
    azimuthDegrees,
    color
  ) => {
    // === 1. رسم الدائرة المرجعية ===
    const referenceCircle = L.circle([centerLat, centerLng], {
      color: color,
      weight: 2,
      opacity: 0.6,
      fillColor: "transparent",
      radius: COVERAGE_RADIUS_KM * 1000, // تحويل إلى متر
      dashArray: "8, 8",
    }).addTo(map);

    referenceCircle.bindTooltip(
      `الدائرة المرجعية<br>نصف القطر: ${COVERAGE_RADIUS_KM} كم`,
      { className: "coverage-tooltip" }
    );

    // === 2. حساب النقاط الثلاث على محيط الدائرة ===

    // النقطة الرئيسية (الاتجاه الأساسي)
    const mainPoint = calculateDestinationPoint(
      centerLat,
      centerLng,
      azimuthDegrees,
      COVERAGE_RADIUS_KM
    );

    // النقطة اليسرى (-60 درجة)
    const leftAngle = (azimuthDegrees - 60 + 360) % 360;
    const leftPoint = calculateDestinationPoint(
      centerLat,
      centerLng,
      leftAngle,
      COVERAGE_RADIUS_KM
    );

    // النقطة اليمنى (+60 درجة)
    const rightAngle = (azimuthDegrees + 60) % 360;
    const rightPoint = calculateDestinationPoint(
      centerLat,
      centerLng,
      rightAngle,
      COVERAGE_RADIUS_KM
    );

    // === 3. رسم الخطوط الثلاثة ===

    // الخط الرئيسي (الاتجاه الأساسي)
    const mainLine = L.polyline([[centerLat, centerLng], mainPoint], {
      color: color,
      weight: 6,
      opacity: 1,
      dashArray: "12, 6",
    }).addTo(map);

    mainLine.bindTooltip(`الاتجاه الرئيسي: ${azimuthDegrees}°`, {
      className: "coverage-tooltip",
    });

    // الخط الأيسر
    const leftLine = L.polyline([[centerLat, centerLng], leftPoint], {
      color: color,
      weight: 5,
      opacity: 0.9,
      dashArray: "10, 5",
    }).addTo(map);

    leftLine.bindTooltip(`الحد الأيسر: ${leftAngle}°`, {
      className: "coverage-tooltip",
    });

    // الخط الأيمن
    const rightLine = L.polyline([[centerLat, centerLng], rightPoint], {
      color: color,
      weight: 5,
      opacity: 0.9,
      dashArray: "10, 5",
    }).addTo(map);

    rightLine.bindTooltip(`الحد الأيمن: ${rightAngle}°`, {
      className: "coverage-tooltip",
    });

    // === 4. رسم مثلث التغطية ===
    const coverageTriangle = L.polygon(
      [[centerLat, centerLng], leftPoint, mainPoint, rightPoint],
      {
        color: color,
        weight: 3,
        opacity: 1,
        fillColor: color,
        fillOpacity: 0.25,
      }
    ).addTo(map);

    coverageTriangle.bindTooltip(
      `منطقة التغطية الرئيسية<br>زاوية: ±60° من ${azimuthDegrees}°`,
      { className: "coverage-tooltip" }
    );

    // === 5. إضافة تسميات النقاط ===

    // تسمية النقطة الرئيسية
    L.marker(mainPoint, {
      icon: L.divIcon({
        html: `<div style="
          background: ${color}; 
          color: white; 
          padding: 4px 8px; 
          border-radius: 6px; 
          font-size: 11px; 
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          white-space: nowrap;
        ">${azimuthDegrees}°</div>`,
        className: "angle-label",
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      }),
    }).addTo(map);

    // تسمية النقطة اليسرى
    L.marker(leftPoint, {
      icon: L.divIcon({
        html: `<div style="
          background: white; 
          color: ${color}; 
          padding: 4px 8px; 
          border-radius: 6px; 
          font-size: 11px; 
          font-weight: bold;
          border: 2px solid ${color};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          white-space: nowrap;
        ">${leftAngle}°</div>`,
        className: "angle-label",
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      }),
    }).addTo(map);

    // تسمية النقطة اليمنى
    L.marker(rightPoint, {
      icon: L.divIcon({
        html: `<div style="
          background: white; 
          color: ${color}; 
          padding: 4px 8px; 
          border-radius: 6px; 
          font-size: 11px; 
          font-weight: bold;
          border: 2px solid ${color};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          white-space: nowrap;
        ">${rightAngle}°</div>`,
        className: "angle-label",
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      }),
    }).addTo(map);

    // === 6. إضافة Legend ===
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "coverage-legend");
      div.innerHTML = `
        <div style="
          background: rgba(255, 255, 255, 0.95); 
          padding: 12px; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
          font-size: 13px; 
          min-width: 200px;
          direction: rtl;
          text-align: right;
        ">
          <h4 style="margin: 0 0 10px 0; color: ${color}; text-align: center; font-size: 14px;">
            تفسير التغطية
          </h4>
          
          <div style="margin: 6px 0; display: flex; align-items: center;">
            <span style="
              display: inline-block; 
              width: 20px; 
              height: 4px; 
              background: ${color}; 
              margin-left: 8px;
              border-radius: 2px;
            "></span>
            <span>الاتجاه الرئيسي (${azimuthDegrees}°)</span>
          </div>
          
          <div style="margin: 6px 0; display: flex; align-items: center;">
            <span style="
              display: inline-block; 
              width: 20px; 
              height: 3px; 
              background: ${color}; 
              opacity: 0.9; 
              margin-left: 8px;
              border-radius: 2px;
            "></span>
            <span>حدود التغطية (±60°)</span>
          </div>
          
          <div style="margin: 6px 0; display: flex; align-items: center;">
            <span style="
              display: inline-block; 
              width: 20px; 
              height: 12px; 
              background: ${color}; 
              opacity: 0.25; 
              margin-left: 8px;
              border-radius: 2px;
            "></span>
            <span>منطقة التغطية</span>
          </div>
          
          <div style="margin: 6px 0; display: flex; align-items: center;">
            <span style="
              display: inline-block; 
              width: 20px; 
              height: 2px; 
              border: 1px dashed ${color}; 
              margin-left: 8px;
            "></span>
            <span>الدائرة المرجعية</span>
          </div>
          
          <div style="
            margin: 10px 0 0 0; 
            font-size: 11px; 
            color: #666; 
            text-align: center;
            padding-top: 8px;
            border-top: 1px solid #eee;
          ">
            نطاق التغطية: ${COVERAGE_RADIUS_KM} كم
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);
  };

  // عرض رسالة خطأ إذا لم تتوفر البيانات
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
    <div
      ref={mapRef}
      style={{
        height,
        width: "100%",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
};

export default SiteCoverageMap;
