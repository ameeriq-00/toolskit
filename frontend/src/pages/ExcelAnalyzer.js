import React, { useState } from 'react';
import { Button, Container, Typography, Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';  // Add axios import
import SiteMap from '../components/SiteMap';
import DataTable from '../components/DataTable';
import TimeAnalysisDashboard from '../components/TimeAnalysisDashboard';
import strings from '../localization/strings';
import 'leaflet/dist/leaflet.css';
import MovementMap from '../components/MovementMap';
import CallPatternsDashboard from '../components/CallPatternsDashboard';
import ImeiAnalysisDashboard from '../components/ImeiAnalysisDashboard';
import MostVisitedSitesDashboard from '../components/MostVisitedSitesDashboard';
import * as XLSX from 'xlsx';




const Input = styled('input')({
  display: 'none',
});

const ExcelAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setError(null);

      // Read and store original data
      try {
          const reader = new FileReader();
          reader.onload = async (e) => {
              try {
                  const data = new Uint8Array(e.target.result);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
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

  const handleSubmit = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/analyze-excel/', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setAnalysisResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        alert('Please login to continue');
        // Optionally redirect to login page if needed
      } else {
        alert('Error analyzing file. Please try again.');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderFilteredCalls = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Number</TableCell>
            <TableCell>Number of Calls</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {analysisResult.filtered_calls.map((call, index) => (
            <TableRow key={index}>
              <TableCell>{call.Number}</TableCell>
              <TableCell>{call.Number_of_Calls}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderAggregatedCallerNumbers = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Caller Number</TableCell>
            <TableCell>Number of Calls</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {analysisResult.aggregated_caller_numbers.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.CALLER_NUMBER}</TableCell>
              <TableCell>{item.Number_of_Calls}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderImeiUsage = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>IMEI</TableCell>
            <TableCell>Usage Period</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {analysisResult.imei_usage.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.CHARGED_MOBILE_USER_IMEI}</TableCell>
              <TableCell>{item.Usage_Period}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderMostVisitedSites = () => (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Site ID</TableCell>
              <TableCell>Site Name</TableCell>
              <TableCell>Number of Visits</TableCell>
              <TableCell>Latitude</TableCell>
              <TableCell>Longitude</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {analysisResult.most_visited_sites.map((site, index) => (
              <TableRow key={index}>
                <TableCell>{site.SITE_ID}</TableCell>
                <TableCell>{site.SITE_NAME}</TableCell>
                <TableCell>{site.Number_of_Visits}</TableCell>
                <TableCell>{site.LAT}</TableCell>
                <TableCell>{site.LON}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderMap = () => (
    <Box mt={2} style={{ height: '600px' }}>
      <SiteMap sites={analysisResult.most_visited_sites} />
    </Box>
  );

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        {strings.excelAnalyzerTitle}
      </Typography>
      <Box mb={2}>
        <Input
          accept=".xlsx,.xls"
          id="contained-button-file"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="contained-button-file">
          <Button variant="contained" component="span">
            {strings.uploadButton}
          </Button>
        </label>
        {file && <Typography>{file.name}</Typography>}
      </Box>
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        {strings.analyze}
      </Button>
      {analysisResult && (
        <Box sx={{ width: '100%', mt: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={strings.filteredCalls} />
            <Tab label={strings.imeiUsage} />
            <Tab label={strings.mostVisitedSites} />
            <Tab label={strings.timeAnalysis} />
            <Tab label={strings.movementAnalysis} />  {/* New tab */}
            <Tab label={strings.siteMap} />


          </Tabs>
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && <DataTable data={analysisResult.filtered_calls} />}
            {activeTab === 1 && <ImeiAnalysisDashboard imeiData={analysisResult.imei_usage} />}
            {activeTab === 2 && <MostVisitedSitesDashboard sites={analysisResult.most_visited_sites} />}
            {activeTab === 3 && (
                            <TimeAnalysisDashboard 
                                timeData={analysisResult.time_analysis}
                                callPatterns={analysisResult.call_patterns}
                                originalData={originalData}
                                isZFormat={false}
                            />
                        )}
            {activeTab === 4 && <MovementMap movementData={analysisResult.movement_analysis} />}
            {activeTab === 5 && <SiteMap sites={analysisResult.most_visited_sites} />}


          </Box>
        </Box>
      )}
    </Container>
  );
}

export default ExcelAnalyzer;




