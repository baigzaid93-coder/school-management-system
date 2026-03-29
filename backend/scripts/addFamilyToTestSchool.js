const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function addFamilyToTestSchool() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get students in Test school
    const testSchoolId = '69c6a3026782e236da03cf9c';
    const students = await db.collection('students').find({ school: testSchoolId }).toArray();
    
    console.log(`Students in Test school: ${students.length}`);
    students.forEach(s => console.log(`  ${s.firstName} ${s.lastName || ''}`));
    
    // Set family number 301 to first 3 students in Test school
    console.log('\nSetting family number 301 to first 3 students...');
    const result = await db.collection('students').updateMany(
      { school: testSchoolId },
      { $set: { familyNumber: '301' } }
    );
    console.log(`Updated ${result.modifiedCount} students`);
    
    // Verify
    const updated = await db.collection('students').find({ familyNumber: '301' }).toArray();
    console.log(`\nStudents now with family 301: ${updated.length}`);
    updated.forEach(s => console.log(`  ${s.firstName} ${s.lastName || ''} | School: ${s.school}`));

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addFamilyToTestSchool();
