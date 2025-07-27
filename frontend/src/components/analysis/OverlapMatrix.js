// frontend/src/components/OverlapMatrix.js
import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

const OverlapMatrix = ({ data }) => {
  const [fullScreen, setFullScreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const { matrix, labels } = data;

  const getCellColor = (value) => {
    if (value === 100) return "#2e7d32"; // أخضر غامق للتطابق الكامل
    if (value >= 75) return "#388e3c"; // أخضر
    if (value >= 50) return "#fbc02d"; // أصفر
    if (value >= 25) return "#f57c00"; // برتقالي
    if (value >= 10) return "#d32f2f"; // أحمر
    if (value > 0) return "#f8bbd9"; // وردي فاتح
    return "#f5f5f5"; // رمادي للصفر
  };

  const getTextColor = (value) => {
    return value >= 50 ? "white" : "black";
  };

  const getDescription = (rowIndex, colIndex, value) => {
    if (rowIndex === colIndex) {
      return `${labels[rowIndex]} مقارنة مع نفسه = 100%`;
    }

    const rowPerson = labels[rowIndex];
    const colPerson = labels[colIndex];

    if (value === 0) {
      return `${rowPerson} لا يشارك أي أرقام مع ${colPerson}`;
    } else if (value === 100) {
      return `${rowPerson} يشارك جميع أرقامه مع ${colPerson}`;
    } else {
      return `${value}% من أرقام ${rowPerson} موجودة أيضاً لدى ${colPerson}`;
    }
  };

  const MatrixContent = () => (
    <Box>
      {/* شرح مبسط */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>كيفية قراءة المصفوفة:</strong>
          <br />
          • كل صف يمثل شخص، كل عمود يمثل شخص آخر
          <br />
          • الرقم في الخلية = كم % من أرقام الشخص الأول موجودة عند الشخص الثاني
          <br />• اللون الأخضر = تطابق عالي، الأحمر = تطابق ضعيف
        </Typography>
      </Alert>

      {/* إحصائيات سريعة */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {labels.map((person, index) => {
          const personRow = matrix[index];
          const avgOverlap =
            personRow.reduce(
              (sum, val, i) => (i !== index ? sum + val : sum),
              0
            ) /
            (personRow.length - 1);
          const maxOverlap = Math.max(
            ...personRow.filter((_, i) => i !== index)
          );
          const connections = personRow.filter(
            (val, i) => i !== index && val > 0
          ).length;

          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card variant="outlined">
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {person}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption">متوسط التطابق:</Typography>
                    <Chip
                      label={`${avgOverlap.toFixed(1)}%`}
                      color={
                        avgOverlap > 50
                          ? "success"
                          : avgOverlap > 25
                          ? "warning"
                          : "default"
                      }
                      size="small"
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption">أعلى تطابق:</Typography>
                    <Chip
                      label={`${maxOverlap}%`}
                      color={
                        maxOverlap > 75
                          ? "success"
                          : maxOverlap > 50
                          ? "warning"
                          : "error"
                      }
                      size="small"
                    />
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="caption">اتصالات مشتركة:</Typography>
                    <Typography variant="caption" color="primary">
                      {connections} من أصل {labels.length - 1}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* المصفوفة */}
      <TableContainer
        component={Paper}
        sx={{ maxHeight: fullScreen ? "70vh" : "400px" }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "primary.main",
                  color: "white",
                  minWidth: "150px",
                }}
              >
                مقارنة
              </TableCell>
              {labels.map((label, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    color: "white",
                    minWidth: "120px",
                    fontSize: "0.75rem",
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.map((row, rowIndex) => (
              <TableRow key={rowIndex} hover>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "grey.100",
                    fontSize: "0.875rem",
                    maxWidth: "150px",
                    wordBreak: "break-word",
                  }}
                >
                  {labels[rowIndex]}
                </TableCell>
                {row.map((value, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align="center"
                    title={getDescription(rowIndex, colIndex, value)}
                    sx={{
                      backgroundColor: getCellColor(value),
                      color: getTextColor(value),
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                      minWidth: "80px",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 0.8,
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    {value}%
                    {rowIndex !== colIndex && value > 0 && (
                      <Box sx={{ fontSize: "0.6rem", mt: 0.5 }}>
                        {value > 75
                          ? "🟢"
                          : value > 50
                          ? "🟡"
                          : value > 25
                          ? "🟠"
                          : "🔴"}
                      </Box>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* دليل الألوان */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          دليل الألوان:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="100% - تطابق كامل"
            sx={{ backgroundColor: "#2e7d32", color: "white" }}
            size="small"
          />
          <Chip
            label="75%+ - تطابق عالي"
            sx={{ backgroundColor: "#388e3c", color: "white" }}
            size="small"
          />
          <Chip
            label="50%+ - تطابق متوسط"
            sx={{ backgroundColor: "#fbc02d", color: "black" }}
            size="small"
          />
          <Chip
            label="25%+ - تطابق ضعيف"
            sx={{ backgroundColor: "#f57c00", color: "white" }}
            size="small"
          />
          <Chip
            label="10%+ - تطابق ضعيف جداً"
            sx={{ backgroundColor: "#d32f2f", color: "white" }}
            size="small"
          />
          <Chip
            label="0% - لا يوجد تطابق"
            sx={{ backgroundColor: "#f5f5f5", color: "black" }}
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">مصفوفة التطابق (نسبة مئوية)</Typography>
        <Box>
          <IconButton onClick={() => setShowInfo(true)} color="info">
            <InfoIcon />
          </IconButton>
          <IconButton onClick={() => setFullScreen(true)} color="primary">
            <FullscreenIcon />
          </IconButton>
        </Box>
      </Box>

      <MatrixContent />

      {/* نافذة ملء الشاشة */}
      <Dialog fullScreen open={fullScreen} onClose={() => setFullScreen(false)}>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">
              مصفوفة التطابق - عرض ملء الشاشة
            </Typography>
            <IconButton onClick={() => setFullScreen(false)}>
              <FullscreenExitIcon />
            </IconButton>
          </Box>
          <MatrixContent />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFullScreen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* نافذة المساعدة */}
      <Dialog open={showInfo} onClose={() => setShowInfo(false)} maxWidth="md">
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            كيفية قراءة مصفوفة التطابق
          </Typography>

          <Typography variant="body1" paragraph>
            <strong>مثال:</strong> إذا كان الرقم في صف "أحمد" وعمود "فاطمة" هو
            60%، فهذا يعني:
          </Typography>

          <Box sx={{ pl: 2, mb: 2 }}>
            <Typography variant="body2">
              • 60% من الأرقام التي يتصل بها أحمد، فاطمة تتصل بها أيضاً
              <br />
              • هناك تطابق متوسط في جهات الاتصال بينهما
              <br />• يمكن أن يكون هناك علاقة أو اهتمامات مشتركة
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            <strong>الخلايا القطرية (100%):</strong> تمثل مقارنة الشخص مع نفسه
            وهي دائماً 100%
          </Typography>

          <Typography variant="body1" paragraph>
            <strong>عدم التماثل:</strong> قد تجد أن صف أحمد/عمود فاطمة مختلف عن
            صف فاطمة/عمود أحمد، وهذا طبيعي لأن:
          </Typography>

          <Box sx={{ pl: 2 }}>
            <Typography variant="body2">
              • أحمد قد يتصل بـ 100 رقم، 60 منها مشتركة مع فاطمة = 60%
              <br />• فاطمة قد تتصل بـ 50 رقم، 60 منها مشتركة مع أحمد = 120%
              (مستحيل)، لذا نأخذ الأقل
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInfo(false)}>فهمت</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default OverlapMatrix;
