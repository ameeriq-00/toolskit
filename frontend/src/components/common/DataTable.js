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
} from "@mui/material";
import { Search, Clear, GetApp } from "@mui/icons-material";

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
      </Box>

      {/* الجدول */}
      <TableContainer sx={{ maxHeight: isMobile ? 400 : 600 }}>
        <Table stickyHeader size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                >
                  {column}
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
                      maxWidth: isMobile ? 100 : 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={String(row[column] || "")}
                  >
                    {row[column] || "-"}
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
