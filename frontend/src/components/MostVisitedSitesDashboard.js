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
    CardContent,
    Tabs,
    Tab,
    Select,
    MenuItem,
    FormControl,
    InputLabel
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

const MostVisitedSitesDashboard = ({ sites }) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedCity, setSelectedCity] = useState('all');

    if (!sites || !Array.isArray(sites) || sites.length === 0) {
        return <Typography>{strings.noDataAvailable}</Typography>;
    }

    // Helper function to get site information handling both formats
    const getSiteInfo = (site) => {
        const isZFormat = 'Site ID' in site;
        return {
            id: isZFormat ? site['Site ID'] : site.SITE_ID,
            name: isZFormat ? site['Site Name'] : site.SITE_NAME,
            city: site.CITY,
            lat: site.LAT,
            lon: site.LON,
            visits: site['Number_of_Visits']
        };
    };

    // Group sites by city
    const cityGroups = sites.reduce((groups, site) => {
        const siteInfo = getSiteInfo(site);
        const city = siteInfo.city || 'Unknown';

        if (!groups[city]) {
            groups[city] = {
                totalSites: 0,
                totalVisits: 0,
                sites: []
            };
        }

        groups[city].sites.push(site);
        groups[city].totalSites++;
        groups[city].totalVisits += siteInfo.visits;
        return groups;
    }, {});

    // Prepare data for visualizations
    const cityData = Object.entries(cityGroups).map(([city, data]) => ({
        name: city,
        value: data.totalVisits
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Calculate statistics
    const stats = {
        totalSites: sites.length,
        totalVisits: sites.reduce((sum, site) => sum + site['Number_of_Visits'], 0),
        uniqueCities: Object.keys(cityGroups).length,
        mostActiveCity: Object.entries(cityGroups)
            .sort((a, b) => b[1].totalVisits - a[1].totalVisits)[0]?.[0]
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
        if (newValue === 0) {
            setSelectedCity('all');
        }
    };

    // Handle city selection
    const handleCityChange = (event) => {
        setSelectedCity(event.target.value);
    };

    // Filter sites based on selected city
    const filteredSites = selectedCity === 'all' ? sites : cityGroups[selectedCity]?.sites || [];

    return (
        <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Grid container spacing={3}>
                {/* Statistics Cards */}
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">{stats.uniqueCities}</Typography>
                                    <Typography>{strings.cities}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">{stats.totalSites}</Typography>
                                    <Typography>{strings.totalSites}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">{stats.totalVisits}</Typography>
                                    <Typography>{strings.totalVisits}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h6">{stats.mostActiveCity}</Typography>
                                    <Typography>{strings.mostActiveCity}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* City Distribution Charts */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.visitsByCity}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={cityData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {cityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {strings.cityComparison}
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={cityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name={strings.numberOfVisits} fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Sites Table */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs 
                                value={selectedTab} 
                                onChange={handleTabChange}
                            >
                                <Tab label={strings.allSites} />
                                <Tab label={strings.byCity} />
                            </Tabs>
                        </Box>

                        {selectedTab === 1 && (
                            <Box sx={{ mb: 2 }}>
                                <FormControl sx={{ minWidth: 200, mb: 2 }}>
                                    <InputLabel>{strings.selectCity}</InputLabel>
                                    <Select
                                        value={selectedCity}
                                        onChange={handleCityChange}
                                        label={strings.selectCity}
                                    >
                                        {Object.keys(cityGroups).map(city => (
                                            <MenuItem key={city} value={city}>{city}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{strings.siteId}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{strings.siteName}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{strings.siteLocation}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">{strings.numberOfVisits}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{strings.siteCoordinates}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredSites.map((site, index) => {
                                        const siteInfo = getSiteInfo(site);
                                        return (
                                            <TableRow 
                                                key={index}
                                                sx={{ 
                                                    backgroundColor: index % 2 === 0 ? 'action.hover' : 'background.paper',
                                                    '&:hover': {
                                                        backgroundColor: 'action.selected',
                                                    }
                                                }}
                                            >
                                                <TableCell>{siteInfo.id}</TableCell>
                                                <TableCell>{siteInfo.name}</TableCell>
                                                <TableCell>{siteInfo.city}</TableCell>
                                                <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                    {siteInfo.visits}
                                                </TableCell>
                                                <TableCell>{`${siteInfo.lat}, ${siteInfo.lon}`}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MostVisitedSitesDashboard;