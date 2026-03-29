const LetterHead = require('../models/LetterHead');

exports.getLetterHead = async (req, res) => {
  try {
    const letterHead = await LetterHead.findOne(req.tenantQuery);
    res.json(letterHead || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.saveLetterHead = async (req, res) => {
  try {
    const { logo, headerText, tagline, address, phone, email, website, isActive } = req.body;
    const schoolId = req.tenantQuery?.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const letterHead = await LetterHead.findOneAndUpdate(
      { school: schoolId },
      { 
        school: schoolId,
        logo,
        headerText,
        tagline,
        address,
        phone,
        email,
        website,
        isActive 
      },
      { new: true, upsert: true }
    );
    
    res.json(letterHead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteLetterHead = async (req, res) => {
  try {
    await LetterHead.findOneAndDelete(req.tenantQuery);
    res.json({ message: 'Letter head deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
