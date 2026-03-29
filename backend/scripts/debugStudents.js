const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function debugStudents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Check schools
    const schools = await db.collection('schools').find({}).limit(5).toArray();
    console.log('Schools:');
    schools.forEach(s => console.log(`  ${s._id}: ${s.name}`));
    
    // Check all students and their school
    console.log('\nAll students:');
    const students = await db.collection('students').find({}).toArray();
    students.forEach(s => {
      console.log(`  ${s.firstName} ${s.lastName || ''} | School: ${s.school} | Family: ${s.familyNumber} | Status: ${s.status}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDone');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugStudents();
