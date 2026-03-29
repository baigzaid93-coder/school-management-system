const mongoose = require('mongoose');

const PERMISSIONS = {
  ALL: '*',
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',
  
  STUDENT_VIEW: 'student:view',
  STUDENT_CREATE: 'student:create',
  STUDENT_EDIT: 'student:edit',
  STUDENT_DELETE: 'student:delete',
  STUDENT_IMPORT: 'student:import',
  STUDENT_EXPORT: 'student:export',
  
  TEACHER_VIEW: 'teacher:view',
  TEACHER_CREATE: 'teacher:create',
  TEACHER_EDIT: 'teacher:edit',
  TEACHER_DELETE: 'teacher:delete',
  
  COURSE_VIEW: 'course:view',
  COURSE_CREATE: 'course:create',
  COURSE_EDIT: 'course:edit',
  COURSE_DELETE: 'course:delete',
  
  GRADE_VIEW: 'grade:view',
  GRADE_CREATE: 'grade:create',
  GRADE_EDIT: 'grade:edit',
  GRADE_DELETE: 'grade:delete',
  
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_EDIT: 'attendance:edit',
  ATTENDANCE_DELETE: 'attendance:delete',
  
  FEE_VIEW: 'fee:view',
  FEE_CREATE: 'fee:create',
  FEE_EDIT: 'fee:edit',
  FEE_DELETE: 'fee:delete',
  FEE_PAYMENT: 'fee:payment',
  
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  REPORT_VIEW: 'report:view',
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',
  
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  BRANCH_VIEW: 'branch:view',
  BRANCH_CREATE: 'branch:create',
  BRANCH_EDIT: 'branch:edit',
  BRANCH_DELETE: 'branch:delete',
  
  ADMISSION_VIEW: 'admission:view',
  ADMISSION_READ: 'admission:read',
  ADMISSION_WRITE: 'admission:write',
  ADMISSION_VERIFY: 'admission:verify',
  ADMISSION_APPROVE: 'admission:approve',
  ADMISSION_DELETE: 'admission:delete',
};

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: String,
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  parentRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  level: { type: Number, default: 1 },
  canApprove: Boolean,
  canOverride: Boolean,
  maxBranches: { type: Number, default: 1 }
}, { timestamps: true });

roleSchema.statics.PERMISSIONS = PERMISSIONS;

module.exports = mongoose.model('Role', roleSchema);
module.exports.PERMISSIONS = PERMISSIONS;
