const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path - support Docker environment variable
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/database.sqlite');

// Create a database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Helper function to run a query with parameters
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) {
      console.error('Error running SQL query:', err);
      reject(err);
    } else {
      resolve({ id: this.lastID, changes: this.changes });
    }
  });
});

// Helper function to get a single row
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) {
      console.error('Error getting row:', err);
      reject(err);
    } else {
      resolve(row);
    }
  });
});

// Helper function to get all rows
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error getting rows:', err);
      reject(err);
    } else {
      resolve(rows);
    }
  });
});

// Helper function to execute multiple statements in a transaction
const transaction = (callback) => new Promise((resolve, reject) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    try {
      const result = callback();
      db.run('COMMIT');
      resolve(result);
    } catch (err) {
      db.run('ROLLBACK');
      reject(err);
    }
  });
});

module.exports = {
  db,
  run,
  get,
  all,
  transaction,
};
