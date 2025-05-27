import React, { useState } from 'react';
import { Button, Container, Typography, Tab, Tabs, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import DataTable from '../components/DataTable';
import SiteMap from '../components/SiteMap';
import MovementMap from '../components/MovementMap';
import TimeAnalysisDashboard from '../components/TimeAnalysisDashboard';
import strings from '../localization/strings';
import CallPatternsDashboard from '../components/CallPatternsDashboard';
import ImeiAnalysisDashboard from '../components/ImeiAnalysisDashboard';
import MostVisitedSitesDashboard from '../components/MostVisitedSitesDashboard';
import * as XLSX from 'xlsx';




const ExcelAnalyzerZ = () => {
  const [mainFile, setMainFile] = useState(null);
  const [imeiFile, setImeiFile] = useState(null);
  const [results, setResults] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMainFileChange = async (event) => {
      const selectedFile = event.target.files[0];
      setMainFile(selectedFile);
      setError(null);

      // Read and store original data
      try {
          const reader = new FileReader();
          reader.onload = async (e) => {
              try {
                  const data = new Uint8Array(e.target.result);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
                      range: 5,  // Skip first 5 rows for Z format
                      raw: false 
                  });
                  setOriginalData(jsonData);
              } catch (err) {
                  setError('Error processing file: ' + err.message);
              }
          };
          reader.onerror = () => {
              setError('Error reading file');
          };
          reader.readAsArrayBuffer(selectedFile);
      } catch (err) {
          setError('Error handling file: ' + err.message);
      }
  };



  const handleImeiFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      setImeiFile(file);
      setError(null);
    } else {
      setError("Please upload a valid Excel file (.xlsx) for the IMEI sheet.");
    }
  };

  const handleSubmit = async () => {
    if (!mainFile || !imeiFile) {
      setError("Please upload both main and IMEI files before analyzing.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('main_file', mainFile);
    formData.append('imei_file', imeiFile);

    try {
      const response = await axios.post('http://localhost:8000/api/analyze-excel-z/', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing Excel files:', error);
      setError(error.response?.data?.error || "An error occurred while analyzing the files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        {strings.excelAnalyzerZTitle}
      </Typography>
      
      {/* File Upload Section */}
      <Box mb={2}>
        <input
          accept=".xlsx"
          id="main-file-input"
          type="file"
          onChange={handleMainFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="main-file-input">
          <Button variant="contained" component="span">
            {strings.uploadMainFile}
          </Button>
        </label>
        {mainFile && <Typography>{mainFile.name}</Typography>}
      </Box>
      
      <Box mb={2}>
        <input
          accept=".xlsx"
          id="imei-file-input"
          type="file"
          onChange={handleImeiFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="imei-file-input">
          <Button variant="contained" component="span">
            {strings.uploadImeiFile}
          </Button>
        </label>
        {imeiFile && <Typography>{imeiFile.name}</Typography>}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading || !mainFile || !imeiFile}
      >
        {loading ? <CircularProgress size={24} /> : strings.analyze}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results Section */}
      {results && (
        <Box sx={{ width: '100%', mt: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="analysis results tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={strings.filteredCalls} />
            <Tab label={strings.imeiUsage} />
            <Tab label={strings.mostVisitedSites} />
            <Tab label={strings.timeAnalysis} />
            <Tab label={strings.movementAnalysis} />
            <Tab label={strings.siteMap} />

          </Tabs>
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <DataTable data={results.filtered_calls} />
            )}
            {activeTab === 1 && <ImeiAnalysisDashboard imeiData={results.imei_usage} />}

            {activeTab === 2 && (
              <MostVisitedSitesDashboard sites={results.most_visited_sites} />
            )}
            {activeTab === 3 && (
                            <TimeAnalysisDashboard 
                                timeData={results.time_analysis}
                                callPatterns={results.call_patterns}
                                originalData={originalData}
                                isZFormat={true}
                            />
                        )}
            {activeTab === 4 && (
              <MovementMap movementData={results.movement_analysis} />
            )}
            {activeTab === 5 && (
              <SiteMap sites={results.most_visited_sites || []} />
            )}
            
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default ExcelAnalyzerZ;