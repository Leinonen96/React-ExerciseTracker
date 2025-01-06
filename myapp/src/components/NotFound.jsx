// src/components/NotFound.jsx
import React from 'react';
import { useRouteError } from 'react-router-dom';
import { Typography, Container } from '@mui/material';

const NotFound = () => {
  const error = useRouteError();

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1">
        Sorry, the page you are looking for does not exist.
      </Typography>
      {error && (
        <Typography variant="body2" color="error">
          {error.statusText || error.message}
        </Typography>
      )}
    </Container>
  );
};

export default NotFound;
