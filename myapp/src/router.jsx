// src/router.jsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import AddExercise from './components/AddExercise';
import ExerciseLog from './components/ExerciseLog';
import UserInfo from './components/UserInfo';
import ExerciseData from './components/ExerciseData';
import NotFound from './components/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        path: 'add-exercise',
        element: <AddExercise />,
      },
      {
        path: 'exercise-log',
        element: <ExerciseLog />,
      },
      {
        path: 'user-info',
        element: <UserInfo />,
      },
      {
        path: 'exercise-data',
        element: <ExerciseData />,
      },
    ],
  },
]);

export default router;
