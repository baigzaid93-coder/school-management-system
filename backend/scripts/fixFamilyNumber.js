const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function fixFamilyNumber() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    
    // Add familyNumber field to all students (default to null)
    console.log('Adding familyNumber field...');
    await studentsCollection.updateMany(
      {},
      { $set: { familyNumber: null } },
      { upsert: false }
    );
    console.log('Field added to all students');
    
    // Find first 3 students and set them with family number 301
    const students = await studentsCollection.find({}).limit(5).toArray();
    console.log(`\nFound ${students.length} students. Setting familyNumber for first 5...`);
    
    const updateResult = await studentsCollection.updateMany(
      { _id: { $in: students.map(s => s._id) } },
      { $set: { familyNumber: '301' } }
    );
    console.log(`Updated ${updateResult.modifiedCount} students with familyNumber '301'`);
    
    // Verify
    const students301 = await studentsCollection.find({ familyNumber: '301' }).toArray();
    console.log(`\nStudents now with familyNumber '301': ${students301.length}`);
    students301.forEach(s => {
      console.log(`  - ${s.firstName} ${s.lastName || ''} (${s.studentId})`);
    });
    
    // Show sample of updated student
    if (students.length > 0) {
      const updated = await studentsCollection.findOne({ _id: students[0]._id });
      console.log('\nSample updated student:');
      console.log('  familyNumber:', updated.familyNumber);
    }

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

fixFamilyNumber();
