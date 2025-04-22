import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Unauthorized Access
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          You don't have permission to access this page.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
}

export default Unauthorized;
