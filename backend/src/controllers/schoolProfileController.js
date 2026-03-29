const School = require('../models/School');

exports.getProfile = async (req, res) => {
  try {
    const schoolId = req.tenantQuery?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID not found' });
    }
    
    let school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const schoolId = req.tenantQuery?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID not found' });
    }
    
    const school = await School.findByIdAndUpdate(schoolId, req.body, { new: true });
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
