const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function fixSchoolStudents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get students without school or with null school
    const studentsNoSchool = await db.collection('students').find({ 
      $or: [
        { school: null },
        { school: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Students without school: ${studentsNoSchool.length}`);
    studentsNoSchool.forEach(s => console.log(`  ${s.firstName} ${s.lastName || ''} | Current School: ${s.school}`));
    
    // Use the Test school ID
    const testSchoolId = '69c6a3026782e236da03cf9c';
    
    // Update all students without school to be in Test school
    console.log(`\nUpdating students to be in Test school (${testSchoolId})...`);
    const updateResult = await db.collection('students').updateMany(
      { school: { $in: [null, undefined] } },
      { $set: { school: new mongoose.Types.ObjectId(testSchoolId) } }
    );
    console.log(`Updated ${updateResult.modifiedCount} students`);
    
    // Now set family number 301 for first 3 students
    console.log('\nSetting family number 301...');
    const students = await db.collection('students').find({ familyNumber: { $ne: '301' } }).limit(3).toArray();
    if (students.length > 0) {
      const result = await db.collection('students').updateMany(
        { _id: { $in: students.map(s => s._id) } },
        { $set: { familyNumber: '301' } }
      );
      console.log(`Set family 301 for ${result.modifiedCount} students`);
    }
    
    // Final check
    const withFamily301 = await db.collection('students').find({ familyNumber: '301' }).toArray();
    console.log(`\nFinal students with family 301: ${withFamily301.length}`);
    withFamily301.forEach(s => console.log(`  ${s.firstName} ${s.lastName || ''} | School: ${s.school}`));

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

fixSchoolStudents();
