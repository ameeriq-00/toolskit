import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  TextField,
  Box,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Chip,
  Link,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Clear,
  GetApp,
  Message,
  PersonSearch,
} from "@mui/icons-material";

// إضافة أيقونات التطبيقات كـ SVG مخصصة
const TelegramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.03-.18.37-.36.92-.55 3.63-1.55 6.05-2.57 7.24-3.07.69-.24 1.44-.5 1.44-.5s.52-.18.84.11c.18.14.29.33.32.52.03.19.03.53-.01.88z" />
  </svg>
);

const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.894 3.488" />
  </svg>
);

const TruecallerIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const DataTable = ({ data, title = "البيانات" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 10 : 25);
  const [searchTerm, setSearchTerm] = useState("");

  if (!data?.length) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          لا توجد بيانات متاحة
        </Typography>
      </Paper>
    );
  }

  const columns = Object.keys(data[0]);

  // التحقق من وجود عمود الأرقام
  const numberColumn = columns.find(
    (col) =>
      col.toLowerCase().includes("number") || col === "رقم" || col === "Number"
  );

  // فلترة البيانات
  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // البيانات المقسمة
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // دالة تنسيق الرقم للروابط
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "";

    let number = String(phoneNumber).trim();

    // إذا كان الرقم يبدأ بـ 7 (أرقام عراقية)
    if (number.startsWith("7") && number.length >= 10) {
      return `+964${number}`;
    }

    // إذا كان الرقم يبدأ بـ + أو 00، اتركه كما هو
    if (number.startsWith("+") || number.startsWith("00")) {
      return number;
    }

    // إذا كان الرقم يبدأ بـ 964
    if (number.startsWith("964")) {
      return `+${number}`;
    }

    return number;
  };

  // دالة إنشاء الروابط العميقة
  const createAppLinks = (phoneNumber) => {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    const encodedNumber = encodeURIComponent(formattedNumber);

    return {
      whatsapp: `https://wa.me/${formattedNumber.replace(/[^0-9+]/g, "")}`,
      telegram: `https://t.me/${formattedNumber}`,
      truecaller: `https://www.truecaller.com/search/sa/${encodedNumber}`,
    };
  };

  // مكون أزرار التطبيقات
  const AppLinksButtons = ({ phoneNumber }) => {
    if (!phoneNumber) return null;

    const links = createAppLinks(phoneNumber);
    const formattedNumber = formatPhoneNumber(phoneNumber);

    return (
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Chip
          label={formattedNumber}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: "0.7rem", maxWidth: 120 }}
        />

        <Box sx={{ display: "flex", gap: 0.3 }}>
          <Tooltip title="WhatsApp" arrow>
            <IconButton
              size="small"
              onClick={() => window.open(links.whatsapp, "_blank")}
              sx={{
                color: "#25D366",
                p: 0.3,
                "&:hover": {
                  backgroundColor: "rgba(37, 211, 102, 0.1)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <WhatsAppIcon size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Telegram" arrow>
            <IconButton
              size="small"
              onClick={() => window.open(links.telegram, "_blank")}
              sx={{
                color: "#0088cc",
                p: 0.3,
                "&:hover": {
                  backgroundColor: "rgba(0, 136, 204, 0.1)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <TelegramIcon size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Truecaller" arrow>
            <IconButton
              size="small"
              onClick={() => window.open(links.truecaller, "_blank")}
              sx={{
                color: "#3282F6",
                p: 0.3,
                "&:hover": {
                  backgroundColor: "rgba(50, 130, 246, 0.1)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <TruecallerIcon size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  const exportToCSV = () => {
    if (!filteredData.length) return;

    const headers = columns.join(",");
    const rows = filteredData
      .map((row) =>
        columns
          .map((col) => `"${String(row[col] || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${title.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Paper sx={{ width: "100%" }}>
      {/* الرأس والبحث */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6">{title}</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            size="small"
            placeholder="البحث..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: isMobile ? 150 : 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <IconButton
            onClick={exportToCSV}
            color="primary"
            title="تصدير إلى CSV"
          >
            <GetApp />
          </IconButton>
        </Box>
      </Box>

      {/* معلومات النتائج */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          عرض {filteredData.length} من أصل {data.length} سجل
          {searchTerm && " (مفلتر)"}
        </Typography>
        {numberColumn && (
          <Typography variant="caption" color="primary" sx={{ ml: 2 }}>
            📱 الأرقام قابلة للنقر - WhatsApp • Telegram • Truecaller
          </Typography>
        )}
      </Box>

      {/* الجدول */}
      <TableContainer sx={{ maxHeight: isMobile ? 400 : 600 }}>
        <Table stickyHeader size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    backgroundColor:
                      numberColumn === column
                        ? "rgba(25, 118, 210, 0.08)"
                        : "inherit",
                  }}
                >
                  {column}
                  {numberColumn === column && (
                    <Typography
                      variant="caption"
                      display="block"
                      color="primary"
                    >
                      روابط التطبيقات
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={index} hover>
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      maxWidth:
                        numberColumn === column ? 300 : isMobile ? 100 : 200,
                      overflow: numberColumn === column ? "visible" : "hidden",
                      textOverflow:
                        numberColumn === column ? "clip" : "ellipsis",
                      whiteSpace: numberColumn === column ? "normal" : "nowrap",
                      backgroundColor:
                        numberColumn === column
                          ? "rgba(25, 118, 210, 0.02)"
                          : "inherit",
                      py: numberColumn === column ? 1.5 : 1,
                    }}
                    title={
                      numberColumn !== column
                        ? String(row[column] || "")
                        : undefined
                    }
                  >
                    {numberColumn === column ? (
                      <AppLinksButtons phoneNumber={row[column]} />
                    ) : (
                      row[column] || "-"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* التقسيم */}
      <TablePagination
        rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="عدد الصفوف:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
        }
        sx={{ borderTop: "1px solid", borderColor: "divider" }}
      />
    </Paper>
  );
};

export default DataTable;