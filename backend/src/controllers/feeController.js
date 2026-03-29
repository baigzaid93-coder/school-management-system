const Fee = require('../models/Fee');
const { getNextDocumentNumber } = require('../utils/documentNumberGenerator');

exports.getAllFees = async (req, res) => {
  try {
    const query = { ...req.tenantQuery };
    const fees = await Fee.find(query)
      .populate('student', 'firstName lastName studentId familyNumber classGrade')
      .populate('familyMembers.studentId', 'firstName lastName studentId classGrade')
      .sort({ createdAt: -1 });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuggestedFees = async (req, res) => {
  try {
    const { studentIds, feeType } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'studentIds array is required' });
    }
    
    const mongoose = require('mongoose');
    const objectIds = studentIds.map(id => new mongoose.Types.ObjectId(id));
    
    const suggestedFees = {};
    
    for (const studentId of objectIds) {
      const lastFee = await Fee.findOne({ student: studentId })
        .sort({ createdAt: -1 });
      
      if (lastFee) {
        suggestedFees[studentId.toString()] = {
          amount: lastFee.amount,
          feeType: lastFee.feeType
        };
      } else {
        suggestedFees[studentId.toString()] = {
          amount: 5000,
          feeType: 'Tuition'
        };
      }
    }
    
    res.json(suggestedFees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFamilyVouchers = async (req, res) => {
  try {
    const query = { ...req.tenantQuery, familyNumber: { $exists: true, $ne: null } };
    const familyVouchers = await Fee.find(query)
      .populate('student', 'firstName lastName studentId familyNumber classGrade')
      .populate('familyMembers.studentId', 'firstName lastName studentId classGrade')
      .sort({ createdAt: -1 });
    res.json(familyVouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFamilyVouchersByNumber = async (req, res) => {
  try {
    const { familyNumber } = req.params;
    const query = { ...req.tenantQuery, familyNumber };
    const familyVouchers = await Fee.find(query)
      .populate('student', 'firstName lastName studentId familyNumber classGrade')
      .populate('familyMembers.studentId', 'firstName lastName studentId classGrade')
      .sort({ createdAt: -1 });
    res.json(familyVouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeesByStudent = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const studentId = new mongoose.Types.ObjectId(req.params.studentId);
    const fees = await Fee.find({ student: studentId }).populate('student', 'firstName lastName studentId');
    res.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createFee = async (req, res) => {
  try {
    const schoolId = req.body.school || req.tenantQuery?.school || req.user?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    req.body.school = schoolId;
    req.body.voucherNumber = await getNextDocumentNumber(schoolId, 'FEE_VOUCHER');
    const fee = new Fee(req.body);
    await fee.save();
    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    res.json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    
    const { amount, method, reference } = req.body;
    
    fee.payments.push({
      amount,
      date: new Date(),
      method,
      reference
    });
    
    fee.paidAmount += amount;
    
    if (fee.paidAmount >= fee.amount) {
      fee.status = 'Paid';
      fee.paidDate = new Date();
    } else if (fee.paidAmount > 0) {
      fee.status = 'Partial';
    }
    
    await fee.save();
    res.json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeeSummary = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const { dateFrom, dateTo } = req.query;
    
    const matchQuery = { ...tenantQuery };
    
    if (dateFrom || dateTo) {
      matchQuery.dueDate = {};
      if (dateFrom) {
        matchQuery.dueDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchQuery.dueDate.$lte = endDate;
      }
    }
    
    const summary = await Fee.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
          collected: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    const totalFees = summary.reduce((sum, s) => sum + s.total, 0);
    const totalCollected = summary.reduce((sum, s) => sum + s.collected, 0);
    
    res.json({ summary, totalFees, totalCollected, pending: totalFees - totalCollected });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.calculateMonthlyFees = async (req, res) => {
  try {
    const { month, selectedFeeTypes, feeAmounts, dueDay } = req.body;
    
    if (!month) {
      return res.status(400).json({ message: 'Month is required' });
    }
    
    if (!selectedFeeTypes || !Array.isArray(selectedFeeTypes) || selectedFeeTypes.length === 0) {
      return res.status(400).json({ message: 'At least one fee type must be selected' });
    }
    
    const schoolId = req.tenantQuery?.school || req.user?.school || req.body.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const Student = require('../models/Student');
    const tenantQuery = { school: schoolId };
    const students = await Student.find({ ...tenantQuery, status: 'Active' });
    
    const [year, monthNum] = month.split('-');
    const dueDate = new Date(parseInt(year), parseInt(monthNum) - 1, dueDay || 10);
    
    const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
    
    const existingFees = await Fee.find({
      ...tenantQuery,
      feeType: { $in: selectedFeeTypes.map(t => t === 'Monthly Tuition' ? 'Tuition' : t) },
      dueDate: { $gte: monthStart, $lte: monthEnd }
    });
    
    const existingFeeKeys = new Set(
      existingFees.map(f => `${f.student.toString()}-${f.feeType}`)
    );
    
    const feesToCreate = [];
    for (const student of students) {
      for (const feeType of selectedFeeTypes) {
        const normalizedType = feeType === 'Monthly Tuition' ? 'Tuition' : feeType;
        const feeKey = `${student._id.toString()}-${normalizedType}`;
        
        if (!existingFeeKeys.has(feeKey)) {
          const voucherNumber = await getNextDocumentNumber(schoolId, 'FEE_VOUCHER');
          feesToCreate.push({
            student: student._id,
            school: schoolId,
            classGrade: student.classGrade,
            voucherNumber,
            feeType: normalizedType,
            amount: feeAmounts[feeType] || 0,
            dueDate: dueDate,
            status: 'Pending',
            academicYear: `${year}-${parseInt(year) + 1}`
          });
        }
      }
    }
    
    let created = 0;
    if (feesToCreate.length > 0) {
      const result = await Fee.insertMany(feesToCreate);
      created = result.length;
    }
    
    res.json({ 
      message: `Created ${created} fee records for ${month}`,
      created,
      skipped: (students.length * selectedFeeTypes.length) - created,
      totalStudents: students.length,
      feeTypesCount: selectedFeeTypes.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
