const Term = require('../models/Term');

exports.getAll = async (req, res) => {
  try {
    const terms = await Term.find()
      .populate('academicYear', 'name')
      .sort({ academicYear: -1, termNumber: 1 });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByYear = async (req, res) => {
  try {
    const terms = await Term.find({ academicYear: req.params.yearId }).sort({ termNumber: 1 });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrent = async (req, res) => {
  try {
    const term = await Term.findOne({ isCurrent: true }).populate('academicYear', 'name');
    res.json(term);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.body.isCurrent) {
      await Term.updateMany({}, { isCurrent: false });
    }
    const term = new Term(req.body);
    await term.save();
    res.status(201).json(term);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.isCurrent) {
      await Term.updateMany({ ...req.tenantQuery }, { isCurrent: false });
    }
    const term = await Term.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!term) return res.status(404).json({ message: 'Term not found' });
    res.json(term);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const term = await Term.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!term) return res.status(404).json({ message: 'Term not found' });
    res.json({ message: 'Term deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
