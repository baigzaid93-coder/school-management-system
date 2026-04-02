const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Student', 'Teacher', 'Staff', 'School', 'Academic', 'Certificate', 'ID Card', 'Other'],
    required: true
  },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  category: String,
  fileName: String,
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  expiryDate: Date,
  notes: String,
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

documentSchema.index({ student: 1, type: 1 });
documentSchema.index({ teacher: 1, type: 1 });

module.exports = mongoose.model('Document', documentSchema);
