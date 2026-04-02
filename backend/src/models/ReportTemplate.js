const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  description: { type: String },
  entityType: { 
    type: String, 
    enum: ['student', 'teacher', 'staff', 'fee', 'expense', 'attendance', 'marks', 'all'],
    required: true 
  },
  fields: [{
    key: String,
    label: String,
    type: { type: String, enum: ['string', 'number', 'date', 'boolean', 'currency', 'percentage'] },
    format: String
  }],
  filters: [{
    field: String,
    label: String,
    type: { type: String, enum: ['text', 'select', 'date', 'dateRange', 'number', 'boolean'] },
    options: [String],
    required: { type: Boolean, default: false },
    defaultValue: mongoose.Schema.Types.Mixed
  }],
  groupBy: { type: String },
  orderBy: { 
    field: String, 
    direction: { type: String, enum: ['asc', 'desc'], default: 'asc' } 
  },
  chartType: { type: String, enum: ['none', 'bar', 'line', 'pie', 'table'], default: 'table' },
  aggregations: [{
    field: String,
    function: { type: String, enum: ['sum', 'avg', 'min', 'max', 'count'] },
    label: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
