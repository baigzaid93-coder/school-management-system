const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  staffId: { type: String },
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isSuperAdmin: { type: Boolean, default: false },
  isSchoolAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  mustChangePassword: { type: Boolean, default: false },
  profile: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: String,
    avatar: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  permissions: [String],
  preferences: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

userSchema.index({ school: 1 });
userSchema.index({ staffId: 1, school: 1 });
userSchema.index({ role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
