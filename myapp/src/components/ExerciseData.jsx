// src/components/ExerciseData.jsx

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PieActiveArc from './PieActiveArc.jsx';
import { Link } from 'react-router-dom';
import axios from 'axios';
// Import the LineChart from @mui/x-charts
import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '@mui/material/styles';

const ExerciseData = () => {
  const theme = useTheme();

  const [userInfo, setUserInfo] = useState(null);
  const [exercises, setExercises] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [exercisesList, setExercisesList] = useState([]);
  const [selectedExerciseName, setSelectedExerciseName] = useState('');

  const [exerciseDates, setExerciseDates] = useState([]);
  const [selectedExerciseDate, setSelectedExerciseDate] = useState(null);

  const [oneRM, setOneRM] = useState(null);
  const [relativeStrength, setRelativeStrength] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [workoutDistribution, setWorkoutDistribution] = useState([]);

  const [selectedExerciseEntry, setSelectedExerciseEntry] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // State for bigger picture mode
  const [fullScreenChartOpen, setFullScreenChartOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/user`);
        setUserInfo(userResponse.data);

        const exercisesResponse = await axios.get(`${API_BASE_URL}/exercises`);
        setExercises(exercisesResponse.data);

        const uniqueCategories = [
          ...new Set(exercisesResponse.data.map((ex) => ex.category)),
        ];
        setCategories(uniqueCategories);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data from API:', error);
        setFetchError('Failed to load data from the server.');
        setSnackbarMessage('Failed to load data from the server.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (selectedCategory) {
      const filteredExercises = exercises.filter(
        (ex) => ex.category === selectedCategory
      );

      const uniqueExercises = [
        ...new Set(filteredExercises.map((ex) => ex.exerciseName)),
      ];
      setExercisesList(uniqueExercises);

      // Reset dependent states
      setSelectedExerciseName('');
      setExerciseDates([]);
      setSelectedExerciseDate(null);
      setSelectedExerciseEntry(null);
      setOneRM(null);
      setRelativeStrength(null);
    } else {
      setExercisesList([]);
      setSelectedExerciseName('');
      setExerciseDates([]);
      setSelectedExerciseDate(null);
      setSelectedExerciseEntry(null);
      setOneRM(null);
      setRelativeStrength(null);
    }
  }, [selectedCategory, exercises]);

  useEffect(() => {
    if (selectedExerciseName) {
      const filteredExercises = exercises.filter(
        (ex) =>
          ex.category === selectedCategory && ex.exerciseName === selectedExerciseName
      );

      const dates = filteredExercises.map((ex) => ex.date);
      const sortedDates = dates.sort((a, b) => (a < b ? 1 : -1));
      setExerciseDates(sortedDates);

      if (sortedDates.length > 0) {
        setSelectedExerciseDate(dayjs(sortedDates[0]));
      } else {
        setSelectedExerciseDate(null);
        setSelectedExerciseEntry(null);
        setOneRM(null);
        setRelativeStrength(null);
      }
    } else {
      setExerciseDates([]);
      setSelectedExerciseDate(null);
      setSelectedExerciseEntry(null);
      setOneRM(null);
      setRelativeStrength(null);
    }
  }, [selectedExerciseName, selectedCategory, exercises]);

  useEffect(() => {
    if (selectedExerciseDate && selectedExerciseName) {
      const formattedDate = selectedExerciseDate.format('YYYY-MM-DD');
      const exerciseEntry = exercises.find(
        (ex) =>
          ex.category === selectedCategory &&
          ex.exerciseName === selectedExerciseName &&
          ex.date === formattedDate
      );

      setSelectedExerciseEntry(exerciseEntry || null);

      if (exerciseEntry) {
        const calculatedOneRM = exerciseEntry.sets.reduce((max, set) => {
          const currentOneRM = set.weight * (1 + 0.0333 * set.reps);
          return currentOneRM > max ? currentOneRM : max;
        }, 0);
        setOneRM(calculatedOneRM.toFixed(2));

        if (userInfo && userInfo.weight) {
          const relStrength = calculatedOneRM / userInfo.weight;
          setRelativeStrength(relStrength.toFixed(2));
        } else {
          setRelativeStrength(null);
        }

        setSnackbarMessage('1RM and Relative Strength calculated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setOneRM(null);
        setRelativeStrength(null);
        setSnackbarMessage('No exercise found for the selected date.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      setSelectedExerciseEntry(null);
      setOneRM(null);
      setRelativeStrength(null);
    }
  }, [selectedExerciseDate, selectedExerciseName, selectedCategory, exercises, userInfo]);

  useEffect(() => {
    if (selectedMonth) {
      const month = selectedMonth.month();
      const year = selectedMonth.year();

      const filteredExercises = exercises.filter((ex) => {
        const exDate = dayjs(ex.date);
        return exDate.month() === month && exDate.year() === year;
      });

      const categoryCount = {};
      filteredExercises.forEach((ex) => {
        categoryCount[ex.category] = (categoryCount[ex.category] || 0) + 1;
      });

      const distributionData = Object.keys(categoryCount).map((category) => ({
        label: category,
        value: categoryCount[category],
      }));

      setWorkoutDistribution(distributionData);
    } else {
      setWorkoutDistribution([]);
    }
  }, [selectedMonth, exercises]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Compute dataset for line chart: For the selected exercise, show 1RM over all dates
  const [lineChartData, setLineChartData] = useState([]);

  useEffect(() => {
    if (selectedExerciseName) {
      // Filter for all entries of the selected exercise
      const filtered = exercises.filter(
        (ex) =>
          ex.category === selectedCategory &&
          ex.exerciseName.toLowerCase() === selectedExerciseName.toLowerCase()
      );

      // Map each date's max 1RM
      const dataForLine = filtered.map((ex) => {
        const maxOneRM = ex.sets.reduce((max, set) => {
          const currentOneRM = set.weight * (1 + 0.0333 * set.reps);
          return currentOneRM > max ? currentOneRM : max;
        }, 0);

        return {
          x: ex.date, // date on x-axis
          y: parseFloat(maxOneRM.toFixed(2)), // 1RM on y-axis
        };
      });

      // Sort by date ascending
      dataForLine.sort((a, b) => (a.x > b.x ? 1 : -1));
      setLineChartData(dataForLine);
    } else {
      setLineChartData([]);
    }
  }, [selectedExerciseName, selectedCategory, exercises]);

  // Chart theme customization using CSS variables (refer to MUI X Charts docs)
  const axisLineColor = theme.palette.divider;
  const textColor = theme.palette.text.primary;
  const tooltipBg = theme.palette.background.default;
  const tooltipColor = theme.palette.text.primary;
  const gridLineColor = '#505050'; // or theme.palette.divider, if you prefer

  const lineChartProps = {
    dataset: lineChartData,
    xAxis: [{ dataKey: 'x', scaleType: 'band', label: 'Date' }],
    series: [
      {
        dataKey: 'y',
        label: '1RM (kg)',
        marker: { visible: true, size: 6 },
        color: theme.palette.secondary.main,
      },
    ],
    height: 300,
    margin: { left: 30, right: 30, top: 30, bottom: 30 },
    grid: { vertical: true, horizontal: true },
    tooltip: {
      trigger: 'item',
      formatter: (point) => `Date: ${point.x}\n1RM: ${point.y} kg`,
    },
    sx: {
      '--Charts-axis-lineColor': axisLineColor,
      '--Charts-axis-titleColor': textColor,
      '--Charts-axis-labelColor': textColor,
      '--Charts-grid-lineColor': gridLineColor,
      '--Charts-tooltip-bg': tooltipBg,
      '--Charts-tooltip-color': tooltipColor,
    },
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {fetchError}
        </Typography>
        <Button component={Link} to="/" variant="contained" color="primary">
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Exercise Data
        </Typography>

        {/* BMI Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Body Mass Index (BMI)
            <Tooltip
              title={
                <Typography variant="body2">
                  BMI is Weight (kg) / (Height (m))²
                </Typography>
              }
              arrow
            >
              <IconButton size="small" sx={{ ml: 1 }} aria-label="BMI Explanation">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          {userInfo && userInfo.height && userInfo.weight ? (
            <Typography variant="body1">
              Your BMI is:{' '}
              <strong>
                {(
                  userInfo.weight /
                  Math.pow(userInfo.height / 100, 2)
                ).toFixed(2)}
              </strong>
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Please update your{' '}
              <Button component={Link} to="/user-info">
                user information
              </Button>{' '}
              to view BMI.
            </Typography>
          )}
        </Box>

        {/* 1RM Calculator Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            One Rep Max (1RM) Calculator
            <Tooltip
              title={
                <Typography variant="body2">
                  1RM = Weight × (1 + 0.0333 × Reps)
                </Typography>
              }
              arrow
            >
              <IconButton size="small" sx={{ ml: 1 }} aria-label="1RM Explanation">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>

          {/* Select Category */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="category-label">Select Category</InputLabel>
              <Select
                labelId="category-label"
                label="Select Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={categories.length === 0}
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No categories available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Select Exercise */}
          {selectedCategory && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="exercise-label">Select Exercise</InputLabel>
                <Select
                  labelId="exercise-label"
                  label="Select Exercise"
                  value={selectedExerciseName}
                  onChange={(e) => setSelectedExerciseName(e.target.value)}
                  disabled={exercisesList.length === 0}
                >
                  {exercisesList.length > 0 ? (
                    exercisesList.map((exercise) => (
                      <MenuItem key={exercise} value={exercise}>
                        {exercise}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No exercises available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Select Date */}
          {selectedExerciseName && (
            <Box sx={{ mt: 2, mb: 2 }}>
              {exerciseDates.length > 0 ? (
                <DatePicker
                  label="Select Date"
                  value={selectedExerciseDate}
                  onChange={(newValue) => setSelectedExerciseDate(newValue)}
                  disableFuture
                  minDate={dayjs('2000-01-01')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No dates available for the selected exercise.
                </Typography>
              )}
            </Box>
          )}

          {/* Display 1RM and Relative Strength */}
          {selectedExerciseName && selectedExerciseDate && selectedExerciseEntry && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Exercise:</strong> {selectedExerciseEntry.exerciseName} (
                {selectedExerciseEntry.category})
              </Typography>
              <Typography variant="body1">
                <strong>1RM:</strong> {oneRM} kg
              </Typography>
              {relativeStrength && (
                <Typography variant="body1">
                  <strong>Relative Strength:</strong> {relativeStrength}{' '}
                  <Tooltip
                    title={
                      <Typography variant="body2">
                        Relative Strength = 1RM / Body Weight
                      </Typography>
                    }
                    arrow
                  >
                    <IconButton size="small" sx={{ ml: 1 }} aria-label="Relative Strength Explanation">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Line Chart: Exercise Progression */}
        {selectedExerciseName && lineChartData.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {selectedExerciseName} Progress Over Time
              </Typography>
              <Button variant="contained" onClick={() => setFullScreenChartOpen(true)}>
                Toggle Full Screen
              </Button>
            </Box>
            <LineChart {...lineChartProps} />

            {/* Full Screen Dialog */}
            <Dialog open={fullScreenChartOpen} onClose={() => setFullScreenChartOpen(false)} fullWidth maxWidth="lg">
              <DialogTitle>Full Screen Chart View</DialogTitle>
              <DialogContent>
                {/* Bigger chart display */}
                <LineChart {...lineChartProps} height={500} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setFullScreenChartOpen(false)} variant="contained" color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {/* Workout Distribution by Category Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Workout Distribution by Category
            <Tooltip
              title={
                <Typography variant="body2">
                  This pie chart represents the distribution of your workouts across different categories for the selected month.
                </Typography>
              }
              arrow
            >
              <IconButton size="small" sx={{ ml: 1 }} aria-label="Workout Distribution Explanation">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>

          {/* Select Month */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <DatePicker
              views={['year', 'month']}
              label="Select Month"
              minDate={dayjs('2000-01-01')}
              maxDate={dayjs()}
              value={selectedMonth}
              onChange={(newValue) => setSelectedMonth(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Box>

          {workoutDistribution.length > 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <PieActiveArc data={workoutDistribution} />
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No workout data available for the selected month.
            </Typography>
          )}
        </Box>

        {/* Snackbar for User Feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
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

export default ExerciseData;
