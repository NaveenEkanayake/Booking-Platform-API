const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
console.log('Connecting to database at:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  // Turn off foreign keys temporarily to clear tables easily
  db.run('PRAGMA foreign_keys = OFF;', (err) => {
    if (err) console.error(err);
  });

  // Delete all bookings
  db.run('DELETE FROM bookings;', function(err) {
    if (err) {
      console.error('Error deleting bookings:', err.message);
    } else {
      console.log(`Deleted ${this.changes} bookings.`);
    }
  });

  // Delete all services
  db.run('DELETE FROM services;', function(err) {
    if (err) {
      console.error('Error deleting services:', err.message);
    } else {
      console.log(`Deleted ${this.changes} services.`);
    }
  });

  // Delete all users except the admin
  db.run('DELETE FROM users WHERE email != "admin@entwoh.com";', function(err) {
    if (err) {
      console.error('Error deleting users:', err.message);
    } else {
      console.log(`Deleted ${this.changes} test users.`);
    }
  });

  // Turn foreign keys back on
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) console.error(err);
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});
