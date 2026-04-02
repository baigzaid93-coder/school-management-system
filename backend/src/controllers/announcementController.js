const Announcement = require('../models/Announcement');

exports.getAll = async (req, res) => {
  try {
    const { type, targetAudience, isActive } = req.query;
    const query = { ...req.tenantQuery };
    if (type) query.type = type;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const announcements = await Announcement.find(query)
      .populate('publishedBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('publishedBy', 'profile.firstName profile.lastName');
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    
    announcement.viewCount += 1;
    await announcement.save();
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
