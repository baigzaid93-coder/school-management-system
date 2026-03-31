const Student = require('../models/Student');
const Fee = require('../models/Fee');
const User = require('../models/User');
const Role = require('../models/Role');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalRequest = require('../models/ApprovalRequest');
const { generateStudentId } = require('../utils/idGenerator');

exports.getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, all } = req.query;
    const query = { ...req.tenantQuery };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { familyNumber: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } }
      ];
    }
    
    let students;
    let total;
    
    if (all === 'true') {
      students = await Student.find(query)
        .populate('class', 'name code')
        .populate('classGrade', 'name')
        .populate('section', 'name')
        .populate('userId', 'username email isActive role')
        .sort({ studentId: 1 });
      total = students.length;
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      students = await Student.find(query)
        .populate('class', 'name code')
        .populate('classGrade', 'name')
        .populate('section', 'name')
        .populate('userId', 'username email isActive role')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ studentId: 1 });
      total = await Student.countDocuments(query);
    }
    
    res.json({
      students,
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

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, ...req.tenantQuery }).populate('class', 'name code').populate('userId', 'username email isActive role');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSiblingsByFamily = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, ...req.tenantQuery });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    if (!student.familyNumber) {
      return res.json({ siblings: [], message: 'No family number assigned' });
    }
    
    const siblings = await Student.find({
      _id: { $ne: student._id },
      familyNumber: student.familyNumber,
      ...req.tenantQuery
    }).populate('classGrade', 'name');
    
    const allStudents = [student, ...siblings];
    
    const studentIds = allStudents.map(s => s._id);
    const fees = await Fee.find({
      student: { $in: studentIds },
      ...req.tenantQuery
    }).sort({ dueDate: -1 });
    
    const feesByStudent = {};
    fees.forEach(fee => {
      const studentId = fee.student.toString();
      if (!feesByStudent[studentId]) {
        feesByStudent[studentId] = [];
      }
      feesByStudent[studentId].push(fee);
    });
    
    const result = allStudents.map(s => ({
      ...s.toObject(),
      fees: feesByStudent[s._id.toString()] || []
    }));
    
    res.json({ siblings: result, familyNumber: student.familyNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        updateData[key] = undefined;
      }
    });
    
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      updateData,
      { new: true }
    ).populate('userId', 'username email isActive role');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school || req.body.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const studentId = req.body.studentId || await generateStudentId(schoolId);
    
    const studentData = { ...req.body };
    Object.keys(studentData).forEach(key => {
      if (studentData[key] === '') {
        studentData[key] = undefined;
      }
    });
    
    Object.assign(studentData, {
      studentId: studentId,
      admissionDate: new Date(),
      admissionStatus: 'Pending',
      status: 'Active',
      school: schoolId
    });
    
    const student = new Student(studentData);
    await student.save();

    const workflow = await ApprovalWorkflow.findOne({
      school: schoolId,
      type: 'admission',
      isActive: true,
      isDefault: true
    });

    if (workflow) {
      const user = await User.findById(req.user?.id);
      const approvalRequest = new ApprovalRequest({
        workflow: workflow._id,
        school: schoolId,
        type: 'admission',
        referenceId: student._id,
        referenceModel: 'Student',
        requester: req.user?.id,
        requesterName: user?.firstName + ' ' + user?.lastName,
        data: {
          firstName: student.firstName,
          lastName: student.lastName,
          classGrade: student.classGrade,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          email: student.email
        },
        currentLevel: 1,
        totalLevels: workflow.levels.length || 1,
        status: 'pending',
        priority: 'normal',
        source: 'manual',
        history: [{
          level: 0,
          action: 'submit',
          actionBy: req.user?.id,
          actionByName: user?.firstName + ' ' + user?.lastName,
          actionAt: new Date(),
          comments: 'Student admission submitted for approval'
        }]
      });
      await approvalRequest.save();
      
      student.approvalRequestId = approvalRequest._id;
      await student.save();
    }
    
    await student.populate('userId', 'username email isActive role');
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.searchStudents = async (req, res) => {
  try {
    const { q } = req.query;
    const query = {
      ...req.tenantQuery,
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { familyNumber: { $regex: q, $options: 'i' } },
        { parentPhone: { $regex: q, $options: 'i' } }
      ]
    };
    const students = await Student.find(query).populate('class', 'name code');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingAdmissions = async (req, res) => {
  try {
    const query = { ...req.tenantQuery, admissionStatus: 'Pending' };
    const { page = 1, limit = 20, search } = req.query;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { familyNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await Student.find(query)
      .populate('classGrade', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Student.countDocuments(query);
    
    res.json({
      students,
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

exports.getAllAdmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    if (!req.tenantQuery) {
      return res.status(500).json({ message: 'Tenant query not set' });
    }
    
    const query = { ...req.tenantQuery };
    
    if (status) {
      query.admissionStatus = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { familyNumber: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await Student.find(query)
      .populate('classGrade', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Student.countDocuments(query);
    
    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllAdmissions error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user?._id;
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.admissionStatus !== 'Pending') {
      return res.status(400).json({ message: 'This admission has already been processed' });
    }

    if (student.approvalRequestId) {
      const approvalReq = await ApprovalRequest.findById(student.approvalRequestId);
      if (approvalReq && approvalReq.status === 'pending') {
        const user = await User.findById(userId);
        approvalReq.history.push({
          level: approvalReq.currentLevel,
          action: 'approve',
          actionBy: userId,
          actionByName: user?.firstName + ' ' + user?.lastName,
          actionAt: new Date(),
          comments: comments || 'Admission approved'
        });
        approvalReq.status = 'approved';
        await approvalReq.save();
      }
    }
    
    student.admissionStatus = 'Approved';
    student.approvedBy = userId;
    student.approvedAt = new Date();
    await student.save();
    
    const schoolId = student.school;
    
    const feeTypes = [
      { type: 'Registration', amount: student.admissionForm?.fee?.admissionFee || 5000, label: 'Admission Fee' },
      { type: 'Tuition', amount: student.admissionForm?.fee?.monthlyTuitionFee || 3000, label: 'Monthly Tuition Fee' },
      { type: 'Activity', amount: student.admissionForm?.fee?.securityFee || 2000, label: 'Security Fee' }
    ];
    
    const createdFees = [];
    for (const feeType of feeTypes) {
      if (feeType.amount > 0) {
        const fee = new Fee({
          student: student._id,
          school: schoolId,
          feeType: feeType.type,
          amount: feeType.amount,
          paidAmount: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'Pending',
          academicYear: student.admissionForm?.session || new Date().getFullYear().toString(),
          term: '1',
          description: feeType.label,
          payments: []
        });
        await fee.save();
        createdFees.push(fee);
      }
    }
    
    student.fees = createdFees.map(f => f._id);
    student.status = 'Active';
    await student.save();
    
    const studentRole = await Role.findOne({ code: 'STUDENT' });
    const firstName = student.firstName || 'Student';
    const lastName = student.lastName || 'User';
    const username = `${firstName.toLowerCase()}.${student.studentId.toLowerCase()}`;
    const defaultPassword = `student${firstName.toLowerCase()}123`;
    
    const existingUser = await User.findOne({ $or: [{ email: student.email }, { username }] });
    if (!existingUser) {
      const user = new User({
        username,
        email: student.email || `${student.studentId.toLowerCase()}@school.edu`,
        password: defaultPassword,
        role: studentRole._id,
        school: schoolId,
        profile: {
          firstName: firstName,
          lastName: lastName,
          phone: student.phone
        },
        studentId: student._id
      });
      await user.save();
      
      student.userId = user._id;
      await student.save();
    }
    
    await student.populate('userId', 'username email isActive role');
    await student.populate('approvedBy', 'firstName lastName');
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?._id;
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.admissionStatus !== 'Pending') {
      return res.status(400).json({ message: 'This admission has already been processed' });
    }

    if (student.approvalRequestId) {
      const approvalReq = await ApprovalRequest.findById(student.approvalRequestId);
      if (approvalReq && approvalReq.status === 'pending') {
        const user = await User.findById(userId);
        approvalReq.history.push({
          level: approvalReq.currentLevel,
          action: 'reject',
          actionBy: userId,
          actionByName: user?.firstName + ' ' + user?.lastName,
          actionAt: new Date(),
          comments: reason || 'Admission rejected'
        });
        approvalReq.status = 'rejected';
        approvalReq.rejectionReason = reason;
        await approvalReq.save();
      }
    }
    
    student.admissionStatus = 'Rejected';
    student.approvedBy = userId;
    student.approvedAt = new Date();
    student.rejectionReason = reason;
    student.status = 'Inactive';
    await student.save();
    
    await student.populate('approvedBy', 'firstName lastName');
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
