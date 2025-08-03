import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  CompareArrows as CompareIcon,
  Description as FileIcon,
} from "@mui/icons-material";
import { useFileUpload } from "../../hooks/useApi";
import OverlapMatrix from "../../components/analysis/OverlapMatrix";
import NetworkGraph from "../../components/analysis/NetworkGraph";

const SheetsComparison = () => {
  const [files, setFiles] = useState([
    { file: null, name: "", format: "standard" },
  ]);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const { loading, error, uploadFile, clearError } = useFileUpload();

  const addFileSlot = () => {
    if (files.length < 5) {
      setFiles([...files, { file: null, name: "", format: "standard" }]);
    }
  };

  const removeFileSlot = (index) => {
    if (files.length > 1) {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
    }
  };

  const handleFileChange = (index, file) => {
    const newFiles = [...files];
    newFiles[index].file = file;
    if (!newFiles[index].name) {
      newFiles[index].name = file.name.replace(/\.[^/.]+$/, "");
    }
    setFiles(newFiles);
  };

  const handleNameChange = (index, name) => {
    const newFiles = [...files];
    newFiles[index].name = name;
    setFiles(newFiles);
  };

  const handleFormatChange = (index, format) => {
    const newFiles = [...files];
    newFiles[index].format = format;
    setFiles(newFiles);
  };

  const handleSubmit = async () => {
    const validFiles = files.filter((f) => f.file && f.name);
    if (validFiles.length < 2) {
      alert("يرجى رفع ملفين على الأقل مع تسميتهما");
      return;
    }

    const result = await uploadFile(validFiles, "compare");
    if (result.success) {
      setResults(result.data);
      setActiveTab(0);
    }
  };

  const resetComparison = () => {
    setFiles([{ file: null, name: "", format: "standard" }]);
    setResults(null);
    setActiveTab(0);
    clearError();
  };

  const renderOverlapSummary = () => {
    if (!results?.pairwise_comparisons) return null;

    return (
      <Grid container spacing={2}>
        {results.pairwise_comparisons.map((comparison, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {comparison.sheet_a} ↔ {comparison.sheet_b}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    أرقام مشتركة: {comparison.common_contacts}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Chip
                    label={`${comparison.overlap_percentage_a}% من ${comparison.sheet_a}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`${comparison.overlap_percentage_b}% من ${comparison.sheet_b}`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderCommonContacts = () => {
    if (!results?.common_contacts) return null;

    return (
      <Box>
        {Object.entries(results.common_contacts)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([count, contacts]) => (
            <Paper key={count} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                أرقام مشتركة في {count} شيتات ({contacts.length} رقم)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>الرقم</TableCell>
                      <TableCell>يظهر في</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.slice(0, 50).map((contact, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {contact.number}
                        </TableCell>
                        <TableCell>
                          {contact.appears_in.map((sheet, i) => (
                            <Chip
                              key={i}
                              label={sheet}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {contacts.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="caption" color="textSecondary">
                            ... و {contacts.length - 50} رقم إضافي
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <CompareIcon sx={{ mr: 1, verticalAlign: "middle" }} />
           I2 مقارنة
        </Typography>
        <Typography variant="body1" color="textSecondary">
          رفع عدة شيتات لتحليل التطابق والعلاقات المشتركة بين الأرقام
        </Typography>
      </Box>

      {/* File Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            رفع الملفات
          </Typography>

          {files.map((fileData, index) => (
            <Grid
              container
              spacing={2}
              key={index}
              sx={{ mb: 2, alignItems: "center" }}
            >
              <Grid item xs={12} sm={4}>
                <input
                  accept=".xlsx,.xls"
                  id={`file-input-${index}`}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(index, e.target.files[0])}
                />
                <label htmlFor={`file-input-${index}`}>
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<FileIcon />}
                    sx={{ height: 56, justifyContent: "flex-start" }}
                  >
                    {fileData.file
                      ? fileData.file.name
                      : `اختر ملف ${index + 1}`}
                  </Button>
                </label>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="اسم الشخص/الشيت"
                  value={fileData.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع الملف</InputLabel>
                  <Select
                    value={fileData.format}
                    onChange={(e) => handleFormatChange(index, e.target.value)}
                    label="نوع الملف"
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="z">Z Format</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <IconButton
                  onClick={() => removeFileSlot(index)}
                  disabled={files.length <= 1}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              startIcon={<AddIcon />}
              onClick={addFileSlot}
              disabled={files.length >= 5}
              variant="outlined"
            >
              إضافة ملف آخر
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={
                loading || files.filter((f) => f.file && f.name).length < 2
              }
              startIcon={
                loading ? <CircularProgress size={20} /> : <CompareIcon />
              }
              size="large"
            >
              {loading ? "جاري المقارنة..." : "بدء المقارنة"}
            </Button>

            {results && (
              <Button
                variant="outlined"
                onClick={resetComparison}
                disabled={loading}
              >
                إعادة تعيين
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Section */}
      {results && (
        <Card>
          <CardContent>
            {/* Results Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ملخص المقارنة
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`${
                    Object.keys(results.pairwise_comparisons || {}).length
                  } مقارنة`}
                  color="primary"
                  variant="outlined"
                />
                {results.common_contacts &&
                  Object.entries(results.common_contacts).map(
                    ([count, contacts]) => (
                      <Chip
                        key={count}
                        label={`${contacts.length} رقم مشترك في ${count} شيت`}
                        color="success"
                        variant="outlined"
                      />
                    )
                  )}
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab label="ملخص التطابق" />
                <Tab label="الأرقام المشتركة" />
                <Tab label="مصفوفة التطابق" />
                <Tab label="الشبكة التفاعلية" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box>
              {activeTab === 0 && renderOverlapSummary()}
              {activeTab === 1 && renderCommonContacts()}
              {activeTab === 2 && results.overlap_matrix && (
                <OverlapMatrix data={results.overlap_matrix} />
              )}
              {activeTab === 3 && results.network_analysis && (
                <NetworkGraph data={results.network_analysis} />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <Card sx={{ textAlign: "center", py: 4 }}>
          <CardContent>
            <CompareIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              ابدأ مقارنة الشيتات
            </Typography>
            <Typography variant="body2" color="textSecondary">
              رفع ملفين أو أكثر لتحليل التطابق والعلاقات المشتركة
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SheetsComparison;