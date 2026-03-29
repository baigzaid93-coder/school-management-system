const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function testSearch() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected\n');

    const Student = require('../src/models/Student');
    const schoolId = '69c6a3026782e236da03cf9c';
    
    console.log('School ID:', schoolId);
    
    // Test without search
    const allStudents = await Student.find({ school: new mongoose.Types.ObjectId(schoolId) });
    console.log('All students in Test school:', allStudents.length);
    allStudents.forEach(s => console.log('  -', s.firstName, s.lastName, '| Family:', s.familyNumber));
    
    // Test with search for 301
    const searchStudents = await Student.find({
      school: new mongoose.Types.ObjectId(schoolId),
      familyNumber: { $regex: '301', $options: 'i' }
    });
    console.log('\nStudents with family 301:', searchStudents.length);
    
    await mongoose.disconnect();
    console.log('\nDone');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSearch();
