const Timetable = require('../models/Timetable');

exports.getAll = async (req, res) => {
  try {
    const { academicYear, classGrade, section, status } = req.query;
    const query = { ...req.tenantQuery };
    if (academicYear) query.academicYear = academicYear;
    if (classGrade) query.classGrade = classGrade;
    if (section) query.section = section;
    if (status) query.status = status;
    
    console.log('getAll query:', query);
    
    const timetables = await Timetable.find(query)
      .populate('classGrade', 'name code')
      .populate('section', 'name')
      .populate('periods.subject', 'name code')
      .populate('periods.teacher', 'firstName lastName');
    console.log('Found timetables:', timetables.length);
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByClass = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const query = { 
      classGrade: req.params.classId,
      status: 'Active',
      ...tenantQuery
    };
    
    const timetables = await Timetable.find(query)
      .populate('periods.subject', 'name code')
      .populate('periods.teacher', 'firstName lastName');
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school || req.body.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const timetableData = { ...req.body, school: schoolId };
    console.log('Creating timetable:', JSON.stringify(timetableData, null, 2));
    
    const timetable = new Timetable(timetableData);
    await timetable.save();
    console.log('Timetable created:', timetable._id);
    res.status(201).json(timetable);
  } catch (error) {
    console.error('Timetable create error:', error);
    res.status(400).json({ message: error.message, details: error.errors });
  }
};

exports.update = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school;
    
    const timetable = await Timetable.findOneAndUpdate(
      { _id: req.params.id, ...(schoolId && { school: schoolId }) },
      req.body,
      { new: true }
    );
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
    res.json(timetable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school;
    
    const timetable = await Timetable.findOneAndDelete(
      { _id: req.params.id, ...(schoolId && { school: schoolId }) }
    );
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.activate = async (req, res) => {
  try {
    await Timetable.updateMany({ classGrade: req.params.classId }, { status: 'Archived' });
    const timetable = await Timetable.findById(req.params.id);
    timetable.status = 'Active';
    await timetable.save();
    res.json({ message: 'Timetable activated', timetable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
