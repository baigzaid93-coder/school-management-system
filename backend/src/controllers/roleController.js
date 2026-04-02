const Role = require('../models/Role');
const { PERMISSIONS } = require('../models/Role');

const defaultRoles = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Full system access with all permissions',
    isSystem: true,
    level: 1,
    permissions: ['*'],
    canApprove: true,
    canOverride: true,
    maxBranches: 999
  },
  {
    name: 'School Admin',
    code: 'SCHOOL_ADMIN',
    description: 'Full access to manage school operations',
    isSystem: true,
    level: 2,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ANALYTICS,
      PERMISSIONS.STUDENT_VIEW, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_EDIT, PERMISSIONS.STUDENT_DELETE,
      PERMISSIONS.TEACHER_VIEW, PERMISSIONS.TEACHER_CREATE, PERMISSIONS.TEACHER_EDIT, PERMISSIONS.TEACHER_DELETE,
      PERMISSIONS.COURSE_VIEW, PERMISSIONS.COURSE_CREATE, PERMISSIONS.COURSE_EDIT, PERMISSIONS.COURSE_DELETE,
      PERMISSIONS.GRADE_VIEW, PERMISSIONS.GRADE_CREATE, PERMISSIONS.GRADE_EDIT, PERMISSIONS.GRADE_DELETE,
      PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_EDIT, PERMISSIONS.ATTENDANCE_DELETE,
      PERMISSIONS.FEE_VIEW, PERMISSIONS.FEE_CREATE, PERMISSIONS.FEE_EDIT, PERMISSIONS.FEE_DELETE, PERMISSIONS.FEE_PAYMENT,
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_EDIT,
      PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE, PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_EDIT, PERMISSIONS.USER_DELETE,
      PERMISSIONS.BRANCH_VIEW, PERMISSIONS.BRANCH_CREATE, PERMISSIONS.BRANCH_EDIT, PERMISSIONS.BRANCH_DELETE,
      PERMISSIONS.ADMISSION_VIEW, PERMISSIONS.ADMISSION_READ, PERMISSIONS.ADMISSION_WRITE, PERMISSIONS.ADMISSION_VERIFY, PERMISSIONS.ADMISSION_APPROVE, PERMISSIONS.ADMISSION_DELETE,
    ],
    canApprove: true,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'Principal',
    code: 'PRINCIPAL',
    description: 'School principal with administrative access',
    isSystem: true,
    level: 3,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.DASHBOARD_ANALYTICS,
      PERMISSIONS.STUDENT_VIEW, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_EDIT,
      PERMISSIONS.TEACHER_VIEW, PERMISSIONS.TEACHER_CREATE, PERMISSIONS.TEACHER_EDIT,
      PERMISSIONS.COURSE_VIEW, PERMISSIONS.COURSE_CREATE, PERMISSIONS.COURSE_EDIT,
      PERMISSIONS.GRADE_VIEW, PERMISSIONS.GRADE_EDIT,
      PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK,
      PERMISSIONS.FEE_VIEW, PERMISSIONS.FEE_EDIT,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE,
      PERMISSIONS.ADMISSION_VIEW, PERMISSIONS.ADMISSION_READ, PERMISSIONS.ADMISSION_WRITE, PERMISSIONS.ADMISSION_VERIFY, PERMISSIONS.ADMISSION_APPROVE,
    ],
    canApprove: true,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'Teacher',
    code: 'TEACHER',
    description: 'Teaching staff with limited administrative access',
    isSystem: true,
    level: 4,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.COURSE_VIEW,
      PERMISSIONS.GRADE_VIEW, PERMISSIONS.GRADE_CREATE, PERMISSIONS.GRADE_EDIT,
      PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_EDIT,
      PERMISSIONS.REPORT_VIEW,
    ],
    canApprove: false,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'Accountant',
    code: 'ACCOUNTANT',
    description: 'Financial management access',
    isSystem: true,
    level: 4,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.FEE_VIEW, PERMISSIONS.FEE_CREATE, PERMISSIONS.FEE_EDIT, PERMISSIONS.FEE_DELETE, PERMISSIONS.FEE_PAYMENT,
      PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE, PERMISSIONS.REPORT_EXPORT,
    ],
    canApprove: false,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'HR/Admin Officer',
    code: 'HR_ADMIN',
    description: 'Human resources and administrative access',
    isSystem: true,
    level: 4,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STUDENT_VIEW, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_EDIT,
      PERMISSIONS.TEACHER_VIEW, PERMISSIONS.TEACHER_CREATE, PERMISSIONS.TEACHER_EDIT, PERMISSIONS.TEACHER_DELETE,
      PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_EDIT,
      PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE,
      PERMISSIONS.ADMISSION_VIEW, PERMISSIONS.ADMISSION_READ, PERMISSIONS.ADMISSION_WRITE, PERMISSIONS.ADMISSION_VERIFY, PERMISSIONS.ADMISSION_APPROVE, PERMISSIONS.ADMISSION_DELETE,
    ],
    canApprove: true,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'Student',
    code: 'STUDENT',
    description: 'Student access to view own records',
    isSystem: true,
    level: 5,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    canApprove: false,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'Parent',
    code: 'PARENT',
    description: 'Parent access to view child records',
    isSystem: true,
    level: 5,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    canApprove: false,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'Librarian',
    code: 'LIBRARIAN',
    description: 'Library management access',
    isSystem: true,
    level: 4,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STUDENT_VIEW,
    ],
    canApprove: false,
    canOverride: false,
    maxBranches: 1
  },
  {
    name: 'Transport Manager',
    code: 'TRANSPORT_MANAGER',
    description: 'Transportation management access',
    isSystem: true,
    level: 4,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.ATTENDANCE_VIEW,
    ],
    canApprove: false,
    canOverride: false,
    maxBranches: 1
  }
];

exports.seedRoles = async () => {
  try {
    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ code: roleData.code });
      if (!existing) {
        await Role.create(roleData);
        console.log(`Created role: ${roleData.name}`);
      } else {
        Object.assign(existing, roleData);
        if (roleData.code === 'SUPER_ADMIN') {
          existing.permissions = Object.values(PERMISSIONS);
          existing.canApprove = true;
          existing.canOverride = true;
          existing.maxBranches = 999;
        }
        await existing.save();
        if (roleData.code === 'SUPER_ADMIN') {
          console.log('Updated Super Admin with all permissions');
        }
      }
    }
    console.log('Roles seeded successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

exports.getAll = async (req, res) => {
  try {
    const roles = await Role.find().sort({ level: 1, name: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const roleData = { ...req.body, school: req.tenantQuery?.school || req.user?.school };
    const role = new Role(roleData);
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.isSystem) {
      return res.status(400).json({ message: 'Cannot modify system role' });
    }
    Object.assign(role, req.body);
    await role.save();
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.isSystem) {
      return res.status(400).json({ message: 'Cannot delete system role' });
    }
    await role.deleteOne();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    res.json({ permissions: Object.entries(PERMISSIONS).map(([key, value]) => ({ key, value })) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
