const mongoose = require('mongoose');

const classGradeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  level: { type: Number, required: true },
  description: String,
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  capacity: { type: Number, default: 40 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

classGradeSchema.index({ school: 1 });
classGradeSchema.index({ code: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('ClassGrade', classGradeSchema);
