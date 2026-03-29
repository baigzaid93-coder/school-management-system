const FeeHead = require('../models/FeeHead');

exports.getAll = async (req, res) => {
  try {
    const heads = await FeeHead.find()
      .populate('applicableClasses', 'name code')
      .populate('academicYear', 'name')
      .sort({ name: 1 });
    res.json(heads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const feeHead = new FeeHead(req.body);
    await feeHead.save();
    res.status(201).json(feeHead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const feeHead = await FeeHead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!feeHead) return res.status(404).json({ message: 'Fee head not found' });
    res.json(feeHead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const feeHead = await FeeHead.findByIdAndDelete(req.params.id);
    if (!feeHead) return res.status(404).json({ message: 'Fee head not found' });
    res.json({ message: 'Fee head deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
