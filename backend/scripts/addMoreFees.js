const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Fee = require('../src/models/Fee');

const schoolId = '69c6a3026782e236da03cf9c';

async function addMoreFees() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');
    
    // Get existing students
    const students = await Student.find({ school: schoolId });
    
    if (students.length === 0) {
      console.log('No students found in Test school');
      return;
    }
    
    console.log('Found', students.length, 'students');
    
    // Get existing fee count
    const existingFees = await Fee.countDocuments({ school: schoolId });
    console.log('Existing fees:', existingFees);
    
    // Create additional fees for each student
    const newFees = [];
    const feeTypes = ['Tuition', 'Transportation', 'Laboratory', 'Library', 'Activity', 'Registration', 'Exam'];
    
    for (const student of students) {
      // Add 5 more months of tuition fees (March - July)
      for (let month = 2; month <= 6; month++) {
        const isPaid = month <= 4; // March, April, May are paid
        newFees.push({
          student: student._id,
          school: schoolId,
          feeType: 'Tuition',
          amount: 5000,
          paidAmount: isPaid ? 5000 : 0,
          dueDate: new Date(2026, month, 10),
          status: isPaid ? 'Paid' : 'Pending',
          voucherNumber: 'TST-FV-' + String(existingFees + newFees.length + 1).padStart(5, '0')
        });
      }
      
      // Add a registration fee for one student
      if (student.firstName === 'Ali') {
        newFees.push({
          student: student._id,
          school: schoolId,
          feeType: 'Registration',
          amount: 10000,
          paidAmount: 10000,
          dueDate: new Date(2026, 0, 15),
          status: 'Paid',
          voucherNumber: 'TST-FV-' + String(existingFees + newFees.length + 1).padStart(5, '0')
        });
      }
    }
    
    if (newFees.length > 0) {
      await Fee.insertMany(newFees);
      console.log('Added', newFees.length, 'new fee records');
    }
    
    // Get total fee count
    const totalFees = await Fee.countDocuments({ school: schoolId });
    console.log('\nTotal fees in Test school:', totalFees);
    
    // Show breakdown by student
    for (const student of students) {
      const studentFees = await Fee.countDocuments({ student: student._id });
      console.log(`  ${student.firstName} ${student.lastName}: ${studentFees} fees`);
    }
    
    console.log('\n✅ Done! Refresh the student detail page to see the changes.');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addMoreFees();
