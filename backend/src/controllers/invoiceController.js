const Invoice = require('../models/Invoice');
const School = require('../models/School');
const SchoolSubscription = require('../models/SchoolSubscription');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Branch = require('../models/Branch');

const invoiceController = {
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, schoolId, month, year } = req.query;
      const skip = (page - 1) * limit;
      
      let query = {};
      
      if (req.user.role === 'school_admin') {
        query.school = req.tenantId;
      } else if (schoolId) {
        query.school = schoolId;
      }
      
      if (status) query.status = status;
      if (month) query['period.month'] = month;
      if (year) query['period.year'] = parseInt(year);
      
      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .populate('school', 'name code')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Invoice.countDocuments(query)
      ]);
      
      const schools = await School.find({ isActive: true }).select('_id name code');
      
      res.json({
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        schools
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  },
  
  getBySchool: async (req, res) => {
    try {
      const schoolId = req.tenantId;
      const { status, year } = req.query;
      
      let query = { school: schoolId };
      if (status) query.status = status;
      if (year) query['period.year'] = parseInt(year);
      
      const invoices = await Invoice.find(query)
        .sort({ 'period.year': -1, 'period.month': -1 });
      
      const subscription = await SchoolSubscription.findOne({ school: schoolId });
      
      const stats = await Invoice.aggregate([
        { $match: { school: schoolId } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$charges.total' }
        }}
      ]);
      
      const summary = {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0
      };
      
      stats.forEach(s => {
        summary.total += s.total;
        if (s._id === 'Paid') summary.paid = s.total;
        if (['Generated', 'Sent'].includes(s._id)) summary.pending += s.total;
        if (s._id === 'Overdue') summary.overdue = s.total;
      });
      
      res.json({ invoices, subscription, summary });
    } catch (error) {
      console.error('Get school invoices error:', error);
      res.status(500).json({ message: 'Failed to fetch school invoices' });
    }
  },
  
  getById: async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id)
        .populate('school', 'name code address contactPerson');
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (req.user.role === 'school_admin' && invoice.school._id.toString() !== req.tenantId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Get invoice error:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  },
  
  generateMonthlyInvoices: async (req, res) => {
    try {
      const { month, year } = req.body;
      
      const targetMonth = month || new Date().getMonth() + 1;
      const targetYear = year || new Date().getFullYear();
      
      const periodStart = new Date(targetYear, targetMonth - 1, 1);
      const periodEnd = new Date(targetYear, targetMonth, 0);
      
      const schools = await School.find({ isActive: true });
      const generatedInvoices = [];
      const errors = [];
      
      for (const school of schools) {
        try {
          const existingInvoice = await Invoice.findOne({
            school: school._id,
            'period.month': targetMonth,
            'period.year': targetYear
          });
          
          if (existingInvoice) {
            errors.push({ school: school.name, error: 'Invoice already exists for this period' });
            continue;
          }
          
          const [studentCount, teacherCount, branchCount] = await Promise.all([
            Student.countDocuments({ school: school._id, status: 'Active' }),
            Teacher.countDocuments({ school: school._id, status: 'Active' }),
            Branch.countDocuments({ school: school._id, status: 'Active' })
          ]);
          
          const subscription = await SchoolSubscription.findOne({ school: school._id });
          const plan = subscription?.plan || 'Free';
          const basePrice = subscription?.price || 0;
          
          const additionalStudentCharge = Math.max(0, studentCount - (subscription?.limits?.maxStudents || 50)) * 10;
          const additionalTeacherCharge = Math.max(0, teacherCount - (subscription?.limits?.maxTeachers || 10)) * 20;
          const additionalBranchCharge = Math.max(0, branchCount - (subscription?.limits?.maxBranches || 1)) * 500;
          
          const subtotal = basePrice + additionalStudentCharge + additionalTeacherCharge + additionalBranchCharge;
          const taxAmount = 0;
          const total = subtotal + taxAmount;
          
          const dueDate = new Date(periodEnd);
          dueDate.setDate(dueDate.getDate() + 15);
          
          const invoice = new Invoice({
            school: school._id,
            subscription: {
              plan,
              price: basePrice,
              billingCycle: subscription?.billingCycle || 'Monthly'
            },
            period: {
              startDate: periodStart,
              endDate: periodEnd,
              month: targetMonth,
              year: targetYear
            },
            usage: {
              students: studentCount,
              teachers: teacherCount,
              branches: branchCount
            },
            charges: {
              baseAmount: basePrice,
              additionalStudentsCharge: additionalStudentCharge,
              additionalTeachersCharge: additionalTeacherCharge,
              additionalBranchesCharge: additionalBranchCharge,
              subtotal,
              taxRate: 0,
              taxAmount,
              discountAmount: 0,
              total
            },
            status: plan === 'Free' ? 'Paid' : 'Generated',
            dueDate,
            generatedBy: 'Auto'
          });
          
          await invoice.save();
          
          if (plan === 'Free') {
            invoice.paidDate = new Date();
            invoice.status = 'Paid';
            await invoice.save();
          }
          
          generatedInvoices.push({
            invoiceNumber: invoice.invoiceNumber,
            school: school.name,
            total: invoice.charges.total,
            status: invoice.status
          });
          
        } catch (schoolError) {
          errors.push({ school: school.name, error: schoolError.message });
        }
      }
      
      res.json({
        message: `Generated ${generatedInvoices.length} invoices`,
        invoices: generatedInvoices,
        errors,
        period: { month: targetMonth, year: targetYear }
      });
    } catch (error) {
      console.error('Generate invoices error:', error);
      res.status(500).json({ message: 'Failed to generate invoices' });
    }
  },
  
  markAsPaid: async (req, res) => {
    try {
      const { paymentMethod, paymentReference, notes } = req.body;
      
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (req.user.role === 'school_admin' && invoice.school.toString() !== req.tenantId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      invoice.status = 'Paid';
      invoice.paidDate = new Date();
      invoice.paymentMethod = paymentMethod;
      invoice.paymentReference = paymentReference;
      if (notes) invoice.notes = notes;
      
      await invoice.save();
      
      await SchoolSubscription.findOneAndUpdate(
        { school: invoice.school },
        { $push: { billingHistory: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.charges.total,
          paidAt: new Date(),
          status: 'Paid'
        }}}
      );
      
      res.json({ message: 'Invoice marked as paid', invoice });
    } catch (error) {
      console.error('Mark paid error:', error);
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  },
  
  updateStatus: async (req, res) => {
    try {
      const { status, notes } = req.body;
      
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Only super admin can update invoice status' });
      }
      
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      invoice.status = status;
      if (notes) invoice.notes = notes;
      
      if (status === 'Overdue') {
        const today = new Date();
        if (invoice.dueDate < today) {
          invoice.notes = (invoice.notes || '') + `\nMarked overdue on ${today.toLocaleDateString()}`;
        }
      }
      
      await invoice.save();
      
      res.json({ message: 'Invoice status updated', invoice });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ message: 'Failed to update invoice status' });
    }
  },
  
  sendInvoice: async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id)
        .populate('school', 'name email contactPerson');
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (req.user.role === 'school_admin' && invoice.school._id.toString() !== req.tenantId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      invoice.status = 'Sent';
      await invoice.save();
      
      res.json({ message: 'Invoice sent successfully', invoice });
    } catch (error) {
      console.error('Send invoice error:', error);
      res.status(500).json({ message: 'Failed to send invoice' });
    }
  },
  
  voidInvoice: async (req, res) => {
    try {
      const { reason } = req.body;
      
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Only super admin can void invoices' });
      }
      
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (invoice.status === 'Paid') {
        return res.status(400).json({ message: 'Cannot void a paid invoice' });
      }
      
      invoice.status = 'Void';
      invoice.notes = (invoice.notes || '') + `\nVoided: ${reason || 'No reason provided'}`;
      
      await invoice.save();
      
      res.json({ message: 'Invoice voided', invoice });
    } catch (error) {
      console.error('Void invoice error:', error);
      res.status(500).json({ message: 'Failed to void invoice' });
    }
  },
  
  getStats: async (req, res) => {
    try {
      const matchStage = {};
      
      if (req.user.role === 'school_admin') {
        matchStage.school = req.tenantId;
      }
      
      const stats = await Invoice.aggregate([
        { $match: matchStage },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$charges.total' }
        }},
        { $group: {
          _id: null,
          statuses: { $push: { status: '$_id', count: '$count', total: '$total' } },
          totalInvoices: { $sum: '$count' },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$_id', 'Paid'] }, '$charges.total', 0] } },
          totalOutstanding: { $sum: { $cond: [{ $in: ['$_id', ['Generated', 'Sent', 'Overdue']] }, '$charges.total', 0] } }
        }}
      ]);
      
      const monthlyStats = await Invoice.aggregate([
        { $match: { ...matchStage, 'period.year': new Date().getFullYear() } },
        { $group: {
          _id: { month: '$period.month', status: '$status' },
          count: { $sum: 1 },
          total: { $sum: '$charges.total' }
        }},
        { $sort: { '_id.month': 1 } }
      ]);
      
      res.json({
        overview: stats[0] || { totalInvoices: 0, totalRevenue: 0, totalOutstanding: 0, statuses: [] },
        monthly: monthlyStats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  },
  
  cleanupOrphanInvoices: async (req, res) => {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super Admin access required' });
      }
      
      const schools = await School.find().select('_id');
      const schoolIds = new Set(schools.map(s => s._id.toString()));
      
      const orphanInvoices = await Invoice.find({
        school: { $nin: Array.from(schoolIds) }
      });
      
      let deletedCount = 0;
      for (const invoice of orphanInvoices) {
        await Invoice.findByIdAndDelete(invoice._id);
        deletedCount++;
      }
      
      res.json({ 
        message: `Deleted ${deletedCount} orphan invoices`,
        deletedCount 
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({ message: 'Failed to cleanup orphan invoices' });
    }
  },
  
  deleteAllInvoices: async (req, res) => {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super Admin access required' });
      }
      
      const result = await Invoice.deleteMany({});
      
      res.json({ 
        message: `Deleted all ${result.deletedCount} invoices`,
        deletedCount: result.deletedCount 
      });
    } catch (error) {
      console.error('Delete all error:', error);
      res.status(500).json({ message: 'Failed to delete invoices' });
    }
  }
};

module.exports = invoiceController;
