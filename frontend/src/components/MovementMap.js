import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import { 
    Box, 
    Typography, 
    Dialog, 
    DialogContent, 
    Button,
    ToggleButton,
    ToggleButtonGroup,
    Slider,
    Paper,
    Grid,
    Divider
} from '@mui/material';
import {
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
    SkipNext as SkipNextIcon,
    SkipPrevious as SkipPreviousIcon,
    DateRange as DateRangeIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import strings from '../localization/strings';

const createCustomIcon = (color, size = 12) => {
    return L.divIcon({
        html: `
            <div style="
                background-color: ${color}; 
                width: ${size}px; 
                height: ${size}px; 
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 4px rgba(0,0,0,0.5);
            "></div>`,
        className: 'custom-icon',
        iconSize: [size + 4, size + 4],
        iconAnchor: [(size + 4)/2, (size + 4)/2]
    });
};

const arrowOptions = {
    color: '#2196f3',
    weight: 3,
    opacity: 0.8,
    dashArray: '10, 10',
    animate: true
};

const getDateRangeForWeek = (weekStr) => {
    // Extract year and week from format "YYYY-WXX"
    const matches = weekStr.match(/(\d{4})-W(\d{1,2})/);
    if (!matches) return 'Invalid Week';

    const year = parseInt(matches[1]);
    const weekNum = parseInt(matches[2]);

    // Get first day of year
    const firstDayOfYear = new Date(year, 0, 1);
    
    // Add days to get to first day of week (assuming week 1 starts on Jan 1)
    const daysToAdd = (weekNum - 1) * 7;
    const weekStart = new Date(firstDayOfYear);
    weekStart.setDate(firstDayOfYear.getDate() + daysToAdd);
    
    // Calculate end of week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Format dates
    return `${weekStart.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })} - ${weekEnd.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })}`;
};

const MovementMap = ({ movementData }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [viewMode, setViewMode] = useState('daily');
    const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed] = useState(2000);

    const periodsData = viewMode === 'daily' 
        ? movementData?.daily_movements 
        : movementData?.weekly_movements;

    const periods = periodsData?.days || periodsData?.weeks || [];
    const currentPeriodMovements = periods[currentPeriodIndex] 
        ? periodsData.movements[periods[currentPeriodIndex]] 
        : null;

    useEffect(() => {
        let interval;
        if (isPlaying && periods.length > 0) {
            interval = setInterval(() => {
                setCurrentPeriodIndex(prev => 
                    prev === periods.length - 1 ? 0 : prev + 1
                );
            }, playbackSpeed);
        }
        return () => clearInterval(interval);
    }, [isPlaying, periods.length, playbackSpeed]);

    useEffect(() => {
        setIsPlaying(false);
        setCurrentPeriodIndex(0);
    }, [viewMode]);

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const handleSliderChange = (event, newValue) => {
        setCurrentPeriodIndex(newValue);
    };

    const togglePlayback = () => {
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (currentPeriodIndex < periods.length - 1) {
            setCurrentPeriodIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPeriodIndex > 0) {
            setCurrentPeriodIndex(prev => prev - 1);
        }
    };

    const getMapCenter = () => {
        if (!currentPeriodMovements || !currentPeriodMovements.locations.length) {
            return [0, 0];
        }
        return [
            currentPeriodMovements.locations[0].lat,
            currentPeriodMovements.locations[0].lon
        ];
    };

    const renderMovements = () => {
        if (!currentPeriodMovements) return null;

        return currentPeriodMovements.movements.map((movement, index) => (
            <React.Fragment key={index}>
                <Polyline
                    positions={[
                        [movement.from_site.lat, movement.from_site.lon],
                        [movement.to_site.lat, movement.to_site.lon]
                    ]}
                    pathOptions={arrowOptions}
                />
                <Marker
                    position={[movement.from_site.lat, movement.from_site.lon]}
                    icon={createCustomIcon('#4CAF50')}
                >
                    <Popup>
                        <Typography variant="subtitle2">{movement.from_site.name}</Typography>
                        <Typography variant="body2">
                            {strings.timestamp}: {movement.timestamp}
                        </Typography>
                    </Popup>
                </Marker>
                <Marker
                    position={[movement.to_site.lat, movement.to_site.lon]}
                    icon={createCustomIcon('#f44336')}
                >
                    <Popup>
                        <Typography variant="subtitle2">{movement.to_site.name}</Typography>
                    </Popup>
                </Marker>
            </React.Fragment>
        ));
    };

    const renderStats = () => {
        if (!currentPeriodMovements) return null;

        return (
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2">{strings.totalMovements}</Typography>
                        <Typography variant="h6">
                            {currentPeriodMovements.total_movements}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2">{strings.totalDistance}</Typography>
                        <Typography variant="h6">
                            {currentPeriodMovements.total_distance} {strings.km}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2">{strings.uniqueLocations}</Typography>
                        <Typography variant="h6">
                            {currentPeriodMovements.locations.length}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2">{strings.currentPeriod}</Typography>
                        <Typography variant="h6">
                            {viewMode === 'weekly' 
                                ? getDateRangeForWeek(periods[currentPeriodIndex])
                                : new Date(periods[currentPeriodIndex]).toLocaleDateString('en-US')
                            }
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    const mapContent = (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {renderStats()}
            
            <MapContainer 
                center={getMapCenter()} 
                zoom={13} 
                style={{ height: isFullScreen ? '85vh' : '500px', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <ZoomControl position="topright" />
                {renderMovements()}
            </MapContainer>

            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                        sx={{ mr: 2 }}
                    >
                        <ToggleButton value="daily">
                            <EventIcon sx={{ mr: 1 }} />
                            {strings.dailyView}
                        </ToggleButton>
                        <ToggleButton value="weekly">
                            <DateRangeIcon sx={{ mr: 1 }} />
                            {strings.weeklyView}
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Button
                        onClick={handlePrevious}
                        disabled={currentPeriodIndex === 0}
                        sx={{ mr: 1 }}
                    >
                        <SkipPreviousIcon />
                    </Button>
                    <Button
                        onClick={togglePlayback}
                        sx={{ mr: 1 }}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={currentPeriodIndex === periods.length - 1}
                    >
                        <SkipNextIcon />
                    </Button>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" color="textSecondary">
                        {viewMode === 'weekly' 
                            ? getDateRangeForWeek(periods[currentPeriodIndex])
                            : new Date(periods[currentPeriodIndex]).toLocaleDateString('en-US')
                        }
                    </Typography>
                </Box>

                <Slider
                    value={currentPeriodIndex}
                    onChange={handleSliderChange}
                    min={0}
                    max={Math.max(0, periods.length - 1)}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => 
                        viewMode === 'weekly' 
                            ? getDateRangeForWeek(periods[value])
                            : new Date(periods[value]).toLocaleDateString('en-US')
                    }
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <Button
                variant="contained"
                onClick={() => setIsFullScreen(!isFullScreen)}
                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
            >
                {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </Button>

            {!isFullScreen && mapContent}
            
            <Dialog
                fullScreen
                open={isFullScreen}
                onClose={() => setIsFullScreen(false)}
            >
                <DialogContent>
                    {mapContent}
                    <Button variant="contained" onClick={() => setIsFullScreen(false)} sx={{ mt: 2 }}>
                        {strings.exitFullScreenButton}
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MovementMap;