const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function checkStudents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const Student = require('../src/models/Student');
    
    // Check for students with familyNumber 301
    const students301 = await Student.find({ familyNumber: '301' });
    console.log(`\nStudents with familyNumber '301': ${students301.length}`);
    students301.forEach(s => {
      console.log(`  - ${s.firstName} ${s.lastName} (ID: ${s.studentId}, Status: ${s.status}, Admission: ${s.admissionStatus}, School: ${s.school})`);
    });

    // Check all students with familyNumber
    const allWithFamily = await Student.find({ familyNumber: { $exists: true, $ne: null, $ne: '' } });
    console.log(`\nTotal students with familyNumber: ${allWithFamily.length}`);
    allWithFamily.forEach(s => {
      console.log(`  - ${s.firstName} ${s.lastName} | Family: ${s.familyNumber} | Status: ${s.status} | Admission: ${s.admissionStatus}`);
    });

    // Check students without familyNumber
    const withoutFamily = await Student.countDocuments({ $or: [{ familyNumber: null }, { familyNumber: '' }, { familyNumber: { $exists: false } }] });
    console.log(`\nStudents without familyNumber: ${withoutFamily}`);

    await mongoose.disconnect();
    console.log('\nDone');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStudents();
