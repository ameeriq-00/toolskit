// frontend/src/pages/SheetsComparison.js
import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
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
  Chip,
  IconButton,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  CompareArrows as CompareIcon,
} from "@mui/icons-material";
import axios from "axios";
import OverlapMatrix from "../components/OverlapMatrix";
import NetworkGraph from "../components/NetworkGraph";
import strings from "../localization/strings";

const SheetsComparison = () => {
  const [files, setFiles] = useState([
    { file: null, name: "", format: "standard" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const addFileSlot = () => {
    if (files.length < 5) {
      // حد أقصى 5 ملفات
      setFiles([...files, { file: null, name: "", format: "standard" }]);
    }
  };

  const removeFileSlot = (index) => {
    if (files.length > 1) {
      // احتفظ بملف واحد على الأقل
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
    // Validate
    const validFiles = files.filter((f) => f.file && f.name);
    if (validFiles.length < 2) {
      setError("يرجى رفع ملفين على الأقل مع تسميتهما");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      validFiles.forEach((fileData, index) => {
        formData.append(`file_${index}`, fileData.file);
        formData.append(`file_${index}_name`, fileData.name);
        formData.append(`file_${index}_format`, fileData.format);
      });

      const response = await axios.post(
        "http://localhost:8000/api/compare-sheets/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResults(response.data);
    } catch (error) {
      console.error("Error comparing sheets:", error);
      setError(error.response?.data?.error || "حدث خطأ أثناء المقارنة");
    } finally {
      setLoading(false);
    }
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
                    {contacts.map((contact, index) => (
                      <TableRow key={index}>
                        <TableCell>{contact.number}</TableCell>
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
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        <CompareIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        مقارنة الشيتات
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        رفع عدة شيتات لتحليل التطابق والعلاقات المشتركة بين الأرقام
      </Typography>

      {/* File Upload Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
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
                <Button variant="outlined" component="span" fullWidth>
                  {fileData.file ? fileData.file.name : `اختر ملف ${index + 1}`}
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

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
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
          >
            {loading ? "جاري المقارنة..." : "بدء المقارنة"}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Section */}
      {results && (
        <Box>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{ mb: 3 }}
          >
            <Tab label="ملخص التطابق" />
            <Tab label="الأرقام المشتركة" />
            <Tab label="مصفوفة التطابق" />
            <Tab label="الشبكة التفاعلية" />
          </Tabs>

          {activeTab === 0 && renderOverlapSummary()}
          {activeTab === 1 && renderCommonContacts()}
          {activeTab === 2 && results.overlap_matrix && (
            <OverlapMatrix data={results.overlap_matrix} />
          )}
          {activeTab === 3 && results.network_analysis && (
            <NetworkGraph data={results.network_analysis} />
          )}
        </Box>
      )}
    </Container>
  );
};

export default SheetsComparison;
