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
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon,
} from "@mui/icons-material";

const DataTable = ({ data, title = "البيانات" }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          لا توجد بيانات متاحة
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          لم يتم العثور على أي سجلات للعرض
        </Typography>
      </Paper>
    );
  }

  const columns = Object.keys(data[0]);

  // Filter data based on search term
  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Paginated data
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setPage(0);
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

    if (link.download !== undefined) {
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
    }
  };

  return (
    <Paper sx={{ width: "100%" }}>
      {/* Header with Search and Export */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">{title}</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Search */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="البحث في البيانات..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                ),
              }}
            />
            {searchTerm && (
              <IconButton onClick={clearSearch} size="small" sx={{ ml: 1 }}>
                <ClearIcon />
              </IconButton>
            )}
          </Box>

          {/* Export Button */}
          <Tooltip title="تصدير إلى CSV">
            <IconButton onClick={exportToCSV} color="primary">
              <ExportIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Results Info */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          عرض {filteredData.length} من أصل {data.length} سجل
          {searchTerm && ` (مفلتر)`}
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow
                key={index}
                hover
                sx={{
                  "&:nth-of-type(odd)": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      maxWidth: 200,
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

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="عدد الصفوف في الصفحة:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
        }
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      />
    </Paper>
  );
};

export default DataTable;