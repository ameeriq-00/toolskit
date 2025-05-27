// أولاً تحتاج تثبيت المكتبات:
// npm install cytoscape cytoscape-cose-bilkent cytoscape-fcose

// frontend/src/components/NetworkGraphCytoscape.js
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

  const [filterMode, setFilterMode] = useState("all");
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [layoutType, setLayoutType] = useState("fcose");

  useEffect(() => {
    if (!data || !data.nodes || !data.links || !containerRef.current) return;

    // تنظيف الرسم البياني السابق
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // تحضير البيانات
    let filteredNodes = data.nodes;
    let filteredLinks = data.links;

    if (filterMode === "common") {
      const commonContacts = filteredNodes.filter(
        (node) => node.type === "contact" && node.appearances > 1
      );
      const ownerNodes = filteredNodes.filter((node) => node.type === "owner");
      filteredNodes = [...ownerNodes, ...commonContacts];

      const commonContactIds = new Set(commonContacts.map((n) => n.id));
      filteredLinks = filteredLinks.filter(
        (link) =>
          commonContactIds.has(link.target) || commonContactIds.has(link.source)
      );
    }

    // تحويل البيانات لصيغة Cytoscape
    const elements = [
      // العقد
      ...filteredNodes.map((node) => ({
        data: {
          id: node.id,
          label: showLabels ? node.name || node.id : "",
          type: node.type,
          size: node.size || 10,
          appearances: node.appearances,
          name: node.name,
        },
      })),
      // الروابط
      ...filteredLinks.map((link, index) => ({
        data: {
          id: `edge-${index}`,
          source: link.source,
          target: link.target,
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
              if (type === "owner") return 16;
              if (type === "contact" && node.data("appearances") > 1) return 12;
              return 8;
            },
            height: (node) => {
              const type = node.data("type");
              if (type === "owner") return 16;
              if (type === "contact" && node.data("appearances") > 1) return 12;
              return 8;
            },
            "background-color": (node) => {
              const type = node.data("type");
              if (type === "owner") return "#ff6b6b";
              if (type === "contact" && node.data("appearances") > 1)
                return "#4ecdc4";
              return "#95e1d3";
            },
            label: "data(label)",
            "text-valign": "bottom",
            "text-halign": "center",
            "font-size": "9px",
            color: "#333",
            "text-outline-width": 1,
            "text-outline-color": "#fff",
            "border-width": 1,
            "border-color": "#fff",
            cursor: "pointer",
            "transition-property": "background-color, border-color, opacity",
            "transition-duration": "0.3s",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#999",
            "target-arrow-color": "#999",
            "curve-style": "bezier",
            opacity: 0.6,
            "transition-property": "line-color, opacity",
            "transition-duration": "0.3s",
          },
        },
        {
          selector: ".highlighted",
          style: {
            "background-color": "#ffeb3b",
            "line-color": "#ffeb3b",
            "target-arrow-color": "#ffeb3b",
            opacity: 1,
            "z-index": 999,
            "border-color": "#f57f17",
            "border-width": 2,
          },
        },
        {
          selector: ".dimmed",
          style: {
            opacity: 0.2,
          },
        },
      ],
      layout: {
        name: layoutType,
        fit: true,
        padding: 50,
        animate: true,
        animationDuration: 1000,
        // خصائص محسنة لتوزيع أفضل
        nodeRepulsion: filterMode === "all" ? 8000 : 4500, // زيادة التنافر عند عرض جميع العقد
        idealEdgeLength: filterMode === "all" ? 80 : 50,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: filterMode === "all" ? 0.2 : 0.4, // تقليل الجاذبية للعقد الكثيرة
        numIter: filterMode === "all" ? 3500 : 2500, // زيادة التكرارات للتوزيع الأفضل
        tile: true,
        tilingPaddingVertical: 15,
        tilingPaddingHorizontal: 15,
        // خصائص إضافية لتحسين التوزيع
        spacingFactor: filterMode === "all" ? 1.5 : 1.2,
        randomize: true,
      },
      // إعدادات التفاعل
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.1,
    });

    cyRef.current = cy;

    // معالجة الأحداث
    cy.on("click", "node", function (evt) {
      evt.stopPropagation(); // منع انتشار الحدث

      const node = evt.target;
      const nodeData = node.data();

      setSelectedNode(nodeData);

      // تطبيق التمييز بحذر لتجنب اختفاء العقد
      try {
        cy.batch(() => {
          // إزالة الفئات السابقة
          cy.elements().removeClass("highlighted dimmed");

          // العثور على العقد والروابط المتصلة
          const connectedElements = node.neighborhood().add(node);
          const otherElements = cy.elements().difference(connectedElements);

          // تطبيق الفئات الجديدة
          connectedElements.addClass("highlighted");
          otherElements.addClass("dimmed");
        });
      } catch (error) {
        console.warn("Error highlighting elements:", error);
        // في حالة الخطأ، امسح التمييز فقط
        cy.elements().removeClass("highlighted dimmed");
      }
    });

    cy.on("click", function (evt) {
      // إذا كان النقر على الخلفية وليس على عقدة
      if (evt.target === cy) {
        clearSelection();
      }
    });

    // وظيفة إلغاء التحديد المحسنة
    const clearSelection = () => {
      try {
        cy.batch(() => {
          cy.elements().removeClass("highlighted dimmed");
        });
        setSelectedNode(null);
      } catch (error) {
        console.warn("Error clearing selection:", error);
        // إعادة تعيين قسري
        setSelectedNode(null);
      }
    };

    // تخزين وظيفة الإلغاء للاستخدام في الأزرار
    cy.clearSelection = clearSelection;

    // تنظيف عند انتهاء المكون
    return () => {
      if (cy) {
        cy.destroy();
      }
    };
  }, [data, filterMode, showLabels, layoutType, fullScreen]);

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
      cyRef.current
        .layout({
          name: layoutType,
          fit: true,
          animate: true,
        })
        .run();
    }
  };

  const handleClearSelection = () => {
    if (cyRef.current) {
      try {
        cyRef.current.batch(() => {
          cyRef.current.elements().removeClass("highlighted dimmed");
        });
        setSelectedNode(null);
      } catch (error) {
        console.warn("Error in handleClearSelection:", error);
        // إعادة إنشاء الرسم البياني في حالة الخطأ الشديد
        setSelectedNode(null);
        // إعادة تشغيل تأثير الرسم
        setTimeout(() => {
          setLayoutType((prev) => prev); // إجبار إعادة الرسم
        }, 100);
      }
    }
  };

  if (!data || !data.nodes) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="info">لا توجد بيانات شبكة متاحة</Alert>
      </Paper>
    );
  }

  const getNodeStats = () => {
    const owners = data.nodes.filter((n) => n.type === "owner").length;
    const contacts = data.nodes.filter((n) => n.type === "contact").length;
    const common = data.nodes.filter(
      (n) => n.type === "contact" && n.appearances > 1
    ).length;
    return { owners, contacts, common };
  };

  const stats = getNodeStats();

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
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>عرض</InputLabel>
        <Select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          label="عرض"
        >
          <MenuItem value="all">جميع الاتصالات</MenuItem>
          <MenuItem value="common">الاتصالات المشتركة فقط</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>تخطيط</InputLabel>
        <Select
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value)}
          label="تخطيط"
        >
          <MenuItem value="fcose">Force-Directed</MenuItem>
          <MenuItem value="circle">دائري</MenuItem>
          <MenuItem value="grid">شبكي</MenuItem>
          <MenuItem value="concentric">متحد المركز</MenuItem>
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
        <Chip label={`${stats.owners} شخص`} color="error" size="small" />
        <Chip label={`${stats.contacts} جهة اتصال`} color="info" size="small" />
        <Chip label={`${stats.common} مشترك`} color="success" size="small" />
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
          onClick={handleClearSelection}
          size="small"
          title="إلغاء التحديد"
          color="warning"
        >
          <ClearIcon />
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
      {/* الرموز التوضيحية */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "#ff6b6b",
            }}
          />
          <Typography variant="caption">أشخاص الشيتات</Typography>
        </Box>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#95e1d3",
            }}
          />
          <Typography variant="caption">جهات اتصال فردية</Typography>
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
        💡 اسحب العقد • انقر لتمييز الاتصالات • انقر على الخلفية لإلغاء التمييز
        • استخدم العجلة للتكبير
      </Typography>

      {/* معلومات العقدة المحددة */}
      {selectedNode && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            معلومات العقدة المحددة:
          </Typography>
          <Typography variant="body2">
            <strong>الرقم/الاسم:</strong> {selectedNode.name || selectedNode.id}
          </Typography>
          <Typography variant="body2">
            <strong>النوع:</strong>{" "}
            {selectedNode.type === "owner" ? "شخص الشيت" : "جهة اتصال"}
          </Typography>
          {selectedNode.appearances && (
            <Typography variant="body2">
              <strong>يظهر في:</strong> {selectedNode.appearances} شيت(ات)
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        الشبكة التفاعلية - Cytoscape
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
