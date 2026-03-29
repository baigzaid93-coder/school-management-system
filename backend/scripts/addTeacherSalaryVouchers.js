const mongoose = require('mongoose');
const Expense = require('../src/models/Expense');
const Teacher = require('../src/models/Teacher');

const schoolId = '69c6a3026782e236da03cf9c';
let voucherCounter = 1000;

async function generateVoucherNumber(category) {
  voucherCounter++;
  const year = new Date().getFullYear();
  const prefix = category === 'Advance Salary' ? 'AS' : 'SAL';
  return `${prefix}-${year}-${String(voucherCounter).padStart(4, '0')}`;
}

async function addTeacherSalaryVouchers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');
    
    // Get existing expense count
    const existingExpenses = await Expense.countDocuments({ school: schoolId });
    console.log('Existing expenses:', existingExpenses);
    
    // Get teachers
    const teachers = await Teacher.find({ school: schoolId });
    console.log('Found', teachers.length, 'teachers\n');
    
    if (teachers.length === 0) {
      console.log('No teachers found. Run addTeachers.js first!');
      await mongoose.disconnect();
      return;
    }
    
    // Get last voucher number to continue sequence
    const lastExpense = await Expense.findOne({ school: schoolId })
      .sort({ voucherNumber: -1 })
      .select('voucherNumber');
    
    if (lastExpense) {
      const lastNum = parseInt(lastExpense.voucherNumber.split('-').pop());
      voucherCounter = lastNum;
    }
    
    const expenses = [];
    const now = new Date();
    
    for (const teacher of teachers) {
      // Monthly salary vouchers (Jan 2025 - Mar 2026)
      const salaryMonths = [
        { month: 0, year: 2025 },  // Jan 2025
        { month: 1, year: 2025 },  // Feb 2025
        { month: 2, year: 2025 },  // Mar 2025
        { month: 3, year: 2025 },  // Apr 2025
        { month: 4, year: 2025 },  // May 2025
        { month: 5, year: 2025 },  // Jun 2025
        { month: 6, year: 2025 },  // Jul 2025
        { month: 7, year: 2025 },  // Aug 2025
        { month: 8, year: 2025 },  // Sep 2025
        { month: 9, year: 2025 },  // Oct 2025
        { month: 10, year: 2025 }, // Nov 2025
        { month: 11, year: 2025 }, // Dec 2025
        { month: 0, year: 2026 },  // Jan 2026
        { month: 1, year: 2026 },  // Feb 2026
        { month: 2, year: 2026 },  // Mar 2026
      ];
      
      for (const { month, year } of salaryMonths) {
        const date = new Date(year, month, 25);
        if (date <= now) {
          expenses.push({
            school: schoolId,
            voucherNumber: await generateVoucherNumber('Salary'),
            description: `Monthly Salary - ${teacher.firstName} ${teacher.lastName} (${teacher.designation})`,
            amount: teacher.salary || 50000,
            category: 'Salary',
            date: date,
            paymentMethod: 'Bank Transfer',
            teacher: teacher._id,
            notes: `Salary for ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`
          });
        }
      }
      
      // Advance salary vouchers (random months)
      const advanceMonths = [
        { month: 1, year: 2025, amount: 10000 },
        { month: 4, year: 2025, amount: 15000 },
        { month: 7, year: 2025, amount: 20000 },
        { month: 10, year: 2025, amount: 12000 },
        { month: 2, year: 2026, amount: 18000 },
      ];
      
      for (const { month, year, amount } of advanceMonths) {
        const date = new Date(year, month, 15);
        if (date <= now) {
          expenses.push({
            school: schoolId,
            voucherNumber: await generateVoucherNumber('Advance Salary'),
            description: `Advance Salary - ${teacher.firstName} ${teacher.lastName}`,
            amount: amount,
            category: 'Advance Salary',
            date: date,
            paymentMethod: 'Cash',
            teacher: teacher._id,
            notes: 'Advance against monthly salary'
          });
        }
      }
    }
    
    // Insert all expenses
    if (expenses.length > 0) {
      // Delete existing salary/advance vouchers for test school
      await Expense.deleteMany({ 
        school: schoolId, 
        category: { $in: ['Salary', 'Advance Salary'] } 
      });
      console.log('Cleared existing salary/advance vouchers');
      
      const inserted = await Expense.insertMany(expenses);
      console.log(`\n✅ Created ${inserted.length} salary/advance vouchers:\n`);
      
      // Group by category
      const salaryCount = inserted.filter(e => e.category === 'Salary').length;
      const advanceCount = inserted.filter(e => e.category === 'Advance Salary').length;
      
      console.log(`  📋 Salary Vouchers: ${salaryCount}`);
      console.log(`  💰 Advance Salary Vouchers: ${advanceCount}`);
      
      // Show sample vouchers
      console.log('\n📝 Sample vouchers:');
      inserted.slice(0, 5).forEach(v => {
        console.log(`  - ${v.voucherNumber}: ${v.description} - Rs.${v.amount.toLocaleString()} (${new Date(v.date).toLocaleDateString()})`);
      });
      
      if (inserted.length > 5) {
        console.log(`  ... and ${inserted.length - 5} more`);
      }
      
      // Summary by teacher
      console.log('\n👨‍🏫 Vouchers per teacher:');
      for (const teacher of teachers) {
        const teacherSalary = inserted.filter(e => e.teacher?.toString() === teacher._id.toString() && e.category === 'Salary');
        const teacherAdvance = inserted.filter(e => e.teacher?.toString() === teacher._id.toString() && e.category === 'Advance Salary');
        console.log(`  ${teacher.firstName} ${teacher.lastName}: ${teacherSalary.length} salary + ${teacherAdvance.length} advance = ${teacherSalary.length + teacherAdvance.length} total`);
      }
      
      // Total amounts
      const totalSalary = inserted.filter(e => e.category === 'Salary').reduce((sum, e) => sum + e.amount, 0);
      const totalAdvance = inserted.filter(e => e.category === 'Advance Salary').reduce((sum, e) => sum + e.amount, 0);
      console.log(`\n💵 Total Salary Paid: Rs.${totalSalary.toLocaleString()}`);
      console.log(`💵 Total Advance Paid: Rs.${totalAdvance.toLocaleString()}`);
    }
    
    console.log('\n✅ Teacher salary vouchers added successfully!');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code === 11000) {
      console.log('Duplicate voucher number. Running cleanup...');
    }
  }
}

addTeacherSalaryVouchers();
