import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Box } from '@mui/material';
import strings from '../../localization/strings';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const PeriodDistributionChart = ({ data }) => {
    if (!data) return null;

    const chartData = data.periods.map((period, index) => ({
        name: period,
        value: data.counts[index]
    }));

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, strings.calls]} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default PeriodDistributionChart;
