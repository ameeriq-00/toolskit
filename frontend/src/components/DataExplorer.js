import React, { useState, useMemo } from 'react';
import { 
    Box, 
    Paper, 
    Grid,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Card,
    CardContent,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Slider,
    DialogTitle,
    Tooltip
} from '@mui/material';
import {
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    FilterList as FilterListIcon,
    ClearAll as ClearAllIcon,
    AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import strings from '../localization/strings';

const DataExplorer = ({ data, isZFormat }) => {
    // States
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [selectedCallTypes, setSelectedCallTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [durationRange, setDurationRange] = useState([0, 1000]);
    const [timeOfDay, setTimeOfDay] = useState([0, 24]);
    const [numberPrefix, setNumberPrefix] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Get unique locations
    const uniqueLocations = useMemo(() => {
        const locations = new Set();
        data.forEach(row => {
            if (isZFormat) {
                locations.add(row['Call Location']);
            } else {
                locations.add(row.CITY);
            }
        });
        return Array.from(locations).filter(Boolean).sort();
    }, [data, isZFormat]);

    // Get unique call types
    const uniqueCallTypes = useMemo(() => {
        const types = new Set();
        data.forEach(row => {
            if (isZFormat) {
                types.add(row['CALL_TYPE']);
            } else {
                types.add(row.CALL_TYPE);
            }
        });
        return Array.from(types).filter(Boolean).sort();
    }, [data, isZFormat]);

    // Helper functions
    const getTimeFromDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.getHours() + date.getMinutes() / 60;
    };

    const getDuration = (row) => {
        return isZFormat ? parseInt(row.Duration) : parseInt(row.CONVERSATION_DURATION) || 0;
    };

    // Filter data
    const filteredData = useMemo(() => {
        return data.filter(row => {
            // Date filter
            if (dateRange.start || dateRange.end) {
                const rowDate = new Date(isZFormat ? row.Date : row.CALL_INITIAL_TIME);
                if (dateRange.start && rowDate < new Date(dateRange.start)) return false;
                if (dateRange.end && rowDate > new Date(dateRange.end)) return false;
            }

            // Time of day filter
            const rowTime = getTimeFromDate(isZFormat ? row.Date : row.CALL_INITIAL_TIME);
            if (rowTime < timeOfDay[0] || rowTime > timeOfDay[1]) return false;

            // Duration filter
            const duration = getDuration(row);
            if (duration < durationRange[0] || duration > durationRange[1]) return false;

            // Location filter
            if (selectedLocations.length > 0) {
                const location = isZFormat ? row['Call Location'] : row.CITY;
                if (!selectedLocations.includes(location)) return false;
            }

            // Call type filter
            if (selectedCallTypes.length > 0) {
                const callType = isZFormat ? row['CALL_TYPE'] : row.CALL_TYPE;
                if (!selectedCallTypes.includes(callType)) return false;
            }

            // Number prefix filter
            if (numberPrefix) {
                const callingNumber = isZFormat ? row['Calling Number'] : row.CALLER_NUMBER;
                const calledNumber = isZFormat ? row['Called Number'] : row.CALLED_NUMBER;
                if (!callingNumber.startsWith(numberPrefix) && !calledNumber.startsWith(numberPrefix)) {
                    return false;
                }
            }

            // Search term
            if (searchTerm) {
                const searchFields = isZFormat ? 
                    [row['Calling Number'], row['Called Number'], row['Call Location']] :
                    [row.CALLER_NUMBER, row.CALLED_NUMBER, row.CITY];
                
                return searchFields.some(field => 
                    String(field).toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            return true;
        });
    }, [data, dateRange, selectedLocations, selectedCallTypes, searchTerm, durationRange, timeOfDay, numberPrefix, isZFormat]);

    // Calculate statistics
    const stats = useMemo(() => ({
        totalRecords: filteredData.length,
        uniqueCallers: new Set(filteredData.map(row => 
            isZFormat ? row['Calling Number'] : row.CALLER_NUMBER
        )).size,
        uniqueLocations: new Set(filteredData.map(row => 
            isZFormat ? row['Call Location'] : row.CITY
        )).size,
        avgDuration: Math.round(
            filteredData.reduce((acc, row) => acc + getDuration(row), 0) / filteredData.length
        ) || 0
    }), [filteredData, isZFormat]);

    // Get columns
    const columns = useMemo(() => {
        if (isZFormat) {
            return ['Date', 'CALL_TYPE', 'Duration', 'Calling Number', 'Called Number', 'Call Location', 'Site ID'];
        } else {
            return ['CALL_INITIAL_TIME', 'CALLER_NUMBER', 'CALLED_NUMBER', 'CITY', 'SITE_NAME', 'SITE_ID'];
        }
    }, [isZFormat]);

    // Clear all filters
    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setSelectedLocations([]);
        setSelectedCallTypes([]);
        setSearchTerm('');
        setDurationRange([0, 1000]);
        setTimeOfDay([0, 24]);
        setNumberPrefix('');
    };

    // Render filters section
    const FiltersSection = () => (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" component="div">
                            <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {strings.filterData}
                        </Typography>
                        <Button
                            startIcon={<ClearAllIcon />}
                            onClick={clearFilters}
                            color="primary"
                        >
                            {strings.clearFilters}
                        </Button>
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label={strings.startDate}
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label={strings.endDate}
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ px: 2 }}>
                        <Typography gutterBottom>
                            <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {strings.timeOfDay}
                        </Typography>
                        <Slider
                            value={timeOfDay}
                            onChange={(e, newValue) => setTimeOfDay(newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={24}
                            marks={[
                                { value: 0, label: '00:00' },
                                { value: 6, label: '06:00' },
                                { value: 12, label: '12:00' },
                                { value: 18, label: '18:00' },
                                { value: 24, label: '24:00' }
                            ]}
                        />
                    </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>{strings.location}</InputLabel>
                        <Select
                            multiple
                            value={selectedLocations}
                            onChange={(e) => setSelectedLocations(e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} />
                                    ))}
                                </Box>
                            )}
                        >
                            {uniqueLocations.map((location) => (
                                <MenuItem key={location} value={location}>
                                    {location}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>{strings.callType}</InputLabel>
                        <Select
                            multiple
                            value={selectedCallTypes}
                            onChange={(e) => setSelectedCallTypes(e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} />
                                    ))}
                                </Box>
                            )}
                        >
                            {uniqueCallTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label={strings.numberPrefix}
                        value={numberPrefix}
                        onChange={(e) => setNumberPrefix(e.target.value)}
                        placeholder="07X..."
                    />
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ px: 2 }}>
                        <Typography gutterBottom>
                            {strings.durationRange}
                        </Typography>
                        <Slider
                            value={durationRange}
                            onChange={(e, newValue) => setDurationRange(newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={1000}
                            marks={[
                                { value: 0, label: '0s' },
                                { value: 250, label: '250s' },
                                { value: 500, label: '500s' },
                                { value: 750, label: '750s' },
                                { value: 1000, label: '1000s+' }
                            ]}
                        />
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label={strings.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={strings.searchPlaceholder}
                    />
                </Grid>
            </Grid>

            {/* Applied Filters */}
            {(dateRange.start || dateRange.end || selectedLocations.length > 0 || 
              selectedCallTypes.length > 0 || searchTerm || numberPrefix || 
              durationRange[0] > 0 || durationRange[1] < 1000 || 
              timeOfDay[0] > 0 || timeOfDay[1] < 24) && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {dateRange.start && (
                        <Chip
                            label={`${strings.from}: ${dateRange.start}`}
                            onDelete={() => setDateRange(prev => ({ ...prev, start: '' }))}
                        />
                    )}
                    {dateRange.end && (
                        <Chip
                            label={`${strings.to}: ${dateRange.end}`}
                            onDelete={() => setDateRange(prev => ({ ...prev, end: '' }))}
                        />
                    )}
                    {selectedLocations.map(location => (
                        <Chip
                            key={location}
                            label={location}
                            onDelete={() => setSelectedLocations(prev => prev.filter(l => l !== location))}
                        />
                    ))}
                    {selectedCallTypes.map(type => (
                        <Chip
                            key={type}
                            label={type}
                            onDelete={() => setSelectedCallTypes(prev => prev.filter(t => t !== type))}
                        />
                    ))}
                    {numberPrefix && (
                        <Chip
                            label={`${strings.numberPrefix}: ${numberPrefix}`}
                            onDelete={() => setNumberPrefix('')}
                        />
                    )}
                    {searchTerm && (
                        <Chip
                            label={`${strings.search}: ${searchTerm}`}
                            onDelete={() => setSearchTerm('')}
                        />
                    )}
                </Box>
            )}
        </Paper>
    );

    // Render data content
    const DataContent = () => (
        <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {strings.totalRecords}
                            </Typography>
                            <Typography variant="h4">
                                {stats.totalRecords}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {strings.uniqueCallers}
                            </Typography>
                            <Typography variant="h4">
                                {stats.uniqueCallers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                                {strings.uniqueLocations}
                            </Typography>
                            <Typography variant="h4">
                                {stats.uniqueLocations}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {strings.avgDuration}
                            </Typography>
                            <Typography variant="h4">
                                {stats.avgDuration}s
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ height: isFullScreen ? 'calc(100vh - 400px)' : 440 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map(column => (
                                    <TableCell 
                                        key={column}
                                        sx={{ 
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {column}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => (
                                    <TableRow 
                                        key={index}
                                        sx={{
                                            '&:nth-of-type(odd)': {
                                                backgroundColor: 'action.hover',
                                            },
                                            '&:hover': {
                                                backgroundColor: 'action.selected',
                                            }
                                        }}
                                    >
                                        {columns.map(column => (
                                            <TableCell key={column}>
                                                {row[column]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Tooltip title={isFullScreen ? strings.exitFullScreen : strings.fullScreenView}>
                    <IconButton 
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        color="primary"
                    >
                        {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            {!isFullScreen ? (
                <>
                    <FiltersSection />
                    <DataContent />
                </>
            ) : (
                <Dialog
                    fullScreen
                    open={isFullScreen}
                    onClose={() => setIsFullScreen(false)}
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{strings.dataExplorer}</Typography>
                            <IconButton 
                                onClick={() => setIsFullScreen(false)}
                                color="primary"
                            >
                                <FullscreenExitIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <FiltersSection />
                        <DataContent />
                    </DialogContent>
                </Dialog>
            )}
        </Box>
    );
};

export default DataExplorer;