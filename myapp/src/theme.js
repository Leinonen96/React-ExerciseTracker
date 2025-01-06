// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Enable dark mode
    primary: {
      main: '#424242', // Dark gray as primary color
    },
    secondary: {
      main: '#ff1744', // Red as secondary color
    },
    background: {
      default: '#303030', // Dark background color for the app
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      textTransform: 'uppercase',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          marginBottom: '10px', // Small gap below AppBar
          zIndex: 1300, // Ensure AppBar is always on top
        },
      },
    },
  },
});

export default theme;
