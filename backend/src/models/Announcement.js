const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['General', 'Academic', 'Event', 'Holiday', 'Fee', 'Emergency', 'Achievement'],
    default: 'General'
  },
  priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
  targetAudience: { 
    type: String, 
    enum: ['All', 'Students', 'Parents', 'Teachers', 'Staff', 'Specific Class'],
    default: 'All'
  },
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  validFrom: { type: Date, default: Date.now },
  validTo: Date,
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publishedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  views: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, viewedAt: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
