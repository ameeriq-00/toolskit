import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import strings from '../localization/strings';

function Header() {
  return (
    <AppBar position="static" className="header">
      <Toolbar>
        <Typography variant="h6">
          {strings.appTitle}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
