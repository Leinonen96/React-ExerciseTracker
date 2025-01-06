// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AppBar, Tabs, Tab, Toolbar, Typography, useTheme } from '@mui/material';

const App = () => {
  const location = useLocation();
  const theme = useTheme(); // Access the theme
  
  const currentTab = () => {
    switch (location.pathname) {
      case '/add-exercise':
        return 0;
      case '/exercise-log':
        return 1;
      case '/user-info':
        return 2;
      case '/exercise-data':
        return 3;
      default:
        return false;
    }
  };

  const [tabIndex, setTabIndex] = useState(currentTab());

  useEffect(() => {
    setTabIndex(currentTab());
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <AppBar
        position="static"
        color="primary"
        sx={{
          backgroundColor: '#000000', // Darker background
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Optional shadow
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: '#ffffff' }}>
            Exercise Tracker
          </Typography>
          <Tabs
            value={tabIndex}
            onChange={handleChange}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Add Exercise" component={Link} to="/add-exercise" />
            <Tab label="Exercise Log" component={Link} to="/exercise-log" />
            <Tab label="User Info" component={Link} to="/user-info" />
            <Tab label="Exercise Data" component={Link} to="/exercise-data" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Outlet />
    </>
  );
};

export default App;
