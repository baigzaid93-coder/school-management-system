const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const { PERMISSIONS } = require('../models/Role');
const { generateStaffId } = require('../utils/idGenerator');

const JWT_SECRET = process.env.JWT_SECRET || 'school-management-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateTokens = (user) => {
  const roleId = user.role?._id || user.role;
  const accessToken = jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: roleId,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
};

const logAudit = async (userId, action, module, description, entity, entityId, status, metadata = {}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      module,
      description,
      entity,
      entityId,
      status,
      metadata
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, profile, teacherId, studentId, isSuperAdmin, staffId } = req.body;
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username or email already exists' 
      });
    }
    
    let roleData;
    if (role) {
      roleData = await Role.findById(role);
    } else {
      roleData = await Role.findOne({ code: 'STUDENT' });
    }
    
    if (!roleData) {
      return res.status(400).json({ message: 'Role not found' });
    }
    
    const isRequesterSuperAdmin = req.user?.isSuperAdmin === true || req.user?.role?.code === 'SUPER_ADMIN';
    const isSuperAdminFlag = isSuperAdmin === true || isSuperAdmin === 'true';
    const shouldBeSuperAdmin = isRequesterSuperAdmin && isSuperAdminFlag;
    
    const schoolId = shouldBeSuperAdmin ? undefined : (req.tenantQuery?.school || req.user?.school);
    
    const userData = {
      username,
      email,
      password,
      role: roleData._id,
      profile,
      teacherId,
      studentId,
      isSuperAdmin: shouldBeSuperAdmin,
      school: schoolId
    };
    
    if (!teacherId && !studentId && !shouldBeSuperAdmin && schoolId) {
      userData.staffId = staffId || await generateStaffId(schoolId);
    }
    
    const user = new User(userData);
    
    await user.save();
    await user.populate('role');
    
    await logAudit(user._id, 'CREATE', 'Auth', `User registered${shouldBeSuperAdmin ? ' as Super Admin' : ''}`, 'User', user._id, 'SUCCESS');
    
    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, ipAddress, userAgent } = req.body;
    
    const user = await User.findOne({ email }).select('+password').populate('role');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    if (user.isLocked()) {
      return res.status(423).json({ 
        message: 'Account is locked. Please try again later.',
        lockUntil: user.lockUntil
      });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await user.save();
      
      await logAudit(user._id, 'LOGIN', 'Auth', 'Failed login attempt', 'User', user._id, 'FAILURE');
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    await logAudit(user._id, 'LOGIN', 'Auth', 'User logged in', 'User', user._id, 'SUCCESS', { ipAddress, userAgent });
    
    res.json({
      message: 'Login successful',
      user: {
        ...user.toObject(),
        isSuperAdmin: user.isSuperAdmin,
        isSchoolAdmin: user.isSchoolAdmin,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await logAudit(req.user.id, 'LOGOUT', 'Auth', 'User logged out', 'User', req.user.id, 'SUCCESS');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const user = await User.findById(decoded.id).populate('role');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    const tokens = generateTokens(user);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('role')
      .populate('teacherId')
      .populate('studentId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    const isAdmin = req.user.isSuperAdmin || 
                    req.user.role?.code === 'SUPER_ADMIN' || 
                    req.user.role?.code === 'ADMIN';
    
    let targetUser;
    
    if (userId && userId !== req.user.id && isAdmin) {
      targetUser = await User.findById(userId).select('+password');
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      targetUser = await User.findById(req.user.id).select('+password');
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (currentPassword) {
        const isMatch = await targetUser.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
      }
    }
    
    targetUser.password = newPassword;
    targetUser.mustChangePassword = false;
    await targetUser.save();
    
    const changedBy = userId && userId !== req.user.id ? ` by ${req.user.id}` : '';
    await logAudit(targetUser._id, 'PASSWORD_CHANGE', 'Auth', `Password changed${changedBy}`, 'User', targetUser._id, 'SUCCESS');
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    
    const isSaaSAdmin = req.user?.isSuperAdmin || req.user?.role?.code === 'SUPER_ADMIN';
    
    let query = {};
    
    if (isSaaSAdmin) {
      query = { isSuperAdmin: true };
    } else {
      query = { school: req.user?.school, isSuperAdmin: { $ne: true } };
    }
    
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const users = await User.find(query)
      .populate('role')
      .populate('teacherId')
      .populate('studentId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
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

exports.getSaasUsers = async (req, res) => {
  try {
    const users = await User.find({ isSuperAdmin: true })
      .select('-password')
      .populate('role');
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.password) {
      delete updates.password;
    }
    
    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .populate('role');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await logAudit(req.user.id, 'UPDATE', 'User', `Updated user ${user.username}`, 'User', user._id, 'SUCCESS');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await logAudit(req.user.id, 'DELETE', 'User', `Deleted user ${user.username}`, 'User', user._id, 'SUCCESS');
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot toggle your own status' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    await logAudit(req.user.id, user.isActive ? 'UPDATE' : 'UPDATE', 'User', 
      `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.username}`, 'User', user._id, 'SUCCESS');
    
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: 'If an account exists with this email, reset instructions have been sent'
      });
    }
    
    const resetToken = jwt.sign(
      { id: user._id, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    user.resetToken = resetToken;
    user.resetTokenExp = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    
    // In production, send email here. For now, just log
    console.log(`Password reset for ${email}: ${resetToken}`);
    
    await logAudit(user._id, 'PASSWORD_RESET_REQUEST', 'Auth', 'Password reset requested', 'User', user._id, 'SUCCESS');
    
    res.json({ 
      message: 'If an account exists with this email, reset instructions have been sent'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'reset') {
      return res.status(401).json({ message: 'Invalid reset token' });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.resetToken !== token || user.resetTokenExp < Date.now()) {
      return res.status(401).json({ message: 'Reset token expired or invalid' });
    }
    
    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be the same as current password' });
    }
    
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExp = undefined;
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();
    
    await logAudit(user._id, 'PASSWORD_RESET', 'Auth', 'Password reset completed', 'User', user._id, 'SUCCESS');
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid reset token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Reset token has expired' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('lastLogin');
    res.json({
      currentSession: {
        lastLogin: user.lastLogin,
        active: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPeople = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 50 } = req.query;
    
    const Teacher = require('../models/Teacher');
    const Student = require('../models/Student');
    const Parent = require('../models/Parent');
    
    const allPeople = [];
    const tenantQuery = req.tenantQuery || {};
    
    const teacherQuery = {
      ...tenantQuery,
      ...(search ? {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      } : {})
    };
    
    const studentQuery = {
      ...tenantQuery,
      ...(search ? {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } }
        ]
      } : {})
    };
    
    const parentQuery = {
      ...tenantQuery,
      ...(search ? {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      } : {})
    };
    
    if (!type || type === 'teacher') {
      const teachers = await Teacher.find(teacherQuery)
        .populate('userId', 'username email isActive role')
        .lean();
      
      for (const teacher of teachers) {
        allPeople.push({
          _id: teacher._id,
          uniqueId: teacher.teacherId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,
          type: 'Teacher',
          status: teacher.status,
          user: teacher.userId || null,
          userId: teacher.userId?._id || null,
          entityId: teacher._id,
          createdAt: teacher.createdAt
        });
      }
    }
    
    if (!type || type === 'student') {
      const students = await Student.find(studentQuery)
        .populate('userId', 'username email isActive role')
        .populate('class', 'name')
        .lean();
      
      for (const student of students) {
        allPeople.push({
          _id: student._id,
          uniqueId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          type: 'Student',
          status: student.status,
          class: student.class?.name,
          user: student.userId || null,
          userId: student.userId?._id || null,
          entityId: student._id,
          createdAt: student.createdAt
        });
      }
    }
    
    if (!type || type === 'parent') {
      const parents = await Parent.find(parentQuery)
        .populate('userId', 'username email isActive role')
        .populate('students', 'firstName lastName studentId')
        .lean();
      
      for (const parent of parents) {
        allPeople.push({
          _id: parent._id,
          uniqueId: parent.guardianId,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phone: parent.phone,
          type: 'Parent',
          relationship: parent.relationship,
          status: parent.status,
          children: parent.students,
          user: parent.userId || null,
          userId: parent.userId?._id || null,
          entityId: parent._id,
          createdAt: parent.createdAt
        });
      }
    }
    
    allPeople.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPeople = allPeople.slice(startIndex, endIndex);
    
    res.json({
      people: paginatedPeople,
      total: allPeople.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(allPeople.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
