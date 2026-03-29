const mongoose = require('mongoose');

const letterHeadSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
  logo: { type: String, default: '' },
  headerText: { type: String, default: '' },
  tagline: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('LetterHead', letterHeadSchema);
