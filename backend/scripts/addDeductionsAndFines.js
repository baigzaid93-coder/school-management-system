const mongoose = require('mongoose');
const Expense = require('../src/models/Expense');
const Fee = require('../src/models/Fee');
const Teacher = require('../src/models/Teacher');
const Student = require('../src/models/Student');

const schoolId = '69c6a3026782e236da03cf9c';
let voucherCounter = 2000;
let feeCounter = 1000;

async function generateVoucherNumber(category) {
  voucherCounter++;
  const year = new Date().getFullYear();
  const prefix = category === 'Advance Salary' ? 'AS' : category === 'Deduction' ? 'DED' : 'SAL';
  return `${prefix}-${year}-${String(voucherCounter).padStart(4, '0')}`;
}

async function generateFeeVoucherNumber() {
  feeCounter++;
  const year = new Date().getFullYear();
  return `FIN-${year}-${String(feeCounter).padStart(4, '0')}`;
}

async function addDeductionsAndFines() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');

    const teachers = await Teacher.find({ school: schoolId });
    const students = await Student.find({ school: schoolId });
    
    console.log(`Found ${teachers.length} teachers, ${students.length} students\n`);

    if (teachers.length === 0 || students.length === 0) {
      console.log('No teachers or students found!');
      await mongoose.disconnect();
      return;
    }

    const deductions = [];
    const fines = [];

    // Create salary deductions for teachers (some random months)
    const deductionTypes = ['Late Arrival', 'Absence', 'Loan Recovery', 'Other Deduction'];
    
    for (const teacher of teachers) {
      const deductionMonths = [
        { month: 2, year: 2025, type: 'Late Arrival', amount: 2000 },
        { month: 5, year: 2025, type: 'Absence', amount: 5000 },
        { month: 8, year: 2025, type: 'Loan Recovery', amount: 10000 },
        { month: 11, year: 2025, type: 'Late Arrival', amount: 1500 },
        { month: 1, year: 2026, type: 'Absence', amount: 3000 },
      ];

      for (const { month, year, type, amount } of deductionMonths) {
        const date = new Date(year, month, 28);
        deductions.push({
          school: schoolId,
          voucherNumber: await generateVoucherNumber('Deduction'),
          description: `${type} Deduction - ${teacher.firstName} ${teacher.lastName}`,
          amount: amount,
          category: 'Deduction',
          date: date,
          paymentMethod: 'Deduction',
          teacher: teacher._id,
          deductionType: type,
          notes: `${type} for ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`
        });
      }
    }

    // Create fines for students
    const fineTypes = ['Late Payment', 'Library Fine', 'Damage', 'Lost Book', 'Misconduct'];
    
    for (const student of students) {
      const fineMonths = [
        { month: 1, year: 2025, type: 'Late Payment', amount: 500 },
        { month: 4, year: 2025, type: 'Library Fine', amount: 300 },
        { month: 6, year: 2025, type: 'Lost Book', amount: 1500 },
        { month: 9, year: 2025, type: 'Late Payment', amount: 750 },
        { month: 12, year: 2025, type: 'Damage', amount: 2000 },
        { month: 2, year: 2026, type: 'Library Fine', amount: 400 },
      ];

      for (const { month, year, type, amount } of fineMonths) {
        const date = new Date(year, month, 10);
        fines.push({
          student: student._id,
          school: schoolId,
          voucherNumber: await generateFeeVoucherNumber(),
          feeType: 'Fine',
          fineType: type,
          amount: amount,
          paidAmount: amount, // Fines are usually paid immediately
          dueDate: date,
          paidDate: date,
          status: 'Paid',
          description: `${type} - ${student.firstName} ${student.lastName}`,
          academicYear: '2025-2026'
        });
      }
    }

    // Insert deductions
    if (deductions.length > 0) {
      await Expense.deleteMany({ school: schoolId, category: 'Deduction' });
      const insertedDeductions = await Expense.insertMany(deductions);
      console.log(`✅ Created ${insertedDeductions.length} salary deductions\n`);
    }

    // Insert fines
    if (fines.length > 0) {
      await Fee.deleteMany({ school: schoolId, feeType: 'Fine' });
      const insertedFines = await Fee.insertMany(fines);
      console.log(`✅ Created ${insertedFines.length} student fines\n`);
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`\n👨‍🏫 Teacher Deductions per teacher:`);
    for (const teacher of teachers) {
      const teacherDeds = deductions.filter(d => d.teacher?.toString() === teacher._id.toString());
      const totalDeds = teacherDeds.reduce((sum, d) => sum + d.amount, 0);
      console.log(`  ${teacher.firstName} ${teacher.lastName}: ${teacherDeds.length} deductions = Rs.${totalDeds.toLocaleString()}`);
    }

    console.log(`\n👨‍🎓 Student Fines per student:`);
    for (const student of students) {
      const studentFines = fines.filter(f => f.student?.toString() === student._id.toString());
      const totalFines = studentFines.reduce((sum, f) => sum + f.amount, 0);
      console.log(`  ${student.firstName} ${student.lastName}: ${studentFines.length} fines = Rs.${totalFines.toLocaleString()}`);
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalFines = fines.reduce((sum, f) => sum + f.amount, 0);
    
    console.log(`\n💰 Total Salary Deductions: Rs.${totalDeductions.toLocaleString()}`);
    console.log(`💰 Total Student Fines: Rs.${totalFines.toLocaleString()}`);

    console.log('\n✅ Deductions and fines added successfully!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addDeductionsAndFines();
