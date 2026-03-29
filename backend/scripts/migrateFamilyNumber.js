const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function migrateFamilyNumber() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check if the familyNumber field exists in the schema
    const collections = await db.listCollections().toArray();
    console.log('\nCollections:', collections.map(c => c.name).join(', '));
    
    // Check if students have the familyNumber field
    const sampleStudent = await db.collection('students').findOne({});
    console.log('\nSample student keys:', Object.keys(sampleStudent || {}));
    console.log('Has familyNumber field:', sampleStudent ? ('familyNumber' in sampleStudent) : 'No student found');
    
    // Add familyNumber field to all students if it doesn't exist
    if (sampleStudent && !('familyNumber' in sampleStudent)) {
      console.log('\nAdding familyNumber field to all students...');
      await db.collection('students').updateMany(
        { familyNumber: { $exists: false } },
        { $set: { familyNumber: null } }
      );
      console.log('Field added successfully');
    }
    
    // Update a test student with familyNumber 301
    console.log('\nUpdating test students with familyNumber 301...');
    const result = await db.collection('students').updateMany(
      { firstName: { $in: ['Test', 'Test1', 'Test2'] } },
      { $set: { familyNumber: '301' } }
    );
    console.log(`Updated ${result.modifiedCount} students`);
    
    // Verify the update
    const students301 = await db.collection('students').find({ familyNumber: '301' }).toArray();
    console.log(`\nStudents with familyNumber '301': ${students301.length}`);
    students301.forEach(s => {
      console.log(`  - ${s.firstName} ${s.lastName || ''}`);
    });

    await mongoose.disconnect();
    console.log('\nMigration complete');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

migrateFamilyNumber();
