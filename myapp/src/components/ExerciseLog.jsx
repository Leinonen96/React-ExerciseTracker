// src/components/ExerciseLog.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ExerciseLog = () => {
  const [exercises, setExercises] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const scrollContainerRef = useRef(null);

  // Function to scroll to the bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Fetch exercises from backend
  const fetchExercises = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/exercises`);
      setExercises(response.data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setSnackbarMessage('Failed to fetch exercises.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [exercises]);

  // Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        await axios.delete(`${API_BASE_URL}/exercises/${id}`);
        setExercises(exercises.filter((exercise) => exercise.id !== id));
        setSnackbarMessage('Exercise deleted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Error deleting exercise:', error);
        setSnackbarMessage('Failed to delete exercise.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  // Handle Close Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Generate Sample Data: 3 Separate Days, 3 Exercises Each, 3 Sets Each
  const generateSampleData = async () => {
    setIsGenerating(true);
    // Define 3 distinct dates
    const today = new Date();
    const sampleDates = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate()), // Today
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), // Yesterday
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2), // Day before yesterday
    ];

    // Define 3 distinct exercises
    const sampleExercises = [
      {
        category: 'Chest',
        exerciseName: 'Bench Press',
        sets: [
          { weight: 80, reps: 10 },
          { weight: 85, reps: 8 },
          { weight: 90, reps: 6 },
        ],
      },
      {
        category: 'Back',
        exerciseName: 'Pull-Ups',
        sets: [
          { weight: 0, reps: 12 },
          { weight: 0, reps: 10 },
          { weight: 0, reps: 8 },
        ],
      },
      {
        category: 'Legs',
        exerciseName: 'Squats',
        sets: [
          { weight: 100, reps: 10 },
          { weight: 105, reps: 8 },
          { weight: 110, reps: 6 },
        ],
      },
    ];

    const generatedExercises = [];

    // Iterate over each date
    for (let dateObj of sampleDates) {
      const formattedDate = dateObj.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Iterate over each exercise
      for (let exercise of sampleExercises) {
        generatedExercises.push({
          date: formattedDate,
          category: exercise.category,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
        });
      }
    }

    try {
      // Send POST requests for each exercise
      for (let exercise of generatedExercises) {
        await axios.post(`${API_BASE_URL}/exercises`, exercise);
      }
      fetchExercises(); // Refresh the exercises list
      setSnackbarMessage('Sample data generated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error generating sample data:', error);
      setSnackbarMessage('Failed to generate sample data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsGenerating(false);
      setConfirmOpen(false);
    }
  };

  // Group exercises by date
  const groupExercisesByDate = () => {
    const grouped = exercises.reduce((acc, exercise) => {
      if (!acc[exercise.date]) {
        acc[exercise.date] = [];
      }
      acc[exercise.date].push(exercise);
      return acc;
    }, {});

    // Sort the dates in ascending order (oldest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

    const groupedArray = sortedDates.map((date) => ({
      date,
      exercises: grouped[date],
    }));

    return groupedArray;
  };

  const groupedExercises = groupExercisesByDate();

  return (
    <Container
      maxWidth="xl" // Use 'xl' for maximum width
      sx={{
        mt: 4,
        mb: 4,
        px: { xs: 2, sm: 4, md: 6 }, // Responsive horizontal padding
      }}
    >
      <Typography variant="h4" gutterBottom>
        Exercise Log
      </Typography>

      {/* Generate Sample Data Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={() => setConfirmOpen(true)}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Sample Data'}
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Generate Sample Data</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Are you sure you want to generate sample data? This will add 9 exercises across 3 days.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={generateSampleData}
            color="success"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scrollable Container */}
      <Box
        ref={scrollContainerRef}
        sx={{
          maxHeight: '70vh', // Adjust as needed
          overflowY: 'auto',
          paddingRight: 2, // Optional: to accommodate scrollbar
          // Scrollbar styling for WebKit browsers
          '&::-webkit-scrollbar': {
            width: '12px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#424242', // Match paper background
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#ff1744', // Use secondary color
            borderRadius: '6px',
            border: '3px solid #424242', // Space around scrollbar thumb
          },
          // Scrollbar styling for Firefox
          scrollbarWidth: 'thin', // "auto" or "thin"
          scrollbarColor: '#ff1744 #424242', // thumb and track colors
        }}
      >
        {/* Background Frame using Paper */}
        <Paper
          elevation={3}
          sx={{
            p: 2, // Padding inside the frame
            backgroundColor: 'background.paper', // Use theme's paper background
            borderRadius: 2, // Rounded corners
          }}
        >
          {/* Display Exercise Log */}
          {exercises.length === 0 ? (
            <Typography variant="body1">No exercises recorded yet.</Typography>
          ) : (
            groupedExercises.map((group) => (
              <Box key={group.date} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Date: {group.date}
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: '60vh', mb: 2 }}>
                  <Table stickyHeader aria-label="exercise log table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Exercise Name</TableCell>
                        <TableCell>Sets</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.exercises.map((exercise) => (
                        <TableRow key={exercise.id} hover>
                          <TableCell>{exercise.category}</TableCell>
                          <TableCell>{exercise.exerciseName}</TableCell>
                          <TableCell>
                            {exercise.sets.map((set, setIndex) => (
                              <Box key={setIndex} sx={{ mb: 0.5 }}>
                                Set {setIndex + 1}: {set.weight} kg x {set.reps} reps
                              </Box>
                            ))}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(exercise.id)}
                              aria-label="delete exercise"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          )}
        </Paper>
      </Box>

      {/* Snackbar for User Feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled" // Filled variant for better visibility on dark backgrounds
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ExerciseLog;
