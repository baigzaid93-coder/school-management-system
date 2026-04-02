const AcademicYear = require('../models/AcademicYear');

exports.getAll = async (req, res) => {
  try {
    const years = await AcademicYear.find().sort({ startDate: -1 });
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrent = async (req, res) => {
  try {
    const year = await AcademicYear.findOne({ isCurrent: true });
    res.json(year);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.body.isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }
    const year = new AcademicYear(req.body);
    await year.save();
    res.status(201).json(year);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.isCurrent) {
      await AcademicYear.updateMany({ ...req.tenantQuery }, { isCurrent: false });
    }
    const year = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!year) return res.status(404).json({ message: 'Academic year not found' });
    res.json(year);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const year = await AcademicYear.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!year) return res.status(404).json({ message: 'Academic year not found' });
    res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
