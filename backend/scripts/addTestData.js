const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Fee = require('../src/models/Fee');

const schoolId = '69c6a3026782e236da03cf9c';

async function createData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');
    
    // Get existing students or create new ones
    let students = await Student.find({ school: schoolId });
    
    if (students.length === 0) {
      // Create test students
      const newStudents = [
        { firstName: 'Ali', lastName: 'Ahmed', email: 'ali@test.com', phone: '03001234567', school: schoolId, studentId: 'TST-00001', status: 'Active', gender: 'Male' },
        { firstName: 'Sara', lastName: 'Khan', email: 'sara@test.com', phone: '03009876543', school: schoolId, studentId: 'TST-00002', status: 'Active', gender: 'Female' },
        { firstName: 'Hassan', lastName: 'Ali', email: 'hassan@test.com', phone: '03001112233', school: schoolId, studentId: 'TST-00003', status: 'Active', gender: 'Male' },
        { firstName: 'Ayesha', lastName: 'Malik', email: 'ayesha@test.com', phone: '03004445566', school: schoolId, studentId: 'TST-00004', status: 'Active', gender: 'Female' },
        { firstName: 'Omar', lastName: 'Farooq', email: 'omar@test.com', phone: '03007778899', school: schoolId, studentId: 'TST-00005', status: 'Active', gender: 'Male' },
      ];
      students = await Student.insertMany(newStudents);
      console.log('Created', students.length, 'students');
    } else {
      console.log('Found', students.length, 'existing students');
    }
    
    // Delete existing fees for these students
    await Fee.deleteMany({ student: { $in: students.map(s => s._id) } });
    console.log('Cleared existing fees');
    
    // Create test fees for each student
    const fees = [];
    
    for (const student of students) {
      // January - Paid
      fees.push({
        student: student._id,
        school: schoolId,
        feeType: 'Tuition',
        amount: 5000,
        paidAmount: 5000,
        dueDate: new Date(2026, 0, 10),
        status: 'Paid',
        voucherNumber: 'TST-FV-' + String(fees.length + 1).padStart(5, '0')
      });
      // February - Pending
      fees.push({
        student: student._id,
        school: schoolId,
        feeType: 'Tuition',
        amount: 5000,
        paidAmount: 0,
        dueDate: new Date(2026, 1, 10),
        status: 'Pending',
        voucherNumber: 'TST-FV-' + String(fees.length + 1).padStart(5, '0')
      });
      // Transportation - Pending
      fees.push({
        student: student._id,
        school: schoolId,
        feeType: 'Transportation',
        amount: 2000,
        paidAmount: 0,
        dueDate: new Date(),
        status: 'Pending',
        voucherNumber: 'TST-FV-' + String(fees.length + 1).padStart(5, '0')
      });
    }
    
    await Fee.insertMany(fees);
    console.log('Created', fees.length, 'fee records');
    
    console.log('\n✅ Test data ready for Test school!');
    console.log('Students:', students.map(s => s.firstName + ' ' + s.lastName).join(', '));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createData();
