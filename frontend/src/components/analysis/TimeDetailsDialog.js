import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import strings from "../../utils/strings";

const TimeDetailsDialog = ({ open, onClose, data, time, isZFormat }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
    }

    const columns = isZFormat ? 
        ['Date', 'CALL_TYPE', 'Duration', 'Calling Number', 'Called Number', 'Call Location', 'Site ID'] :
        ['E_REPORT', 'CALLER_NUMBER', 'CALLED_NUMBER', 'CALL_INITIAL_TIME', 'CITY', 'SITE_NAME', 'SITE_ID'];

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xl"
            fullWidth
        >
            <DialogTitle>
                {`${strings.timeDetails} ${time}`}
            </DialogTitle>
            <DialogContent>
                <TableContainer component={Paper}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
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
                            {data.map((row, index) => (
                                <TableRow 
                                    key={index}
                                    sx={{
                                        '&:nth-of-type(odd)': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column}>
                                            {row[column]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    {strings.close}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TimeDetailsDialog;
