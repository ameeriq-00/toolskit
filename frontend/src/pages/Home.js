import React from 'react';
import { Typography, Container } from '@mui/material';
import strings from '../localization/strings';

function Home() {
  return (
    <Container>
      <Typography variant="h4" component="h1" className="page-title">
        {strings.welcomeMessage}
      </Typography>
      <Typography variant="body1" className="content">
        {strings.description}
      </Typography>
    </Container>
  );
}

export default Home;
