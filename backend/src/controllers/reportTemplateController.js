const ReportTemplate = require('../models/ReportTemplate');

const AVAILABLE_FIELDS = {
  student: [
    { key: 'studentId', label: 'Roll No', type: 'string' },
    { key: 'firstName', label: 'First Name', type: 'string' },
    { key: 'lastName', label: 'Last Name', type: 'string' },
    { key: 'fatherName', label: 'Father Name', type: 'string' },
    { key: 'gender', label: 'Gender', type: 'string' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'phone', label: 'Phone', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'address', label: 'Address', type: 'string' },
    { key: 'classGrade.name', label: 'Class', type: 'string' },
    { key: 'section.name', label: 'Section', type: 'string' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'admissionDate', label: 'Admission Date', type: 'date' },
    { key: 'religion', label: 'Religion', type: 'string' },
    { key: 'bloodGroup', label: 'Blood Group', type: 'string' },
    { key: 'familyNumber', label: 'Family #', type: 'string' },
  ],
  teacher: [
    { key: 'employeeId', label: 'Employee ID', type: 'string' },
    { key: 'firstName', label: 'First Name', type: 'string' },
    { key: 'lastName', label: 'Last Name', type: 'string' },
    { key: 'gender', label: 'Gender', type: 'string' },
    { key: 'phone', label: 'Phone', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'qualification', label: 'Qualification', type: 'string' },
    { key: 'department', label: 'Department', type: 'string' },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
    { key: 'salary', label: 'Salary', type: 'currency' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'designation', label: 'Designation', type: 'string' },
    { key: 'experience', label: 'Experience (Years)', type: 'number' },
  ],
  staff: [
    { key: 'employeeId', label: 'Employee ID', type: 'string' },
    { key: 'firstName', label: 'First Name', type: 'string' },
    { key: 'lastName', label: 'Last Name', type: 'string' },
    { key: 'phone', label: 'Phone', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'role.name', label: 'Role', type: 'string' },
    { key: 'department.name', label: 'Department', type: 'string' },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
    { key: 'salary', label: 'Salary', type: 'currency' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'designation', label: 'Designation', type: 'string' },
  ],
  fee: [
    { key: 'voucherNumber', label: 'Voucher #', type: 'string' },
    { key: 'student.firstName', label: 'First Name', type: 'string' },
    { key: 'student.lastName', label: 'Last Name', type: 'string' },
    { key: 'student.studentId', label: 'Roll No', type: 'string' },
    { key: 'student.fatherName', label: 'Father Name', type: 'string' },
    { key: 'classGrade.name', label: 'Class', type: 'string' },
    { key: 'feeType', label: 'Fee Type', type: 'string' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'paidAmount', label: 'Paid Amount', type: 'currency' },
    { key: 'balance', label: 'Balance', type: 'currency' },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
    { key: 'paidDate', label: 'Paid Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'month', label: 'Month', type: 'string' },
    { key: 'year', label: 'Year', type: 'string' },
    { key: 'createdAt', label: 'Created Date', type: 'date' },
  ],
  expense: [
    { key: 'voucherNumber', label: 'Voucher #', type: 'string' },
    { key: 'description', label: 'Description', type: 'string' },
    { key: 'category', label: 'Category', type: 'string' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'addedBy.username', label: 'Added By', type: 'string' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'paymentMethod', label: 'Payment Method', type: 'string' },
    { key: 'vendor', label: 'Vendor', type: 'string' },
    { key: 'invoiceNumber', label: 'Invoice #', type: 'string' },
  ],
  attendance: [
    { key: 'student.firstName', label: 'First Name', type: 'string' },
    { key: 'student.lastName', label: 'Last Name', type: 'string' },
    { key: 'student.studentId', label: 'Roll No', type: 'string' },
    { key: 'classGrade.name', label: 'Class', type: 'string' },
    { key: 'attendeeType', label: 'Type', type: 'string' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'remarks', label: 'Remarks', type: 'string' },
  ],
  marks: [
    { key: 'student.firstName', label: 'First Name', type: 'string' },
    { key: 'student.lastName', label: 'Last Name', type: 'string' },
    { key: 'student.studentId', label: 'Roll No', type: 'string' },
    { key: 'classGrade.name', label: 'Class', type: 'string' },
    { key: 'course.name', label: 'Course', type: 'string' },
    { key: 'examType', label: 'Exam Type', type: 'string' },
    { key: 'marksObtained', label: 'Marks Obtained', type: 'number' },
    { key: 'totalMarks', label: 'Total Marks', type: 'number' },
    { key: 'percentage', label: 'Percentage', type: 'percentage' },
    { key: 'grade', label: 'Grade', type: 'string' },
    { key: 'term.name', label: 'Term', type: 'string' },
    { key: 'subject.name', label: 'Subject', type: 'string' },
  ]
};

exports.getAvailableFields = async (req, res) => {
  try {
    const { entityType } = req.params;
    const fields = AVAILABLE_FIELDS[entityType] || [];
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllEntityTypes = async (req, res) => {
  try {
    const entityTypes = Object.keys(AVAILABLE_FIELDS).map(key => ({
      value: key,
      fields: AVAILABLE_FIELDS[key]
    }));
    res.json(entityTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReportTemplates = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const query = { ...req.tenantQuery, isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const templates = await ReportTemplate.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ReportTemplate.countDocuments(query);
    
    res.json({
      templates,
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

exports.getReportTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('createdBy', 'username');
    if (!template) return res.status(404).json({ message: 'Report template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReportTemplate = async (req, res) => {
  try {
    const template = new ReportTemplate({
      ...req.body,
      school: req.user.school,
      createdBy: req.user.id
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReportTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ message: 'Report template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReportTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      { isActive: false },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Report template not found' });
    res.json({ message: 'Report template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.duplicateReportTemplate = async (req, res) => {
  try {
    const original = await ReportTemplate.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!original) return res.status(404).json({ message: 'Report template not found' });
    
    const duplicate = new ReportTemplate({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      isDefault: false,
      createdBy: req.user.id
    });
    await duplicate.save();
    res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportData = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await ReportTemplate.findOne({ _id: id, ...req.tenantQuery });
    if (!template) return res.status(404).json({ message: 'Report template not found' });

    let data = [];
    const filters = req.body.filters || {};
    const { page = 1, limit = 500 } = req.body;

    switch (template.entityType) {
      case 'student':
        data = await getStudentData(template, filters, req.tenantQuery, page, limit);
        break;
      case 'teacher':
        data = await getTeacherData(template, filters, req.tenantQuery, page, limit);
        break;
      case 'staff':
        data = await getStaffData(template, filters, req.tenantQuery, page, limit);
        break;
      case 'fee':
        data = await getFeeData(template, filters, req.tenantQuery, page, limit);
        break;
      case 'expense':
        data = await getExpenseData(template, filters, req.tenantQuery, page, limit);
        break;
      case 'attendance':
        data = await getAttendanceData(template, filters, req.tenantQuery, page, limit);
        break;
      case 'marks':
        data = await getMarksData(template, filters, req.tenantQuery, page, limit);
        break;
      default:
        data = [];
    }

    res.json({ 
      template, 
      data,
      count: data.length,
      entityType: template.entityType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function getStudentData(template, filters, tenantQuery, page, limit) {
  const Student = require('../models/Student');
  
  let query = { ...tenantQuery };
  
  if (filters.status) query.status = filters.status;
  if (filters.classGrade) query.classGrade = filters.classGrade;
  if (filters.gender) query.gender = filters.gender;
  if (filters.search) {
    query.$or = [
      { firstName: { $regex: filters.search, $options: 'i' } },
      { lastName: { $regex: filters.search, $options: 'i' } },
      { studentId: { $regex: filters.search, $options: 'i' } },
      { fatherName: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  let students = await Student.find(query)
    .populate('classGrade', 'name')
    .populate('section', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return students.map(s => ({
    ...s.toObject(),
    'classGrade.name': s.classGrade?.name,
    'section.name': s.section?.name
  }));
}

async function getTeacherData(template, filters, tenantQuery, page, limit) {
  const Teacher = require('../models/Teacher');
  
  let query = { ...tenantQuery };
  
  if (filters.status) query.status = filters.status;
  if (filters.department) query.department = filters.department;
  if (filters.gender) query.gender = filters.gender;
  if (filters.search) {
    query.$or = [
      { firstName: { $regex: filters.search, $options: 'i' } },
      { lastName: { $regex: filters.search, $options: 'i' } },
      { employeeId: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  let teachers = await Teacher.find(query)
    .populate('department', 'name')
    .populate('userId', 'username')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return teachers.map(t => ({
    ...t.toObject(),
    'department.name': t.department?.name,
    'addedBy.username': t.userId?.username
  }));
}

async function getStaffData(template, filters, tenantQuery, page, limit) {
  const Staff = require('../models/Staff');
  
  let query = { ...tenantQuery };
  
  if (filters.status) query.status = filters.status;
  if (filters.department) query.department = filters.department;
  if (filters.search) {
    query.$or = [
      { firstName: { $regex: filters.search, $options: 'i' } },
      { lastName: { $regex: filters.search, $options: 'i' } },
      { employeeId: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  let staff = await Staff.find(query)
    .populate('department', 'name')
    .populate('role', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return staff.map(s => ({
    ...s.toObject(),
    'department.name': s.department?.name,
    'role.name': s.role?.name
  }));
}

async function getFeeData(template, filters, tenantQuery, page, limit) {
  const Fee = require('../models/Fee');
  
  let query = { ...tenantQuery };
  
  if (filters.status) query.status = filters.status;
  if (filters.feeType) query.feeType = filters.feeType;
  if (filters.month) query.month = filters.month;
  if (filters.year) query.year = filters.year;
  if (filters.student) {
    query['student'] = filters.student;
  }
  if (filters.fromDate) {
    query.createdAt = { ...query.createdAt, $gte: new Date(filters.fromDate) };
  }
  if (filters.toDate) {
    query.createdAt = { ...query.createdAt, $lte: new Date(filters.toDate) };
  }
  
  let fees = await Fee.find(query)
    .populate('student', 'firstName lastName studentId fatherName')
    .populate('classGrade', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return fees.map(f => ({
    ...f.toObject(),
    'student.firstName': f.student?.firstName,
    'student.lastName': f.student?.lastName,
    'student.studentId': f.student?.studentId,
    'student.fatherName': f.student?.fatherName,
    'classGrade.name': f.classGrade?.name
  }));
}

async function getExpenseData(template, filters, tenantQuery, page, limit) {
  const Expense = require('../models/Expense');
  
  let query = { ...tenantQuery };
  
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.vendor) query.vendor = { $regex: filters.vendor, $options: 'i' };
  if (filters.fromDate) {
    query.date = { ...query.date, $gte: new Date(filters.fromDate) };
  }
  if (filters.toDate) {
    query.date = { ...query.date, $lte: new Date(filters.toDate) };
  }
  
  let expenses = await Expense.find(query)
    .populate('addedBy', 'username')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return expenses.map(e => ({
    ...e.toObject(),
    'addedBy.username': e.addedBy?.username
  }));
}

async function getAttendanceData(template, filters, tenantQuery, page, limit) {
  const Attendance = require('../models/Attendance');
  
  let query = { ...tenantQuery };
  
  if (filters.attendeeType) query.attendeeType = filters.attendeeType;
  if (filters.status) query.status = filters.status;
  if (filters.student) query.student = filters.student;
  if (filters.classGrade) query.classGrade = filters.classGrade;
  if (filters.date) {
    const dateObj = new Date(filters.date);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }
  if (filters.fromDate) {
    query.date = { ...query.date, $gte: new Date(filters.fromDate) };
  }
  if (filters.toDate) {
    query.date = { ...query.date, $lte: new Date(filters.toDate) };
  }
  
  let attendance = await Attendance.find(query)
    .populate('student', 'firstName lastName studentId')
    .populate('classGrade', 'name')
    .populate('teacher', 'firstName lastName')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return attendance.map(a => ({
    ...a.toObject(),
    'student.firstName': a.student?.firstName,
    'student.lastName': a.student?.lastName,
    'student.studentId': a.student?.studentId,
    'classGrade.name': a.classGrade?.name
  }));
}

async function getMarksData(template, filters, tenantQuery, page, limit) {
  const Grade = require('../models/Grade');
  
  let query = { ...tenantQuery };
  
  if (filters.examType) query.examType = filters.examType;
  if (filters.student) query.student = filters.student;
  if (filters.classGrade) query.classGrade = filters.classGrade;
  if (filters.course) query.course = filters.course;
  if (filters.term) query.term = filters.term;
  
  let marks = await Grade.find(query)
    .populate('student', 'firstName lastName studentId')
    .populate('classGrade', 'name')
    .populate('course', 'name')
    .populate('term', 'name')
    .populate('subject', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return marks.map(m => ({
    ...m.toObject(),
    'student.firstName': m.student?.firstName,
    'student.lastName': m.student?.lastName,
    'student.studentId': m.student?.studentId,
    'classGrade.name': m.classGrade?.name,
    'course.name': m.course?.name,
    'term.name': m.term?.name,
    'subject.name': m.subject?.name
  }));
}

function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}
