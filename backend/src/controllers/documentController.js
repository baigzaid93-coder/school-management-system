const Document = require('../models/Document');

exports.getAll = async (req, res) => {
  try {
    const { type, student, teacher, status } = req.query;
    const query = { ...req.tenantQuery };
    if (type) query.type = type;
    if (student) query.student = student;
    if (teacher) query.teacher = teacher;
    if (status) query.status = status;
    
    const documents = await Document.find(query)
      .populate('uploadedBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upload = async (req, res) => {
  try {
    const document = new Document(req.body);
    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifiedBy } = req.body;
    
    const document = await Document.findById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    document.status = status;
    document.verifiedBy = verifiedBy;
    document.verifiedAt = new Date();
    await document.save();
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
