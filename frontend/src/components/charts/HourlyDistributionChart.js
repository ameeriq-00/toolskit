import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Box, Typography } from '@mui/material';
import strings from '../../localization/strings';

const HourlyDistributionChart = ({ data }) => {
    if (!data) return null;

    const chartData = data.hours.map((hour, index) => ({
        hour,
        calls: data.counts[index]
    }));

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="hour"
                        tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip 
                        formatter={(value) => [value, strings.calls]}
                        labelFormatter={(hour) => `${hour}:00`}
                    />
                    <Legend />
                    <Bar 
                        dataKey="calls" 
                        name={strings.numberOfCalls} 
                        fill="#8884d8" 
                    />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default HourlyDistributionChart;