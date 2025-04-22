import React from 'react';
import { Box, Typography } from '@mui/material';
import strings from '../localization/strings';

function Footer() {
  return (
    <Box component="footer" className="footer">
      <Typography variant="body2" color="text.secondary">
        © 2023 {strings.appTitle}. All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;
