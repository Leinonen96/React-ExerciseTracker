// src/components/AddExercise.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Typography,
  Container,
  TextField,
  Button,
  Box,
  IconButton,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // Using Day.js adapter
import dayjs from 'dayjs'; // Import Day.js

const categories = [
  'Back',
  'Chest',
  'Legs',
  'Arms',
  'Shoulders',
  'Abs',
];

const AddExercise = () => {
  const [date, setDate] = useState(dayjs()); // Shared date for all exercises
  const [exercises, setExercises] = useState([
    { category: '', exerciseName: '', sets: [{ weight: '', reps: '' }] },
  ]);

  // Snackbar state for user feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' | 'error' | 'warning' | 'info'

  // Define the API base URL using Vite's environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Function to handle adding a new exercise
  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { category: '', exerciseName: '', sets: [{ weight: '', reps: '' }] },
    ]);
  };

  // Function to handle removing an exercise
  const handleRemoveExercise = (index) => {
    const newExercises = exercises.filter((_, idx) => idx !== index);
    setExercises(newExercises);
  };

  // Function to handle input changes for exercises
  const handleExerciseChange = (index, field, value) => {
    const newExercises = exercises.map((exercise, idx) => {
      if (idx === index) {
        return { ...exercise, [field]: value };
      }
      return exercise;
    });
    setExercises(newExercises);
  };

  // Function to handle adding a set within an exercise
  const handleAddSet = (exerciseIndex) => {
    const newExercises = exercises.map((exercise, idx) => {
      if (idx === exerciseIndex) {
        return {
          ...exercise,
          sets: [...exercise.sets, { weight: '', reps: '' }],
        };
      }
      return exercise;
    });
    setExercises(newExercises);
  };

  // Function to handle removing a set within an exercise
  const handleRemoveSet = (exerciseIndex, setIndex) => {
    const newExercises = exercises.map((exercise, idx) => {
      if (idx === exerciseIndex) {
        const newSets = exercise.sets.filter((_, sIdx) => sIdx !== setIndex);
        return { ...exercise, sets: newSets };
      }
      return exercise;
    });
    setExercises(newExercises);
  };

  // Function to handle input changes for sets
  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    const newExercises = exercises.map((exercise, idx) => {
      if (idx === exerciseIndex) {
        const newSets = exercise.sets.map((set, sIdx) => {
          if (sIdx === setIndex) {
            return { ...set, [field]: value };
          }
          return set;
        });
        return { ...exercise, sets: newSets };
      }
      return exercise;
    });
    setExercises(newExercises);
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!date) {
      setSnackbarMessage('Please select a date.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (exercises.length === 0) {
      setSnackbarMessage('Please add at least one exercise.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    for (let i = 0; i < exercises.length; i++) {
      const { category, exerciseName, sets } = exercises[i];
      if (!category || !exerciseName) {
        setSnackbarMessage(`Please fill in all required fields for exercise ${i + 1}.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (sets.length === 0) {
        setSnackbarMessage(`Please add at least one set for exercise ${i + 1}.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      for (let j = 0; j < sets.length; j++) {
        const { weight, reps } = sets[j];
        if (weight === '' || reps === '') { // Allow weight = 0
          setSnackbarMessage(`Please fill in weight and reps for set ${j + 1} of exercise ${i + 1}.`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
      }
    }

    // Prepare data for backend
    const preparedExercises = exercises.map((exercise) => ({
      date: date.format('YYYY-MM-DD'), // Format: YYYY-MM-DD
      category: exercise.category,
      exerciseName: exercise.exerciseName,
      sets: exercise.sets.map((set) => ({
        weight: parseInt(set.weight, 10),
        reps: parseInt(set.reps, 10),
      })),
    }));

    try {
      // Send POST request to the backend
      const response = await axios.post(`${API_BASE_URL}/exercises`, preparedExercises);

      if (response.status === 201) {
        // Reset the form
        setDate(dayjs());
        setExercises([
          { category: '', exerciseName: '', sets: [{ weight: '', reps: '' }] },
        ]);

        // Provide user feedback
        setSnackbarMessage('Exercises added successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Handle unexpected response statuses
        setSnackbarMessage('Unexpected response from the server.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error adding exercises:', error);

      // Extract error message from the backend, if available
      const errorMessage = error.response?.data?.error || 'Failed to add exercises. Please try again.';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add Exercises
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Date Picker */}
            <Grid item xs={12}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                renderInput={(params) => <TextField {...params} required fullWidth variant="filled" />}
              />
            </Grid>

            {/* Exercises Section */}
            {exercises.map((exercise, exerciseIndex) => (
              <Grid item xs={12} key={exerciseIndex}>
                <Box
                  sx={{
                    border: '1px solid #555', // Slightly lighter border for dark theme
                    borderRadius: 2, // Theme-based border radius
                    padding: 2, // Theme-based spacing
                    mb: 2,
                    position: 'relative',
                    backgroundColor: 'background.paper', // Use theme's paper background
                  }}
                >
                  {exercises.length > 1 && (
                    <IconButton
                      aria-label="remove exercise"
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      sx={{ position: 'absolute', top: 8, right: 8, color: 'secondary.main' }}
                    >
                      <RemoveCircleOutline />
                    </IconButton>
                  )}
                  <Typography variant="h6" gutterBottom>
                    Exercise {exerciseIndex + 1}
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Category Select */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Category"
                        value={exercise.category}
                        onChange={(e) => handleExerciseChange(exerciseIndex, 'category', e.target.value)}
                        required
                        fullWidth
                        variant="filled" // Filled variant for dark theme
                        InputLabelProps={{
                          style: { color: '#fff' }, // White label
                        }}
                        sx={{
                          '& .MuiInputBase-input': { color: '#fff' }, // White input text
                          '& .MuiSelect-icon': { color: '#fff' }, // White select icon
                        }}
                      >
                        {categories.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Exercise Name */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Exercise Name"
                        value={exercise.exerciseName}
                        onChange={(e) => handleExerciseChange(exerciseIndex, 'exerciseName', e.target.value)}
                        required
                        fullWidth
                        variant="filled" // Filled variant for dark theme
                        InputLabelProps={{
                          style: { color: '#fff' }, // White label
                        }}
                        sx={{
                          '& .MuiInputBase-input': { color: '#fff' }, // White input text
                        }}
                      />
                    </Grid>

                    {/* Sets Section */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">Sets</Typography>
                      {exercise.sets.map((set, setIndex) => (
                        <Box key={setIndex} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {/* Weight */}
                          <TextField
                            label={`Set ${setIndex + 1} Weight (kg)`}
                            type="number"
                            value={set.weight}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                            required
                            variant="filled"
                            sx={{ mr: 2, flex: 1 }}
                            InputLabelProps={{
                              style: { color: '#fff' },
                            }}
                            InputProps={{
                              style: { color: '#fff' },
                            }}
                          />

                          {/* Reps */}
                          <TextField
                            label={`Set ${setIndex + 1} Reps`}
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                            required
                            variant="filled"
                            sx={{ mr: 2, flex: 1 }}
                            InputLabelProps={{
                              style: { color: '#fff' },
                            }}
                            InputProps={{
                              style: { color: '#fff' },
                            }}
                          />

                          {/* Remove Set */}
                          {exercise.sets.length > 1 && (
                            <IconButton
                              color="secondary"
                              onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                              aria-label="remove set"
                            >
                              <RemoveCircleOutline />
                            </IconButton>
                          )}
                        </Box>
                      ))}

                      {/* Add Set Button */}
                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<AddCircleOutline />}
                          onClick={() => handleAddSet(exerciseIndex)}
                          color="secondary"
                        >
                          Add Set
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}

            {/* Add Exercise Button */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddCircleOutline />}
                onClick={handleAddExercise}
                color="secondary"
              >
                Add New Exercise
              </Button>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button type="submit" variant="outlined" color="success">
                Save Exercises
              </Button>
            </Grid>
          </Grid>
        </Box>

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
            variant="filled" // Filled variant for better visibility on dark backgrounds
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default AddExercise;
