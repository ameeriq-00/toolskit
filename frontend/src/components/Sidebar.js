import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import { Home, Login, TableChart, Search } from '@mui/icons-material';
import strings from '../localization/strings';

function Sidebar() {
  const menuItems = [
    { text: strings.welcomeMessage, icon: <Home />, path: '/' },
    { text: strings.login, icon: <Login />, path: '/login' },
    { text: strings.analyze, icon: <TableChart />, path: '/excel-analyzer' },
    { text: strings.siteMap, icon: <Search />, path: '/number-lookup' },
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      className="sidebar"
    >
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;
