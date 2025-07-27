import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import strings from "../../utils/strings";

const ImeiAnalysisDashboard = ({ imeiData }) => {
  if (!imeiData || imeiData.length === 0) {
    return <Typography>{strings.noDataAvailable}</Typography>;
  }

  // Helper function to safely get last 6 digits of IMEI
  const getShortImei = (imei) => {
    const imeiString = String(imei || "");
    return imeiString.slice(-6);
  };

  // Helper function to safely get IMEI
  const getImei = (item) => {
    return String(item.IMEI || item.CHARGED_MOBILE_USER_IMEI || "");
  };

  // Prepare data for timeline visualization
  const timelineData = imeiData
    .map((item) => {
      const [startDate, endDate] = item.Usage_Period.split(" to ");
      const imeiNumber = getImei(item);

      return {
        IMEI: getShortImei(imeiNumber),
        fullIMEI: imeiNumber,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        period: item.Usage_Period,
        count: parseInt(item.Usage_Count) || 0,
      };
    })
    .sort((a, b) => a.startDate - b.startDate);

  // Prepare data for usage count chart
  const usageData = imeiData.map((item) => {
    const imeiNumber = getImei(item);
    return {
      IMEI: getShortImei(imeiNumber),
      fullIMEI: imeiNumber,
      count: parseInt(item.Usage_Count) || 0,
    };
  });

  return (
    <Box sx={{ flexGrow: 1, mt: 2 }}>
      <Grid container spacing={3}>
        {/* IMEI Usage Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {strings.imeiUsageTimeline}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="IMEI"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Box
                          sx={{
                            bgcolor: "background.paper",
                            p: 1,
                            border: "1px solid #ccc",
                          }}
                        >
                          <Typography variant="body2">
                            IMEI: {data.fullIMEI}
                          </Typography>
                          <Typography variant="body2">
                            {strings.usageCount}: {data.count}
                          </Typography>
                          <Typography variant="body2">
                            {strings.period}: {data.period}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={strings.usageCount}
                  stroke="#8884d8"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* IMEI Usage Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {strings.imeiUsageDistribution}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="IMEI"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Box
                          sx={{
                            bgcolor: "background.paper",
                            p: 1,
                            border: "1px solid #ccc",
                          }}
                        >
                          <Typography variant="body2">
                            IMEI: {data.fullIMEI}
                          </Typography>
                          <Typography variant="body2">
                            {strings.usageCount}: {data.count}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="count" name={strings.usageCount} fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* IMEI Usage Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {strings.imeiUsageDetails}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      {strings.imeiNumber}
                    </TableCell>
                    <TableCell
                      sx={{ color: "white", fontWeight: "bold" }}
                      align="right"
                    >
                      {strings.usageCount}
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      {strings.usagePeriod}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {imeiData.map((imei, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor:
                          index % 2 === 0 ? "action.hover" : "background.paper",
                        "&:hover": {
                          backgroundColor: "action.selected",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: "medium" }}>
                        {getImei(imei)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: "primary.main",
                          fontWeight: "bold",
                        }}
                      >
                        {imei.Usage_Count}
                      </TableCell>
                      <TableCell>{imei.Usage_Period}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImeiAnalysisDashboard;
