// backend/index.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Consider restricting origins in production
app.use(express.json()); // Built-in middleware to parse JSON

// Initialize SQLite Database
const db_name = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(db_name, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1); // Exit if DB connection fails
  } else {
    console.log('Connected to the SQLite database.');

    // Enable Foreign Keys
    db.run(`PRAGMA foreign_keys = ON;`, (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err.message);
      } else {
        console.log('Foreign keys enabled.');
      }
    });

    // Create Exercises Table
    db.run(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        exerciseName TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating exercises table:', err.message);
      } else {
        console.log('Exercises table ready.');
      }
    });

    // Create Sets Table
    db.run(`
      CREATE TABLE IF NOT EXISTS sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exerciseId INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating sets table:', err.message);
      } else {
        console.log('Sets table ready.');
      }
    });

    // Create Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          height INTEGER NOT NULL,
          weight INTEGER NOT NULL,
          birthdate DATE NOT NULL,
          gender TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          console.log('Users table ready.');
        }
      });
    }
  });
  

// Root Route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// GET all exercises with their sets
app.get('/api/exercises', (req, res) => {
  const sql = `
    SELECT e.id, e.date, e.category, e.exerciseName, s.id as setId, s.weight, s.reps
    FROM exercises e
    LEFT JOIN sets s ON e.id = s.exerciseId
    ORDER BY e.date DESC, e.id DESC, s.id ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching exercises:', err.message);
      return res.status(400).json({ error: err.message });
    }

    // Group sets by exercise
    const exercisesMap = {};
    rows.forEach(row => {
      if (!exercisesMap[row.id]) {
        exercisesMap[row.id] = {
          id: row.id,
          date: row.date,
          category: row.category,
          exerciseName: row.exerciseName,
          sets: []
        };
      }
      if (row.setId) { // Check if set exists
        exercisesMap[row.id].sets.push({
          id: row.setId,
          weight: row.weight,
          reps: row.reps
        });
      }
    });

    const exercises = Object.values(exercisesMap);
    res.json(exercises);
  });
});

// GET a specific exercise by ID
app.get('/api/exercises/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT e.id, e.date, e.category, e.exerciseName, s.id as setId, s.weight, s.reps
    FROM exercises e
    LEFT JOIN sets s ON e.id = s.exerciseId
    WHERE e.id = ?
    ORDER BY s.id ASC
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('Error fetching exercise:', err.message);
      return res.status(400).json({ error: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const exercise = {
      id: rows[0].id,
      date: rows[0].date,
      category: rows[0].category,
      exerciseName: rows[0].exerciseName,
      sets: rows
        .filter(row => row.setId)
        .map(row => ({
          id: row.setId,
          weight: row.weight,
          reps: row.reps
        }))
    };

    res.json(exercise);
  });
});

// POST a new exercise or multiple exercises with sets using transactions
app.post('/api/exercises', (req, res) => {
  const exercises = Array.isArray(req.body) ? req.body : [req.body];

  console.log('Received exercises:', JSON.stringify(exercises, null, 2)); // Log received data

  if (exercises.length === 0) {
    return res.status(400).json({ error: 'No exercises provided.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const insertExercise = 'INSERT INTO exercises (date, category, exerciseName) VALUES (?, ?, ?)';
    const insertSet = 'INSERT INTO sets (exerciseId, weight, reps) VALUES (?, ?, ?)';

    const insertedExercises = [];
    let hasError = false;

    const insertExercisesSequentially = (index) => {
      if (index >= exercises.length) {
        if (hasError) {
          db.run('ROLLBACK', (err) => {
            if (err) {
              console.error('Error during rollback:', err.message);
            }
            return res.status(500).json({ error: 'Failed to insert exercises.' });
          });
        } else {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error during commit:', err.message);
              return res.status(500).json({ error: 'Failed to commit transaction.' });
            }
            return res.status(201).json({ message: 'Exercises created successfully.', exercises: insertedExercises });
          });
        }
        return;
      }

      const { date, category, exerciseName, sets } = exercises[index];

      // Validate each exercise
      if (!date || !category || !exerciseName || !Array.isArray(sets)) {
        console.error(`Missing required fields in exercise at index ${index}.`);
        hasError = true;
        return insertExercisesSequentially(index + 1);
      }

      db.run(insertExercise, [date, category, exerciseName], function(err) {
        if (err) {
          console.error(`Error inserting exercise at index ${index}:`, err.message);
          hasError = true;
          return insertExercisesSequentially(index + 1);
        }

        const exerciseId = this.lastID;
        insertedExercises.push({ id: exerciseId, date, category, exerciseName });

        const stmt = db.prepare(insertSet);

        sets.forEach((set, setIdx) => {
          const { weight, reps } = set;
          if (weight !== undefined && reps !== undefined) { // Allow weight = 0
            stmt.run([exerciseId, weight, reps], (err) => {
              if (err) {
                console.error(`Error inserting set ${setIdx + 1} for exercise ID ${exerciseId}:`, err.message);
                hasError = true;
              }
            });
          } else {
            console.warn(`Skipping set ${setIdx + 1} for exercise ID ${exerciseId} due to missing weight or reps.`);
          }
        });

        stmt.finalize((err) => {
          if (err) {
            console.error(`Error finalizing sets for exercise ID ${exerciseId}:`, err.message);
            hasError = true;
          }

          // Proceed to the next exercise
          insertExercisesSequentially(index + 1);
        });
      });
    };

    // Start inserting exercises
    insertExercisesSequentially(0);
  });
});

// DELETE an exercise by ID
app.delete('/api/exercises/:id', (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM exercises WHERE id = ?`;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting exercise:', err.message);
      return res.status(400).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json({ message: 'Exercise deleted successfully.' });
  });
});

// PUT (Update) an exercise by ID
app.put('/api/exercises/:id', (req, res) => {
  const { id } = req.params;
  const { date, category, exerciseName, sets } = req.body;

  // Validate inputs
  if (!date || !category || !exerciseName || !Array.isArray(sets)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const updateExercise = 'UPDATE exercises SET date = ?, category = ?, exerciseName = ? WHERE id = ?';
    const insertSet = 'INSERT INTO sets (exerciseId, weight, reps) VALUES (?, ?, ?)';
    const deleteSets = 'DELETE FROM sets WHERE exerciseId = ?';

    db.run(updateExercise, [date, category, exerciseName, id], function(err) {
      if (err) {
        console.error('Error updating exercise:', err.message);
        db.run('ROLLBACK', () => {
          return res.status(400).json({ error: 'Failed to update exercise.' });
        });
      } else if (this.changes === 0) {
        db.run('ROLLBACK', () => {
          return res.status(404).json({ error: 'Exercise not found.' });
        });
      } else {
        db.run(deleteSets, [id], (err) => {
          if (err) {
            console.error('Error deleting existing sets:', err.message);
            db.run('ROLLBACK', () => {
              return res.status(500).json({ error: 'Failed to delete existing sets.' });
            });
          } else {
            const stmt = db.prepare(insertSet);
            sets.forEach((set) => {
              const { weight, reps } = set;
              if (weight !== undefined && reps !== undefined) { // Allow weight = 0
                stmt.run([id, weight, reps], (err) => {
                  if (err) {
                    console.error('Error inserting set:', err.message);
                  }
                });
              }
            });
            stmt.finalize((err) => {
              if (err) {
                console.error('Error finalizing set insertion:', err.message);
                db.run('ROLLBACK', () => {
                  return res.status(500).json({ error: 'Failed to insert sets.' });
                });
              } else {
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error committing transaction:', err.message);
                    return res.status(500).json({ error: 'Failed to commit transaction.' });
                  }
                  res.json({ message: 'Exercise updated successfully.' });
                });
              }
            });
          }
        });
      }
    });
  });
});

// GET user info
app.get('/api/user', (req, res) => {
    const sql = `SELECT * FROM users LIMIT 1`;
    db.get(sql, [], (err, row) => {
      if (err) {
        console.error('Error fetching user info:', err.message);
        return res.status(400).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(row);
    });
  });
  
// POST create user info
app.post('/api/user', (req, res) => {
    const { name, height, weight, birthdate, gender } = req.body;
  
    // Validate required fields
    if (!name || height === undefined || weight === undefined || !birthdate || !gender) {
      return res.status(400).json({ error: 'Name, height, weight, birthdate, and gender are required' });
    }
  
    // Check if a user already exists
    const checkSql = `SELECT * FROM users LIMIT 1`;
    db.get(checkSql, [], (err, row) => {
      if (err) {
        console.error('Error checking existing user:', err.message);
        return res.status(400).json({ error: err.message });
      }
      if (row) {
        return res.status(400).json({ error: 'User already exists. Use PUT to update.' });
      }
  
      const insertSql = `INSERT INTO users (name, height, weight, birthdate, gender) VALUES (?, ?, ?, ?, ?)`;
      db.run(insertSql, [name, height, weight, birthdate, gender], function(err) {
        if (err) {
          console.error('Error creating user:', err.message);
          return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, height, weight, birthdate, gender });
      });
    });
  });
  

// PUT update user info
app.put('/api/user', (req, res) => {
  const { height, weight } = req.body;

  if (height === undefined || weight === undefined) {
    return res.status(400).json({ error: 'Height and weight are required' });
  }

  const sql = `UPDATE users SET height = ?, weight = ? WHERE id = 1`;
  db.run(sql, [height, weight], function(err) {
    if (err) {
      console.error('Error updating user:', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully.' });
  });
});


// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
