const Admission = require('../models/Admission');
const AuditLog = require('../models/AuditLog');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Course = require('../models/Course');
const { generateStudentId } = require('../utils/idGenerator');

const createAuditLog = async (userId, action, admissionId, details, req, schoolId) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      module: 'ADMISSION',
      entity: 'Admission',
      entityId: admissionId,
      newValues: details,
      school: schoolId,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

const getAdmissions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      status, 
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const query = { ...req.tenantQuery };
    
    if (status) {
      query['inquiry.status'] = status;
    }
    
    if (search) {
      query.$or = [
        { 'inquiry.inquiryNo': { $regex: search, $options: 'i' } },
        { 'student.fullName': { $regex: search, $options: 'i' } },
        { 'father.mobile': { $regex: search, $options: 'i' } },
        { 'father.email': { $regex: search, $options: 'i' } },
        { 'mother.mobile': { $regex: search, $options: 'i' } },
        { inquiryId: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;
    
    const admissions = await Admission.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Admission.countDocuments(query);
    
    res.json({
      admissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdmissionById = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    res.json(admission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createInquiry = async (req, res) => {
  try {
    const admissionData = {
      ...req.body,
      inquiry: {
        ...req.body.inquiry,
        date: req.body.inquiry?.date ? new Date(req.body.inquiry.date) : new Date(),
        status: 'new'
      },
      applicationStatus: 'inquiry',
      createdBy: req.user?._id
    };
    
    const admission = new Admission(admissionData);
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'CREATE',
      admission._id,
      { inquiryId: admission.inquiryId, studentName: req.body.student?.fullName },
      req,
      req.tenantQuery?.school
    );
    
    res.status(201).json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const submitApplication = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    Object.assign(admission, req.body);
    admission.applicationStatus = 'application-submitted';
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'UPDATE',
      admission._id,
      { status: admission.applicationStatus },
      req,
      req.tenantQuery?.school
    );
    
    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateAdmission = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    if (req.body.inquiry) {
      admission.inquiry = { ...admission.inquiry, ...req.body.inquiry };
    }
    if (req.body.student) {
      admission.student = { ...admission.student, ...req.body.student };
    }
    if (req.body.father) {
      admission.father = { ...admission.father, ...req.body.father };
    }
    if (req.body.mother) {
      admission.mother = { ...admission.mother, ...req.body.mother };
    }
    if (req.body.primaryContact) {
      admission.primaryContact = { ...admission.primaryContact, ...req.body.primaryContact };
    }
    if (req.body.address) {
      admission.address = { ...admission.address, ...req.body.address };
    }
    if (req.body.source) {
      admission.source = { ...admission.source, ...req.body.source };
    }
    if (req.body.academic) {
      admission.academic = { ...admission.academic, ...req.body.academic };
    }
    if (req.body.siblings) {
      admission.siblings = { ...admission.siblings, ...req.body.siblings };
    }
    if (req.body.discussion) {
      admission.discussion = { ...admission.discussion, ...req.body.discussion };
    }
    if (req.body.documents) {
      admission.documents = { ...admission.documents, ...req.body.documents };
    }
    if (req.body.declaration) {
      admission.declaration = { ...admission.declaration, ...req.body.declaration };
    }
    
    admission.updatedBy = req.user?._id;
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'UPDATE',
      admission._id,
      { updatedFields: Object.keys(req.body) },
      req,
      req.tenantQuery?.school
    );
    
    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteAdmission = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    if (admission.applicationStatus === 'enrolled') {
      return res.status(400).json({ message: 'Cannot delete an enrolled student' });
    }
    
    await Admission.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    
    await createAuditLog(
      req.user?._id,
      'DELETE',
      req.params.id,
      { inquiryId: admission.inquiryId },
      req,
      req.tenantQuery?.school
    );
    
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const convertToAdmission = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    if (admission.inquiry.status === 'converted') {
      return res.status(400).json({ message: 'Already converted to admission' });
    }
    
    const studentNameParts = (admission.student?.fullName || 'Student Name').split(' ');
    const firstName = studentNameParts[0] || 'Student';
    const lastName = studentNameParts.slice(1).join(' ') || 'Student';
    
    const schoolId = admission.school;
    const studentId = await generateStudentId(schoolId);
    
    let gender = admission.student?.gender || 'Male';
    if (gender === 'male') gender = 'Male';
    else if (gender === 'female') gender = 'Female';
    else if (gender === 'other') gender = 'Other';
    
    const newStudent = new Student({
      school: schoolId,
      studentId: studentId,
      firstName: firstName || 'Student',
      lastName: lastName || 'Student',
      dateOfBirth: admission.student?.dateOfBirth ? new Date(admission.student.dateOfBirth) : new Date('2015-01-01'),
      gender: gender,
      email: admission.father?.email || '',
      phone: admission.father?.mobile || admission.mother?.mobile || '',
      address: {
        street: admission.address?.houseNo || admission.address?.area || '',
        city: admission.address?.city || '',
        state: '',
        zipCode: admission.address?.postalCode || ''
      },
      class: null,
      admissionDate: new Date(),
      status: 'Active',
      parentName: admission.father?.fullName || '',
      parentPhone: admission.father?.mobile || '',
      parentEmail: admission.father?.email || ''
    });
    
    await newStudent.save();
    
    let course = null;
    if (admission.academic?.desiredClass) {
      course = await Course.findOne({ name: { $regex: admission.academic.desiredClass, $options: 'i' } });
      if (course) {
        newStudent.class = course._id;
        await newStudent.save();
      }
    }
    
    const feeTypes = [
      { type: 'Registration', amount: req.body.fee?.admissionFee || 5000, label: 'Admission Fee' },
      { type: 'Tuition', amount: req.body.fee?.monthlyTuitionFee || 3000, label: 'Tuition Fee' },
      { type: 'Activity', amount: req.body.fee?.securityFee || 2000, label: 'Security Fee' }
    ];
    
    const createdFees = [];
    for (const feeType of feeTypes) {
      const newFee = new Fee({
        student: newStudent._id,
        feeType: feeType.type,
        amount: feeType.amount,
        paidAmount: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'Pending',
        academicYear: admission.academic?.session || new Date().getFullYear().toString(),
        term: '1',
        description: feeType.label,
        payments: []
      });
      await newFee.save();
      createdFees.push(newFee);
    }
    
    admission.inquiry.status = 'converted';
    admission.applicationStatus = 'enrolled';
    admission.studentRecord = newStudent._id;
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'UPDATE',
      admission._id,
      { 
        inquiryId: admission.inquiryId,
        studentId: studentId,
        studentName: `${firstName} ${lastName}`,
        feesCreated: createdFees.length
      },
      req,
      req.tenantQuery?.school
    );
    
    res.json({
      admission,
      student: newStudent,
      fees: createdFees,
      course: course,
      message: 'Successfully converted to admission. Student created and fees assigned.'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const closeInquiry = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    admission.inquiry.status = 'closed';
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'UPDATE',
      admission._id,
      { inquiryId: admission.inquiryId },
      req,
      req.tenantQuery?.school
    );
    
    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAdmissionStats = async (req, res) => {
  try {
    const stats = await Admission.aggregate([
      {
        $group: {
          _id: '$inquiry.status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusCounts = {};
    stats.forEach(s => {
      statusCounts[s._id] = s.count;
    });
    
    const totalInquiries = await Admission.countDocuments();
    const thisMonth = await Admission.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });
    
    res.json({
      statusCounts,
      totalInquiries,
      thisMonthInquiries: thisMonth,
      conversionRate: totalInquiries > 0 
        ? ((statusCounts['converted'] || 0) / totalInquiries * 100).toFixed(2)
        : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRequiredDocuments = async (req, res) => {
  try {
    const requiredDocs = [
      { name: 'Birth Certificate / B-Form', type: 'birth-certificate', required: true },
      { name: 'Parent CNIC Copy', type: 'parent-cnic', required: true },
      { name: 'Previous School Result', type: 'previous-result', required: true },
      { name: 'School Leaving Certificate', type: 'leaving-certificate', required: true },
      { name: 'Passport Size Photos', type: 'photos', required: true },
      { name: 'Caste Certificate', type: 'caste-certificate', required: false },
      { name: 'Domicile Certificate', type: 'domicile-certificate', required: false },
      { name: 'Medical Certificate', type: 'medical-certificate', required: false }
    ];
    
    res.json(requiredDocs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitForApproval = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    if (admission.applicationStatus !== 'inquiry') {
      return res.status(400).json({ message: 'Application already submitted' });
    }
    
    admission.applicationStatus = 'principal-pending';
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'SUBMIT',
      admission._id,
      { status: 'principal-pending' },
      req,
      req.tenantQuery?.school
    );
    
    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const principalApprove = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    if (admission.applicationStatus !== 'principal-pending') {
      return res.status(400).json({ message: 'Application not pending principal approval' });
    }
    
    admission.applicationStatus = 'accounts-pending';
    admission.principalApproval = {
      approved: true,
      approvedBy: req.user?._id,
      approvedAt: new Date(),
      remarks: req.body.remarks || ''
    };
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'APPROVE',
      admission._id,
      { status: 'accounts-pending' },
      req,
      req.tenantQuery?.school
    );
    
    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const principalReject = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    admission.applicationStatus = 'principal-rejected';
    admission.principalApproval = {
      approved: false,
      approvedBy: req.user?._id,
      approvedAt: new Date(),
      remarks: req.body.remarks || 'Rejected by Principal'
    };
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'REJECT',
      admission._id,
      { status: 'principal-rejected' },
      req,
      req.tenantQuery?.school
    );
    
    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const accountsApprove = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    if (admission.applicationStatus !== 'accounts-pending') {
      return res.status(400).json({ message: 'Application not pending accounts approval' });
    }
    
    const studentNameParts = (admission.student?.fullName || 'Student Name').split(' ');
    const firstName = studentNameParts[0] || 'Student';
    const lastName = studentNameParts.slice(1).join(' ') || 'Student';
    
    const schoolId = admission.school;
    const studentId = await generateStudentId(schoolId);
    
    let gender = admission.student?.gender || 'Male';
    if (gender === 'male') gender = 'Male';
    else if (gender === 'female') gender = 'Female';
    else if (gender === 'other') gender = 'Other';
    
    const newStudent = new Student({
      school: schoolId,
      studentId: studentId,
      firstName: firstName || 'Student',
      lastName: lastName || 'Student',
      dateOfBirth: admission.student?.dateOfBirth ? new Date(admission.student.dateOfBirth) : new Date('2015-01-01'),
      gender: gender,
      email: admission.father?.email || '',
      phone: admission.father?.mobile || admission.mother?.mobile || '',
      address: {
        street: admission.address?.houseNo || admission.address?.area || '',
        city: admission.address?.city || '',
        state: '',
        zipCode: admission.address?.postalCode || ''
      },
      class: null,
      admissionDate: new Date(),
      status: 'Active',
      parentName: admission.father?.fullName || '',
      parentPhone: admission.father?.mobile || '',
      parentEmail: admission.father?.email || ''
    });
    
    await newStudent.save();
    
    let course = null;
    if (admission.academic?.desiredClass) {
      course = await Course.findOne({ name: { $regex: admission.academic.desiredClass, $options: 'i' } });
      if (course) {
        newStudent.class = course._id;
        await newStudent.save();
      }
    }
    
    const feeAmounts = req.body.feeAmounts || {
      admissionFee: 5000,
      monthlyTuitionFee: 3000,
      securityFee: 2000
    };
    
    const feeTypes = [
      { type: 'Registration', amount: feeAmounts.admissionFee, label: 'Admission Fee' },
      { type: 'Tuition', amount: feeAmounts.monthlyTuitionFee, label: 'Monthly Tuition Fee' },
      { type: 'Activity', amount: feeAmounts.securityFee, label: 'Security Fee' }
    ];
    
    const createdFees = [];
    for (const feeType of feeTypes) {
      if (feeType.amount > 0) {
        const newFee = new Fee({
          student: newStudent._id,
          feeType: feeType.type,
          amount: feeType.amount,
          paidAmount: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'Pending',
          academicYear: admission.academic?.session || new Date().getFullYear().toString(),
          term: '1',
          description: feeType.label,
          payments: []
        });
        await newFee.save();
        createdFees.push(newFee);
      }
    }
    
    admission.applicationStatus = 'enrolled';
    admission.studentRecord = newStudent._id;
    admission.accountsApproval = {
      approved: true,
      approvedBy: req.user?._id,
      approvedAt: new Date(),
      remarks: req.body.remarks || '',
      feesAssigned: true
    };
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'APPROVE',
      admission._id,
      { 
        status: 'enrolled',
        studentId: studentId,
        feesCreated: createdFees.length
      },
      req,
      req.tenantQuery?.school
    );
    
    res.json({
      admission,
      student: newStudent,
      fees: createdFees,
      message: 'Student enrolled successfully. Fees assigned.'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const accountsReject = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, ...req.tenantQuery });
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    
    admission.applicationStatus = 'accounts-rejected';
    admission.accountsApproval = {
      approved: false,
      approvedBy: req.user?._id,
      approvedAt: new Date(),
      remarks: req.body.remarks || 'Rejected by Accounts'
    };
    admission.updatedBy = req.user?._id;
    
    await admission.save();
    
    await createAuditLog(
      req.user?._id,
      'REJECT',
      admission._id,
      { status: 'accounts-rejected' },
      req,
      req.tenantQuery?.school
    );
    
    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const status = req.query.status || 'principal-pending';
    const admissions = await Admission.find({ applicationStatus: status })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdmissions,
  getAdmissionById,
  createInquiry,
  submitApplication,
  updateAdmission,
  deleteAdmission,
  convertToAdmission,
  closeInquiry,
  getAdmissionStats,
  getRequiredDocuments,
  submitForApproval,
  principalApprove,
  principalReject,
  accountsApprove,
  accountsReject,
  getPendingApprovals
};
