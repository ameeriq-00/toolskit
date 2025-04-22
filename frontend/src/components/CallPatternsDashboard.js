import React from 'react';
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
    TableRow 
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import strings from '../localization/strings';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CallPatternsDashboard = ({ callPatterns }) => {
    if (!callPatterns) {
        return <Typography>{strings.noDataAvailable}</Typography>;
    }

    const { reciprocal_patterns, timing_patterns } = callPatterns;

    // Prepare data for daily distribution chart
    const timeDistributionData = [
        { name: strings.morning, calls: timing_patterns.morning_calls },
        { name: strings.afternoon, calls: timing_patterns.afternoon_calls },
        { name: strings.evening, calls: timing_patterns.evening_calls },
        { name: strings.night, calls: timing_patterns.night_calls }
    ];

    // Prepare data for weekly distribution
    const weeklyData = Object.entries(timing_patterns.weekday_distribution).map(([day, count]) => ({
        day,
        calls: count
    }));

    return (
        <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Grid container spacing={3}>
                {/* Time Distribution Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.dailyDistribution}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={timeDistributionData}
                                    dataKey="calls"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    label
                                >
                                    {timeDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Weekly Distribution Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.weeklyDistribution}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="calls" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Reciprocal Patterns Table */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.reciprocalPatterns}
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{strings.contactNumber}</TableCell>
                                        <TableCell align="right">{strings.callsMade}</TableCell>
                                        <TableCell align="right">{strings.callsReceived}</TableCell>
                                        <TableCell align="right">{strings.totalCalls}</TableCell>
                                        <TableCell align="right">{strings.callRatio}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reciprocal_patterns.map((pattern, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{pattern.contact_number}</TableCell>
                                            <TableCell align="right">{pattern.calls_made}</TableCell>
                                            <TableCell align="right">{pattern.calls_received}</TableCell>
                                            <TableCell align="right">{pattern.total_calls}</TableCell>
                                            <TableCell align="right">{pattern.call_ratio}</TableCell>
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

export default CallPatternsDashboard;