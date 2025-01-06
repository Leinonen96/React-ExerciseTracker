// src/components/UserInfo.jsx

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Grid,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const genders = ['Male', 'Female', 'Other'];

const UserInfo = () => {
  const [userInfo, setUserInfo] = useState({
    name: '',
    height: '',
    weight: '',
    birthdate: null,
    gender: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false); // Submission state

  // Snackbar states for user feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' | 'error' | 'warning' | 'info'

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // API Base URL using Vite's environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Access the theme to use secondary color
  const theme = useTheme();

  // Load user info from backend on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user`);
        setUserInfo({
          name: response.data.name,
          height: response.data.height,
          weight: response.data.weight,
          birthdate: response.data.birthdate ? dayjs(response.data.birthdate) : null,
          gender: response.data.gender,
        });
        setIsLoading(false);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // User not found, prompt to create one
          setSnackbarMessage('No user information found. Please create your profile.');
          setSnackbarSeverity('info');
          setSnackbarOpen(true);
        } else {
          setSnackbarMessage('Error fetching user information.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
        setIsLoading(false);
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle input changes
  const handleChange = (field, value) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSave = (e) => {
    e?.preventDefault();
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    setConfirmDialogOpen(false);

    // Validate inputs
    if (
      !userInfo.name.trim() ||
      !userInfo.height ||
      !userInfo.weight ||
      !userInfo.birthdate ||
      !userInfo.gender
    ) {
      setSnackbarMessage('Please fill in all required fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (isNaN(userInfo.height) || Number(userInfo.height) <= 0) {
      setSnackbarMessage('Height must be a positive number.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (isNaN(userInfo.weight) || Number(userInfo.weight) <= 0) {
      setSnackbarMessage('Weight must be a positive number.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user exists by attempting to fetch again
      await axios.get(`${API_BASE_URL}/user`);

      // If user exists, update
      await axios.put(`${API_BASE_URL}/user`, {
        name: userInfo.name.trim(),
        height: Number(userInfo.height),
        weight: Number(userInfo.weight),
        birthdate: userInfo.birthdate.format('YYYY-MM-DD'),
        gender: userInfo.gender,
      });

      setSnackbarMessage('User information updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // User does not exist, create
        try {
          await axios.post(`${API_BASE_URL}/user`, {
            name: userInfo.name.trim(),
            height: Number(userInfo.height),
            weight: Number(userInfo.weight),
            birthdate: userInfo.birthdate.format('YYYY-MM-DD'),
            gender: userInfo.gender,
          });
          setSnackbarMessage('User information created successfully!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (postError) {
          setSnackbarMessage('Error creating user information.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          console.error(postError);
        }
      } else {
        setSnackbarMessage('Error updating user information.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error(error);
      }
    }

    setIsSubmitting(false);
    setIsEditing(false);
  };

  // Handle form reset
  const handleCancel = () => {
    // Reset to existing user info
    const resetForm = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user`);
        setUserInfo({
          name: response.data.name,
          height: response.data.height,
          weight: response.data.weight,
          birthdate: response.data.birthdate ? dayjs(response.data.birthdate) : null,
          gender: response.data.gender,
        });
      } catch (error) {
        // If user doesn't exist, clear the form
        setUserInfo({
          name: '',
          height: '',
          weight: '',
          birthdate: null,
          gender: '',
        });
      }
    };

    resetForm();
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading user information...
        </Typography>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          User Information
        </Typography>

        <Box
          component="form"
          noValidate
          sx={{
            '& .MuiTextField-root': {
              mb: 2,
            },
          }}
        >
          <Grid container spacing={3}>
            {/* Name */}
            <Grid item xs={12}>
              <TextField
                required
                label="Name"
                fullWidth
                value={userInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                InputProps={{
                  readOnly: !isEditing,
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isEditing ? theme.palette.secondary.main : 'default',
                    },
                  },
                }}
              />
            </Grid>

            {/* Height */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Height (cm)"
                type="number"
                fullWidth
                value={userInfo.height}
                onChange={(e) => handleChange('height', e.target.value)}
                InputProps={{
                  readOnly: !isEditing,
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isEditing ? theme.palette.secondary.main : 'default',
                    },
                  },
                }}
              />
            </Grid>

            {/* Weight */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Weight (kg)"
                type="number"
                fullWidth
                value={userInfo.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                InputProps={{
                  readOnly: !isEditing,
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isEditing ? theme.palette.secondary.main : 'default',
                    },
                  },
                }}
              />
            </Grid>

            {/* Birthdate */}
            <Grid item xs={12}>
              <DatePicker
                label="Birthdate"
                value={userInfo.birthdate}
                onChange={(newValue) => handleChange('birthdate', newValue)}
                disabled={!isEditing}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      readOnly: !isEditing,
                    },
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: isEditing ? theme.palette.secondary.main : 'default',
                        },
                      },
                    },
                  },
                }}
              />
            </Grid>


            {/* Gender */}
            <Grid item xs={12}>
              <TextField
                required
                select
                label="Gender"
                fullWidth
                value={userInfo.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                InputProps={{
                  readOnly: !isEditing,
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isEditing ? theme.palette.secondary.main : 'default',
                    },
                  },
                }}
              >
                {genders.map((gender) => (
                  <MenuItem key={gender} value={gender}>
                    {gender}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>Confirm Save</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to save the changes?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} color="white" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for User Feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default UserInfo;
