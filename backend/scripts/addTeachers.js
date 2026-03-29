const mongoose = require('mongoose');
const Teacher = require('../src/models/Teacher');

const schoolId = '69c6a3026782e236da03cf9c';

async function addTeachers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');
    
    // Check existing teachers
    const existingTeachers = await Teacher.countDocuments({ school: schoolId });
    console.log('Existing teachers:', existingTeachers);
    
    // Create test teachers
    const teachers = [
      {
        firstName: 'Fatima',
        lastName: 'Hassan',
        email: 'fatima@test.com',
        phone: '03011111111',
        designation: 'Head of Department',
        qualification: 'MPhil',
        salary: 80000,
        joiningDate: new Date(2024, 8, 1),
        school: schoolId,
        teacherId: 'TCH-00001',
        status: 'Active',
        gender: 'Female',
        subjects: [],
        classes: []
      },
      {
        firstName: 'Muhammad',
        lastName: 'Ali',
        email: 'mali@test.com',
        phone: '03022222222',
        designation: 'Senior Teacher',
        qualification: 'MSc',
        salary: 65000,
        joiningDate: new Date(2024, 6, 15),
        school: schoolId,
        teacherId: 'TCH-00002',
        status: 'Active',
        gender: 'Male',
        subjects: [],
        classes: []
      },
      {
        firstName: 'Aisha',
        lastName: 'Khan',
        email: 'aisha@test.com',
        phone: '03033333333',
        designation: 'Teacher',
        qualification: 'BSc',
        salary: 50000,
        joiningDate: new Date(2025, 1, 1),
        school: schoolId,
        teacherId: 'TCH-00003',
        status: 'Active',
        gender: 'Female',
        subjects: [],
        classes: []
      },
      {
        firstName: 'Ahmed',
        lastName: 'Raza',
        email: 'ahmed@test.com',
        phone: '03044444444',
        designation: 'Teacher',
        qualification: 'MA',
        salary: 45000,
        joiningDate: new Date(2025, 3, 15),
        school: schoolId,
        teacherId: 'TCH-00004',
        status: 'Active',
        gender: 'Male',
        subjects: [],
        classes: []
      },
      {
        firstName: 'Zainab',
        lastName: 'Malik',
        email: 'zainab@test.com',
        phone: '03055555555',
        designation: 'Assistant Teacher',
        qualification: 'BEd',
        salary: 35000,
        joiningDate: new Date(2025, 5, 1),
        school: schoolId,
        teacherId: 'TCH-00005',
        status: 'Active',
        gender: 'Female',
        subjects: [],
        classes: []
      }
    ];
    
    // Delete existing test school teachers first
    if (existingTeachers > 0) {
      await Teacher.deleteMany({ school: schoolId });
      console.log('Deleted existing teachers');
    }
    
    const createdTeachers = await Teacher.insertMany(teachers);
    console.log('\nCreated', createdTeachers.length, 'teachers:');
    
    for (const teacher of createdTeachers) {
      console.log(`  - ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId}) - ${teacher.designation}`);
    }
    
    console.log('\n✅ Teachers added successfully to Test school!');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addTeachers();
