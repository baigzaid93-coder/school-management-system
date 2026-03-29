// Cleanup script - run once to fix attendance indexes
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_management';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Drop the attendances collection
    await db.collection('attendances').drop();
    console.log('Dropped attendances collection');
    
    // Recreate the collection with proper indexes
    const Attendance = require('./models/Attendance');
    await Attendance.ensureIndexes();
    console.log('Recreated indexes');
    
    console.log('Cleanup complete! Restart the server now.');
    
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

cleanup();
