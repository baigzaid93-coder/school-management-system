const Expense = require('../models/Expense');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const { getNextDocumentNumber } = require('../utils/documentNumberGenerator');

exports.getAllExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const query = { ...req.tenantQuery };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59')
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate + 'T23:59:59') };
    }
    
    if (category) {
      query.category = category;
    }
    
    const expenses = await Expense.find(query)
      .populate('teacher', 'firstName lastName employeeId')
      .populate('staff', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const schoolId = req.tenantQuery.school;
    const voucherNumber = await getNextDocumentNumber(schoolId, 'EXPENSE_VOUCHER');
    
    const expense = new Expense({
      ...req.body,
      school: schoolId,
      voucherNumber
    });
    await expense.save();
    
    await expense.populate('teacher', 'firstName lastName employeeId');
    await expense.populate('staff', 'firstName lastName employeeId');
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createBulkExpenses = async (req, res) => {
  try {
    const { expenses } = req.body;
    const schoolId = req.tenantQuery.school;
    
    const expensesWithSchool = expenses.map(exp => ({
      ...exp,
      school: schoolId
    }));
    
    const created = await Expense.insertMany(expensesWithSchool);
    res.status(201).json({ 
      message: `Created ${created.length} expense records`,
      count: created.length 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { ...req.tenantQuery };
    
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59')
      };
    }
    
    const summary = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalExpenses = summary.reduce((sum, s) => sum + s.total, 0);
    const totalRecords = summary.reduce((sum, s) => sum + s.count, 0);
    
    res.json({ summary, totalExpenses, totalRecords });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find(req.tenantQuery).select('_id firstName lastName employeeId');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpensesByTeacher = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const query = { 
      teacher: req.params.teacherId,
      ...req.tenantQuery
    };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59')
      };
    }
    
    if (category) {
      query.category = category;
    }
    
    const expenses = await Expense.find(query)
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpensesByTeacherSummary = async (req, res) => {
  try {
    const query = { 
      teacher: req.params.teacherId,
      ...req.tenantQuery,
      category: { $in: ['Salary', 'Advance Salary'] }
    };
    
    const summary = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalSalary = summary.find(s => s._id === 'Salary')?.total || 0;
    const totalAdvance = summary.find(s => s._id === 'Advance Salary')?.total || 0;
    const salaryCount = summary.find(s => s._id === 'Salary')?.count || 0;
    const advanceCount = summary.find(s => s._id === 'Advance Salary')?.count || 0;
    
    res.json({ 
      totalSalary, 
      totalAdvance, 
      salaryCount, 
      advanceCount,
      totalAmount: totalSalary + totalAdvance,
      totalRecords: salaryCount + advanceCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.find(req.tenantQuery).select('_id firstName lastName employeeId');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpensesByStaff = async (req, res) => {
  try {
    const expenses = await Expense.find({ 
      staff: req.params.staffId,
      ...req.tenantQuery 
    }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
