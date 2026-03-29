const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function finalFix() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    const testSchoolId = '69c6a3026782e236da03cf9c';
    
    // Set family number 301 for ALL students in Test school
    console.log('Setting family number 301 for ALL Test school students...');
    const result = await db.collection('students').updateMany(
      { school: new mongoose.Types.ObjectId(testSchoolId) },
      { $set: { familyNumber: '301' } }
    );
    console.log(`Updated ${result.modifiedCount} students with family 301`);
    
    // Verify Test school students
    const testStudents = await db.collection('students').find({ 
      school: new mongoose.Types.ObjectId(testSchoolId)
    }).toArray();
    
    console.log(`\nTest school students (${testStudents.length}):`);
    testStudents.forEach(s => console.log(`  ${s.firstName} ${s.lastName || ''} | Family: ${s.familyNumber}`));

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

finalFix();
