import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import strings from '../localization/strings'; // Import strings

function DataTable({ data }) {
  if (!data || data.length === 0) {
    return <Typography>{strings.noDataAvailable}</Typography>;
  }

  const columns = Object.keys(data[0]);

  return (
    <TableContainer component={Paper}>
      <Table className="data-table" aria-label="simple table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column}>{column}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column}>{row[column]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DataTable;
