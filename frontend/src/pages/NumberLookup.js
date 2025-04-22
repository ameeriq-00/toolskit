import React, { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import axios from 'axios';
import strings from '../localization/strings';

function NumberLookup() {
  const [number, setNumber] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://localhost:8000/api/number-lookup/?number=${number}`);
      setResult(response.data);
    } catch (error) {
      console.error('Error looking up number:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" className="page-title">
        {strings.numberLookup}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label={strings.enterNumber}
          fullWidth
          margin="normal"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="form-control"
        />
        <Button type="submit" variant="contained" color="primary" className="button">
          {strings.lookup}
        </Button>
      </form>
      {result && (
        <div>
          <Typography variant="h6" className="result-title">{strings.lookupResult}</Typography>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </Container>
  );
}

export default NumberLookup;
