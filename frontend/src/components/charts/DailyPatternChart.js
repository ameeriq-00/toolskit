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
import { Box } from '@mui/material';
import strings from '../../localization/strings';

const DailyPatternChart = ({ data }) => {
    if (!data) return null;

    const chartData = data.days.map((day, index) => ({
        day,
        calls: data.counts[index]
    }));

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, strings.calls]} />
                    <Legend />
                    <Bar 
                        dataKey="calls" 
                        name={strings.numberOfCalls} 
                        fill="#82ca9d" 
                    />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default DailyPatternChart;
