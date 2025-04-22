import React, { useState } from 'react';
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
    Card,
    CardContent 
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
    Cell,
    LineChart,
    Line
} from 'recharts';
import TimeDetailsDialog from './TimeDetailsDialog';
import strings from '../localization/strings';

const TimeAnalysisDashboard = ({ timeData, callPatterns, originalData, isZFormat }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTimeData, setSelectedTimeData] = useState(null);
    const [selectedTimeLabel, setSelectedTimeLabel] = useState('');

    if (!timeData) {
        return <Typography>{strings.noDataAvailable}</Typography>;
    }

    const { 
        hourly_distribution, 
        daily_patterns, 
        weekly_patterns, 
        day_periods,
        consistency_scores,
        statistical_summary 
    } = timeData;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const handleHourClick = (data) => {
        if (!data.activePayload || !originalData) return;

        const hour = data.activePayload[0].payload.hour;
        const hourData = originalData.filter(row => {
            const rowTime = isZFormat ? 
                new Date(row.Date).getHours() :
                new Date(row.CALL_INITIAL_TIME).getHours();
            return rowTime === hour;
        });

        setSelectedTimeData(hourData);
        setSelectedTimeLabel(`${hour}:00`);
        setDialogOpen(true);
    };

    const formatWeekData = (weeks, counts) => {
        return weeks.map((week, index) => {
            const firstDay = new Date(new Date().getFullYear(), 0, 1);
            const startDate = new Date(firstDay.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);

            return {
                week: `${startDate.toLocaleDateString('ar-IQ')} - ${endDate.toLocaleDateString('ar-IQ')}`,
                count: counts[index]
            };
        });
    };

    return (
        <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Grid container spacing={3}>
                {/* Statistics Cards */}
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">{statistical_summary.total_calls}</Typography>
                                    <Typography>{strings.totalCalls}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">
                                        {statistical_summary.calls_per_day.mean.toFixed(1)}
                                    </Typography>
                                    <Typography>{strings.averageCallsPerDay}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">
                                        {statistical_summary.active_hours_per_day.toFixed(1)}
                                    </Typography>
                                    <Typography>{strings.activeHoursPerDay}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">
                                        {(consistency_scores.pattern_score * 100).toFixed(0)}%
                                    </Typography>
                                    <Typography>{strings.patternConsistency}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Hourly Distribution */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.hourlyDistribution}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={hourly_distribution.hours.map((hour, index) => ({
                                    hour,
                                    count: hourly_distribution.counts[index]
                                }))}
                                onClick={handleHourClick}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8884d8" name={strings.calls} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Daily Pattern */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.dailyPattern}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={daily_patterns.days.map((day, index) => ({
                                    day,
                                    count: daily_patterns.counts[index]
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#82ca9d" name={strings.calls} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Weekly Pattern */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.weeklyPattern}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={formatWeekData(weekly_patterns.weeks, weekly_patterns.counts)}
                                margin={{
                                    right: 30,
                                    left: 20,
                                    bottom: 60
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="week"
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    height={60}
                                />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#8884d8" name={strings.calls} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Day Periods */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.dayPeriodDistribution}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={day_periods.periods.map((period, index) => ({
                                        name: period,
                                        value: day_periods.counts[index]
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {day_periods.periods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Call Patterns Table */}
                {callPatterns?.reciprocal_patterns && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {strings.reciprocalPatterns}
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                                {strings.contactNumber}
                                            </TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                                {strings.callsMade}
                                            </TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                                {strings.callsReceived}
                                            </TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                                {strings.totalCalls}
                                            </TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                                {strings.callRatio}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {callPatterns.reciprocal_patterns.map((pattern, index) => (
                                            <TableRow 
                                                key={index}
                                                sx={{ 
                                                    backgroundColor: index % 2 === 0 ? 'action.hover' : 'background.paper',
                                                    '&:hover': {
                                                        backgroundColor: 'action.selected',
                                                    }
                                                }}
                                            >
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
                )}
            </Grid>

            <TimeDetailsDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                data={selectedTimeData}
                time={selectedTimeLabel}
                isZFormat={isZFormat}
            />
        </Box>
    );
};

export default TimeAnalysisDashboard;
