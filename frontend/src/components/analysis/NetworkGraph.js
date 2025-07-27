// frontend/src/components/NetworkGraph.js
import React, { useRef, useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
} from "@mui/icons-material";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

// تسجيل الإضافة
cytoscape.use(fcose);

const NetworkGraphCytoscape = ({ data }) => {
  const cyRef = useRef();
  const containerRef = useRef();

  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState("custom");

  // ألوان مختلفة لكل شخص
  const PERSON_COLORS = [
    "#ff6b6b", // أحمر
    "#4ecdc4", // أزرق فاتح
    "#45b7d1", // أزرق
    "#96ceb4", // أخضر فاتح
    "#feca57", // أصفر
    "#ff9ff3", // وردي
    "#54a0ff", // أزرق ملكي
    "#5f27cd", // بنفسجي
    "#00d2d3", // سماوي
    "#ff9f43", // برتقالي
  ];

  // فلترة البيانات لإظهار المشتركة فقط
  const getFilteredData = () => {
    if (!data || !data.nodes || !data.links) return { nodes: [], links: [] };

    // الحصول على الأشخاص (أصحاب الشيتات)
    const owners = data.nodes.filter((n) => n.type === "owner");

    // الحصول على جهات الاتصال المشتركة فقط (تظهر في أكثر من شيت واحد)
    const sharedContacts = data.nodes.filter(
      (n) => n.type === "contact" && n.appearances > 1
    );

    // إنشاء مجموعة معرفات جهات الاتصال المشتركة
    const sharedContactIds = new Set(sharedContacts.map((n) => n.id));

    // فلترة الروابط للمشتركة فقط
    const filteredLinks = data.links.filter(
      (link) =>
        sharedContactIds.has(link.target) || sharedContactIds.has(link.source)
    );

    return {
      nodes: [...owners, ...sharedContacts],
      links: filteredLinks,
    };
  };

  // الحصول على لون الشخص
  const getPersonColor = (personIndex) => {
    return PERSON_COLORS[personIndex % PERSON_COLORS.length];
  };

  // الحصول على لون الخط حسب الشخص المتصل
  const getLinkColor = (link, owners) => {
    // العثور على الشخص الذي يملك هذا الرابط
    const ownerIndex = owners.findIndex((owner) => owner.id === link.source);
    if (ownerIndex !== -1) {
      return getPersonColor(ownerIndex);
    }
    return "#999"; // لون افتراضي
  };

  // تخطيط مخصص للعقد
  const createCustomLayout = (cy, owners, contacts) => {
    const containerWidth = containerRef.current?.offsetWidth || 800;
    const containerHeight = containerRef.current?.offsetHeight || 600;

    // تحديد المواقع للأشخاص (العقد الكبيرة) - على الأطراف
    const positions = {};
    const padding = 80;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // توزيع الأشخاص على الأطراف بشكل دائري
    owners.forEach((owner, index) => {
      const angle = (index / owners.length) * 2 * Math.PI;
      const radius = Math.min(containerWidth, containerHeight) * 0.35; // نصف قطر للأطراف

      positions[owner.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    // توزيع جهات الاتصال المشتركة في الوسط - خط عمودي
    const contactSpacing = Math.min(
      40,
      (containerHeight - 2 * padding) / Math.max(contacts.length - 1, 1)
    );
    const startY = centerY - ((contacts.length - 1) * contactSpacing) / 2;

    contacts.forEach((contact, index) => {
      positions[contact.id] = {
        x: centerX + (Math.random() - 0.5) * 100, // تشتت قليل في المحور الأفقي
        y: startY + index * contactSpacing,
      };
    });

    return positions;
  };

  useEffect(() => {
    if (!data || !data.nodes || !data.links || !containerRef.current) return;

    // تنظيف الرسم البياني السابق
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // الحصول على البيانات المفلترة
    const filteredData = getFilteredData();
    const owners = filteredData.nodes.filter((n) => n.type === "owner");
    const contacts = filteredData.nodes.filter((n) => n.type === "contact");

    console.log(
      `عرض ${owners.length} أشخاص و ${contacts.length} جهات اتصال مشتركة`
    );

    if (filteredData.nodes.length === 0) {
      return;
    }

    // تحضير العناصر لـ Cytoscape
    const elements = [
      // العقد
      ...filteredData.nodes.map((node, index) => {
        let nodeColor = "#95e1d3"; // لون افتراضي لجهات الاتصال

        if (node.type === "owner") {
          const ownerIndex = owners.findIndex((owner) => owner.id === node.id);
          nodeColor = getPersonColor(ownerIndex);
        } else if (node.type === "contact" && node.appearances > 1) {
          nodeColor = "#4ecdc4"; // لون جهات الاتصال المشتركة
        }

        return {
          data: {
            id: node.id,
            label: showLabels ? node.name || node.id : "",
            type: node.type,
            size: node.size || 10,
            appearances: node.appearances,
            name: node.name,
            color: nodeColor,
          },
        };
      }),
      // الروابط
      ...filteredData.links.map((link, index) => ({
        data: {
          id: `edge-${index}`,
          source: link.source,
          target: link.target,
          color: getLinkColor(link, owners),
        },
      })),
    ];

    // إنشاء الرسم البياني
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            width: (node) => {
              const type = node.data("type");
              if (type === "owner") return 30; // أكبر للأشخاص
              if (type === "contact" && node.data("appearances") > 1) return 18;
              return 12;
            },
            height: (node) => {
              const type = node.data("type");
              if (type === "owner") return 30; // أكبر للأشخاص
              if (type === "contact" && node.data("appearances") > 1) return 18;
              return 12;
            },
            "background-color": "data(color)",
            label: "data(label)",
            "text-valign": "bottom",
            "text-halign": "center",
            "font-size": (node) => {
              const type = node.data("type");
              if (type === "owner") return "12px"; // خط أكبر للأشخاص
              return "10px";
            },
            "font-weight": (node) => {
              const type = node.data("type");
              if (type === "owner") return "bold"; // خط عريض للأشخاص
              return "normal";
            },
            color: "#333",
            "text-outline-width": 2,
            "text-outline-color": "#fff",
            "border-width": 3,
            "border-color": "#fff",
            "box-shadow": "0 4px 8px rgba(0,0,0,0.3)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2.5,
            "line-color": "data(color)",
            "target-arrow-color": "data(color)",
            "target-arrow-shape": "triangle",
            "target-arrow-size": "8px",
            "curve-style": "bezier",
            opacity: 0.8,
            "arrow-scale": 1.2,
          },
        },
      ],
      layout: {
        name: layoutMode === "custom" ? "preset" : layoutMode,
        positions: () => {}, // سيتم تعيينه لاحقاً للتخطيط المخصص
        fit: true,
        padding: 50,
        animate: layoutMode !== "custom",
        animationDuration: layoutMode !== "custom" ? 1000 : 0,
      },
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.1,
      // إلغاء التفاعل مع النقر
      userPanningEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
      selectionType: "single",
      touchTapThreshold: 8,
      desktopTapThreshold: 4,
    });

    cyRef.current = cy;

    // تطبيق التخطيط المخصص إذا كان محدداً
    setTimeout(() => {
      if (layoutMode === "custom") {
        const positions = createCustomLayout(cy, owners, contacts);

        // تحريك العقد إلى مواقعها المخصصة
        Object.entries(positions).forEach(([nodeId, pos]) => {
          const node = cy.getElementById(nodeId);
          if (node.length > 0) {
            node.position(pos);
          }
        });

        // تحديث العرض
        cy.fit(cy.elements(), 50);
      }
    }, 100);

    // إلغاء جميع أحداث النقر والتفاعل
    cy.removeAllListeners();

    return () => {
      if (cy) {
        cy.destroy();
      }
    };
  }, [data, showLabels, layoutMode, fullScreen]);

  // وظائف التحكم
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
      cyRef.current.center();
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
      cyRef.current.center();
    }
  };

  const handleCenter = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  const handleRestart = () => {
    if (cyRef.current) {
      if (layoutMode === "custom") {
        // إعادة تطبيق التخطيط المخصص
        const owners = cyRef.current.nodes('[type="owner"]');
        const contacts = cyRef.current.nodes('[type="contact"]');
        const positions = createCustomLayout(
          cyRef.current,
          owners.jsons(),
          contacts.jsons()
        );

        Object.entries(positions).forEach(([nodeId, pos]) => {
          const node = cyRef.current.getElementById(nodeId);
          if (node.length > 0) {
            node.animate({ position: pos }, { duration: 1000 });
          }
        });

        setTimeout(() => cyRef.current.fit(cyRef.current.elements(), 50), 1100);
      } else {
        // استخدام التخطيطات الأخرى
        cyRef.current
          .layout({
            name: layoutMode,
            fit: true,
            animate: true,
            animationDuration: 1000,
          })
          .run();
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
  };

  if (!data || !data.nodes) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="info">لا توجد بيانات شبكة متاحة</Alert>
      </Paper>
    );
  }

  const filteredData = getFilteredData();
  const owners = filteredData.nodes.filter((n) => n.type === "owner");
  const sharedContacts = filteredData.nodes.filter((n) => n.type === "contact");

  const ControlPanel = () => (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 2,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>نمط التخطيط</InputLabel>
        <Select
          value={layoutMode}
          onChange={(e) => setLayoutMode(e.target.value)}
          label="نمط التخطيط"
        >
          <MenuItem value="custom">تخطيط مخصص</MenuItem>
          <MenuItem value="circle">دائري</MenuItem>
          <MenuItem value="grid">شبكي</MenuItem>
          <MenuItem value="fcose">تلقائي</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
        }
        label="إظهار الأسماء"
      />

      <Box sx={{ display: "flex", gap: 1 }}>
        <Chip label={`${owners.length} شخص`} color="primary" size="small" />
        <Chip
          label={`${sharedContacts.length} جهة مشتركة`}
          color="success"
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <IconButton onClick={handleZoomOut} size="small" title="تصغير">
          <ZoomOutIcon />
        </IconButton>
        <IconButton onClick={handleZoomIn} size="small" title="تكبير">
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={handleCenter} size="small" title="توسيط">
          <CenterIcon />
        </IconButton>
        <IconButton onClick={handleRestart} size="small" title="إعادة تشغيل">
          <RefreshIcon />
        </IconButton>
        <IconButton
          onClick={() => setFullScreen(true)}
          color="primary"
          title="ملء الشاشة"
        >
          <FullscreenIcon />
        </IconButton>
      </Box>
    </Box>
  );

  const GraphContent = () => (
    <Box>
      {/* دليل الألوان للأشخاص */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        {owners.map((owner, index) => (
          <Box
            key={owner.id}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: getPersonColor(index),
              }}
            />
            <Typography variant="caption">{owner.name}</Typography>
          </Box>
        ))}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#4ecdc4",
            }}
          />
          <Typography variant="caption">جهات اتصال مشتركة</Typography>
        </Box>
      </Box>

      {/* حاوي الرسم البياني */}
      <Box
        ref={containerRef}
        sx={{
          width: fullScreen ? "100%" : 800,
          height: fullScreen ? "calc(100vh - 300px)" : 600,
          border: "1px solid #ddd",
          borderRadius: 1,
          overflow: "hidden",
        }}
      />

      {/* التعليمات */}
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ mt: 2, display: "block" }}
      >
        💡 يعرض فقط جهات الاتصال المشتركة • كل شخص له لون مميز • التخطيط المخصص
        يضع الأشخاص على الأطراف والمشتركة في الوسط
      </Typography>
    </Box>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        الشبكة التفاعلية - جهات الاتصال المشتركة فقط
      </Typography>

      <ControlPanel />
      <GraphContent />

      {/* حوار ملء الشاشة */}
      <Dialog
        fullScreen
        open={fullScreen}
        onClose={() => setFullScreen(false)}
        PaperProps={{ sx: { bgcolor: "background.default" } }}
      >
        <DialogContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h4">
              الشبكة التفاعلية - عرض ملء الشاشة
            </Typography>
            <IconButton onClick={() => setFullScreen(false)} size="large">
              <FullscreenExitIcon />
            </IconButton>
          </Box>
          <ControlPanel />
          <GraphContent />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFullScreen(false)} variant="contained">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default NetworkGraphCytoscape;
