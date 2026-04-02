const SchoolSubscription = require('../models/SchoolSubscription');
const School = require('../models/School');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Branch = require('../models/Branch');

const subscriptionController = {
  getPlans: async (req, res) => {
    try {
      let plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
      
      if (plans.length === 0) {
        const defaultPlans = SubscriptionPlan.getDefaultPlans();
        await SubscriptionPlan.insertMany(defaultPlans);
        plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
      }
      
      res.json(plans);
    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  },
  
  getSchoolSubscription: async (req, res) => {
    try {
      const schoolId = req.tenantId;
      
      let subscription = await SchoolSubscription.findOne({ school: schoolId })
        .populate('school', 'name code email');
      
      if (!subscription) {
        subscription = new SchoolSubscription({ school: schoolId });
        await subscription.save();
        subscription = await SchoolSubscription.findById(subscription._id)
          .populate('school', 'name code email');
      }
      
      const usage = await getSchoolUsage(schoolId);
      
      res.json({ subscription, usage });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  },
  
  updatePlan: async (req, res) => {
    try {
      const schoolId = req.tenantId;
      const { plan, billingCycle } = req.body;
      
      const subscription = await SchoolSubscription.findOne({ school: schoolId });
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      subscription.plan = plan || subscription.plan;
      if (billingCycle) subscription.billingCycle = billingCycle;
      
      const now = new Date();
      let periodEnd;
      
      if (subscription.billingCycle === 'Yearly') {
        periodEnd = new Date(now);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else if (subscription.billingCycle === 'Quarterly') {
        periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 3);
      } else {
        periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.nextBillingDate = periodEnd;
      subscription.status = 'Active';
      
      await subscription.save();
      
      await School.findByIdAndUpdate(schoolId, {
        'subscription.plan': plan,
        'subscription.status': 'Active'
      });
      
      res.json({ message: 'Subscription updated', subscription });
    } catch (error) {
      console.error('Update plan error:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  },
  
  cancelSubscription: async (req, res) => {
    try {
      const schoolId = req.tenantId;
      const { reason } = req.body;
      
      const subscription = await SchoolSubscription.findOne({ school: schoolId });
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      subscription.status = 'Cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = reason;
      subscription.autoRenew = false;
      
      await subscription.save();
      
      res.json({ message: 'Subscription cancelled', subscription });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  },
  
  getAllSubscriptions: async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;
      
      let query = {};
      if (status) query.status = status;
      
      const [subscriptions, total] = await Promise.all([
        SchoolSubscription.find(query)
          .populate('school', 'name code email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        SchoolSubscription.countDocuments(query)
      ]);
      
      const schools = await School.find({ isActive: true }).select('_id name code');
      
      res.json({
        subscriptions,
        schools,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all subscriptions error:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  },
  
  updateSubscriptionByAdmin: async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { plan, status, limits, autoRenew } = req.body;
      
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Only super admin can update subscriptions' });
      }
      
      let subscription = await SchoolSubscription.findOne({ school: schoolId });
      
      if (!subscription) {
        subscription = new SchoolSubscription({ school: schoolId });
      }
      
      if (plan) subscription.plan = plan;
      if (status) subscription.status = status;
      if (limits) subscription.limits = { ...subscription.limits, ...limits };
      if (typeof autoRenew === 'boolean') subscription.autoRenew = autoRenew;
      
      await subscription.save();
      
      if (plan || status) {
        await School.findByIdAndUpdate(schoolId, {
          ...(plan && { 'subscription.plan': plan }),
          ...(status && { 'subscription.status': status })
        });
      }
      
      res.json({ message: 'Subscription updated', subscription });
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  },
  
  checkUsage: async (req, res) => {
    try {
      const schoolId = req.tenantId;
      const usage = await getSchoolUsage(schoolId);
      
      const subscription = await SchoolSubscription.findOne({ school: schoolId });
      
      if (!subscription) {
        return res.status(404).json({ message: 'No subscription found' });
      }
      
      const warnings = [];
      const overLimits = [];
      
      if (usage.students >= subscription.limits.maxStudents) {
        overLimits.push({
          type: 'students',
          used: usage.students,
          limit: subscription.limits.maxStudents,
          message: `Student limit reached (${usage.students}/${subscription.limits.maxStudents})`
        });
      } else if (usage.students >= subscription.limits.maxStudents * 0.9) {
        warnings.push({
          type: 'students',
          used: usage.students,
          limit: subscription.limits.maxStudents,
          message: `Approaching student limit (${usage.students}/${subscription.limits.maxStudents})`
        });
      }
      
      if (usage.teachers >= subscription.limits.maxTeachers) {
        overLimits.push({
          type: 'teachers',
          used: usage.teachers,
          limit: subscription.limits.maxTeachers,
          message: `Teacher limit reached (${usage.teachers}/${subscription.limits.maxTeachers})`
        });
      }
      
      if (usage.branches >= subscription.limits.maxBranches) {
        overLimits.push({
          type: 'branches',
          used: usage.branches,
          limit: subscription.limits.maxBranches,
          message: `Branch limit reached (${usage.branches}/${subscription.limits.maxBranches})`
        });
      }
      
      res.json({
        usage,
        limits: subscription.limits,
        warnings,
        overLimits,
        plan: subscription.plan,
        status: subscription.status
      });
    } catch (error) {
      console.error('Check usage error:', error);
      res.status(500).json({ message: 'Failed to check usage' });
    }
  },
  
  getBillingHistory: async (req, res) => {
    try {
      const schoolId = req.tenantId;
      
      const subscription = await SchoolSubscription.findOne({ school: schoolId })
        .populate('billingHistory.invoiceId');
      
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      const invoices = await Invoice.find({ school: schoolId })
        .sort({ createdAt: -1 })
        .limit(12);
      
      res.json({ billingHistory: subscription.billingHistory, invoices });
    } catch (error) {
      console.error('Get billing history error:', error);
      res.status(500).json({ message: 'Failed to fetch billing history' });
    }
  },
  
  checkAccess: async (req, res) => {
    try {
      const schoolId = req.tenantId;
      
      if (!schoolId) {
        return res.json({ 
          hasAccess: true, 
          reason: 'No school context',
          canGenerateInvoices: true
        });
      }
      
      const school = await School.findById(schoolId);
      if (!school) {
        return res.json({ hasAccess: true, reason: 'School not found' });
      }
      
      const subscription = await SchoolSubscription.findOne({ school: schoolId });
      
      if (!subscription) {
        return res.json({ 
          hasAccess: false, 
          reason: 'No subscription found',
          message: 'Please contact support to set up your subscription'
        });
      }
      
      if (subscription.status === 'Trial') {
        const now = new Date();
        const trialEnd = new Date(subscription.trialEndsAt);
        if (now > trialEnd) {
          return res.json({ 
            hasAccess: false, 
            reason: 'Trial expired',
            message: 'Your trial period has ended. Please subscribe to continue.',
            trialEndedAt: trialEnd
          });
        }
        return res.json({ 
          hasAccess: true, 
          reason: 'Trial active',
          trialDaysRemaining: Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)),
          canGenerateInvoices: false
        });
      }
      
      if (subscription.status === 'Cancelled' || subscription.status === 'Suspended') {
        return res.json({ 
          hasAccess: false, 
          reason: subscription.status,
          message: `Your subscription has been ${subscription.status.toLowerCase()}. Please contact support.`
        });
      }
      
      if (subscription.status === 'Active') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdueInvoices = await Invoice.find({
          school: schoolId,
          status: { $in: ['Generated', 'Sent', 'Overdue'] },
          dueDate: { $lt: today }
        });
        
        if (overdueInvoices.length > 0) {
          const oldestOverdue = overdueInvoices.reduce((oldest, inv) => {
            return inv.dueDate < oldest.dueDate ? inv : oldest;
          });
          
          const daysOverdue = Math.ceil((today - new Date(oldestOverdue.dueDate)) / (1000 * 60 * 60 * 24));
          
          if (daysOverdue > 2) {
            return res.json({ 
              hasAccess: false, 
              reason: 'Payment overdue',
              message: `Payment overdue by ${daysOverdue} days. Please clear your outstanding balance to continue.`,
              overdueDays: daysOverdue,
              outstandingAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.charges?.total || 0), 0),
              canGenerateInvoices: false
            });
          }
          
          return res.json({ 
            hasAccess: true, 
            reason: 'Grace period',
            message: `Payment reminder: ${daysOverdue} days overdue. Please pay within grace period.`,
            overdueDays: daysOverdue,
            daysUntilLock: 2 - daysOverdue,
            canGenerateInvoices: false
          });
        }
        
        return res.json({ 
          hasAccess: true, 
          reason: 'Active',
          canGenerateInvoices: true
        });
      }
      
      res.json({ hasAccess: true, reason: 'Unknown status' });
    } catch (error) {
      console.error('Check access error:', error);
      res.status(500).json({ message: 'Failed to check subscription access' });
    }
  }
};

async function getSchoolUsage(schoolId) {
  const Student = require('../models/Student');
  const Teacher = require('../models/Teacher');
  const Branch = require('../models/Branch');
  
  const [students, teachers, branches] = await Promise.all([
    Student.countDocuments({ school: schoolId, status: 'Active' }),
    Teacher.countDocuments({ school: schoolId, status: 'Active' }),
    Branch.countDocuments({ school: schoolId, status: 'Active' })
  ]);
  
  return { students, teachers, branches };
}

module.exports = subscriptionController;
