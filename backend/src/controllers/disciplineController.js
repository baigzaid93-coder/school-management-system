const DisciplineIncident = require('../models/DisciplineIncident');
const DisciplineWarning = require('../models/DisciplineWarning');
const DisciplineAction = require('../models/DisciplineAction');
const ParentNotification = require('../models/ParentNotification');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');

const incidentTypes = [
  'Verbal Abuse', 'Physical Fight', 'Bullying', 'Harassment', 'Theft',
  'Vandalism', 'Cheating', 'Truancy', 'Late Arrival', 'Dress Code',
  'Mobile Phone', 'Disobedience', 'Substance Abuse', 'Weapon', 'Other'
];

const actionTypes = [
  'Verbal Warning', 'Written Warning', 'Detention', 'Suspension',
  'Expulsion', 'Community Service', 'Counseling', 'Parent Conference',
  'Behavior Contract', 'Loss of Privileges', 'In-School Suspension',
  'Out-School Suspension', 'Restriction from Activities', 'Academic Probation', 'Other'
];

const getIncidents = async (req, res) => {
  try {
    const { student, status, severity, fromDate, toDate, search } = req.query;
    const query = { ...req.tenantQuery };

    if (student) query.student = student;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (fromDate || toDate) {
      query.incidentDate = {};
      if (fromDate) query.incidentDate.$gte = new Date(fromDate);
      if (toDate) query.incidentDate.$lte = new Date(toDate);
    }
    if (search) {
      query.$or = [
        { incidentNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const incidents = await DisciplineIncident.find(query)
      .populate('student', 'firstName lastName studentId classGrade')
      .populate('reportedBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ incidentDate: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const incident = await DisciplineIncident.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    })
    .populate('student', 'firstName lastName studentId classGrade parentName parentPhone parentEmail')
    .populate('reportedBy', 'firstName lastName')
    .populate('assignedTo', 'firstName lastName')
    .populate('resolvedBy', 'firstName lastName');

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    const [warnings, actions, notifications] = await Promise.all([
      DisciplineWarning.find({ incident: incident._id }),
      DisciplineAction.find({ incident: incident._id }).populate('issuedBy', 'firstName lastName'),
      ParentNotification.find({ incident: incident._id }).populate('sentBy', 'firstName lastName')
    ]);

    res.json({
      ...incident.toObject(),
      relatedWarnings: warnings,
      relatedActions: actions,
      relatedNotifications: notifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createIncident = async (req, res) => {
  try {
    const schoolId = req.tenantQuery?.school || req.body.school || req.user?.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    const incident = new DisciplineIncident({
      ...req.body,
      school: schoolId,
      reportedBy: req.user.id,
      academicYear: req.body.academicYear || new Date().getFullYear().toString()
    });
    await incident.save();

    await incident.populate('student', 'firstName lastName studentId');
    await incident.populate('reportedBy', 'firstName lastName');

    await AuditLog.create({
      school: schoolId,
      user: req.user.id,
      action: 'CREATE',
      module: 'DISCIPLINE',
      entity: 'DisciplineIncident',
      entityId: incident._id,
      newValues: { incidentNumber: incident.incidentNumber, type: incident.incidentType }
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateIncident = async (req, res) => {
  try {
    const incident = await DisciplineIncident.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    )
    .populate('student', 'firstName lastName studentId')
    .populate('reportedBy', 'firstName lastName');

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'UPDATE',
      module: 'DISCIPLINE',
      entity: 'DisciplineIncident',
      entityId: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const resolveIncident = async (req, res) => {
  try {
    const { resolution } = req.body;
    const incident = await DisciplineIncident.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      {
        status: 'Resolved',
        resolution,
        resolvedDate: new Date(),
        resolvedBy: req.user.id
      },
      { new: true }
    ).populate('student', 'firstName lastName');

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'UPDATE',
      module: 'DISCIPLINE',
      entity: 'DisciplineIncident',
      entityId: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getWarnings = async (req, res) => {
  try {
    const { student, warningType, isActive, fromDate, toDate } = req.query;
    const query = { ...req.tenantQuery };

    if (student) query.student = student;
    if (warningType) query.warningType = warningType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (fromDate || toDate) {
      query.effectiveDate = {};
      if (fromDate) query.effectiveDate.$gte = new Date(fromDate);
      if (toDate) query.effectiveDate.$lte = new Date(toDate);
    }

    const warnings = await DisciplineWarning.find(query)
      .populate('student', 'firstName lastName studentId classGrade')
      .populate('issuedBy', 'firstName lastName')
      .populate('incident', 'incidentNumber incidentType severity')
      .sort({ effectiveDate: -1 });

    res.json(warnings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createWarning = async (req, res) => {
  try {
    const { student } = req.body;

    const previousWarnings = await DisciplineWarning.countDocuments({
      student,
      isActive: true,
      school: req.tenantQuery.school
    });

    let level = 1;
    if (previousWarnings >= 2) level = 3;
    else if (previousWarnings >= 1) level = 2;

    const warning = new DisciplineWarning({
      ...req.body,
      school: req.tenantQuery.school,
      issuedBy: req.user.id,
      level,
      previousWarnings,
      academicYear: req.body.academicYear || new Date().getFullYear().toString()
    });
    await warning.save();

    await warning.populate('student', 'firstName lastName studentId');
    await warning.populate('incident', 'incidentNumber incidentType');

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'CREATE',
      module: 'DISCIPLINE',
      entity: 'DisciplineWarning',
      entityId: warning._id,
      newValues: { level, warningType: warning.warningType }
    });

    res.status(201).json(warning);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const acknowledgeWarning = async (req, res) => {
  try {
    const warning = await DisciplineWarning.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      {
        acknowledgedByParent: true,
        acknowledgedDate: new Date()
      },
      { new: true }
    );

    if (!warning) return res.status(404).json({ message: 'Warning not found' });
    res.json(warning);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getActions = async (req, res) => {
  try {
    const { student, actionType, isActive, fromDate, toDate } = req.query;
    const query = { ...req.tenantQuery };

    if (student) query.student = student;
    if (actionType) query.actionType = actionType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (fromDate || toDate) {
      query.startDate = {};
      if (fromDate) query.startDate.$gte = new Date(fromDate);
      if (toDate) query.startDate.$lte = new Date(toDate);
    }

    const actions = await DisciplineAction.find(query)
      .populate('student', 'firstName lastName studentId classGrade')
      .populate('issuedBy', 'firstName lastName')
      .populate('incident', 'incidentNumber incidentType severity')
      .sort({ startDate: -1 });

    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAction = async (req, res) => {
  try {
    const action = new DisciplineAction({
      ...req.body,
      school: req.tenantQuery.school,
      issuedBy: req.user.id,
      academicYear: req.body.academicYear || new Date().getFullYear().toString()
    });
    await action.save();

    await action.populate('student', 'firstName lastName studentId');
    await action.populate('incident', 'incidentNumber incidentType');

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'CREATE',
      module: 'DISCIPLINE',
      entity: 'DisciplineAction',
      entityId: action._id,
      newValues: { actionType: action.actionType }
    });

    res.status(201).json(action);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const completeAction = async (req, res) => {
  try {
    const { completionNotes } = req.body;
    const action = await DisciplineAction.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      {
        isCompleted: true,
        completedDate: new Date(),
        completedBy: req.user.id,
        completionNotes
      },
      { new: true }
    ).populate('student', 'firstName lastName');

    if (!action) return res.status(404).json({ message: 'Action not found' });
    res.json(action);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { student, notificationType, channel, status, fromDate, toDate } = req.query;
    const query = { ...req.tenantQuery };

    if (student) query.student = student;
    if (notificationType) query.notificationType = notificationType;
    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.sentAt = {};
      if (fromDate) query.sentAt.$gte = new Date(fromDate);
      if (toDate) query.sentAt.$lte = new Date(toDate);
    }

    const notifications = await ParentNotification.find(query)
      .populate('student', 'firstName lastName studentId classGrade')
      .populate('sentBy', 'firstName lastName')
      .populate('incident', 'incidentNumber incidentType')
      .populate('warning', 'warningType level')
      .populate('action', 'actionType')
      .sort({ sentAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { studentId, student } = req.body;

    let studentData = null;
    if (student) {
      studentData = await Student.findById(student);
    } else if (studentId) {
      studentData = await Student.findById(studentId);
    }

    const notification = new ParentNotification({
      ...req.body,
      school: req.tenantQuery.school,
      sentBy: req.user.id,
      parentName: studentData ? studentData.parentName : req.body.parentName,
      parentPhone: studentData ? studentData.parentPhone : req.body.parentPhone,
      parentEmail: studentData ? studentData.parentEmail : req.body.parentEmail,
      academicYear: req.body.academicYear || new Date().getFullYear().toString()
    });
    await notification.save();

    await notification.populate('student', 'firstName lastName studentId');
    await notification.populate('sentBy', 'firstName lastName');

    if (notification.warning) {
      await DisciplineWarning.findByIdAndUpdate(notification.warning, {
        parentNotified: true,
        parentNotifiedDate: new Date(),
        parentNotifiedBy: req.user.id
      });
    }

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'CREATE',
      module: 'DISCIPLINE',
      entity: 'ParentNotification',
      entityId: notification._id,
      newValues: { channel: notification.channel, type: notification.notificationType }
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateNotificationResponse = async (req, res) => {
  try {
    const { responseType, responseNotes } = req.body;
    const notification = await ParentNotification.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      {
        responseReceived: true,
        responseDate: new Date(),
        responseType,
        responseNotes
      },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStudentDisciplineHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const school = req.tenantQuery.school;

    const [incidents, warnings, actions, notifications] = await Promise.all([
      DisciplineIncident.find({ student: studentId, school }),
      DisciplineWarning.find({ student: studentId, school }),
      DisciplineAction.find({ student: studentId, school }),
      ParentNotification.find({ student: studentId, school })
    ]);

    const summary = {
      totalIncidents: incidents.length,
      resolvedIncidents: incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length,
      activeWarnings: warnings.filter(w => w.isActive).length,
      totalWarnings: warnings.length,
      activeActions: actions.filter(a => a.isActive && !a.isCompleted).length,
      totalActions: actions.length,
      parentNotifications: notifications.length
    };

    res.json({
      summary,
      incidents: incidents.sort((a, b) => new Date(b.incidentDate) - new Date(a.incidentDate)),
      warnings: warnings.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)),
      actions: actions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
      notifications: notifications.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDisciplineStats = async (req, res) => {
  try {
    const school = req.tenantQuery.school;

    const [
      totalIncidents,
      openIncidents,
      totalWarnings,
      activeWarnings,
      totalActions,
      activeActions,
      recentIncidents
    ] = await Promise.all([
      DisciplineIncident.countDocuments({ school }),
      DisciplineIncident.countDocuments({ school, status: { $in: ['Reported', 'Under Investigation'] } }),
      DisciplineWarning.countDocuments({ school }),
      DisciplineWarning.countDocuments({ school, isActive: true }),
      DisciplineAction.countDocuments({ school }),
      DisciplineAction.countDocuments({ school, isActive: true, isCompleted: false }),
      DisciplineIncident.find({ school }).sort({ incidentDate: -1 }).limit(5)
        .populate('student', 'firstName lastName studentId')
    ]);

    const incidentsByType = await DisciplineIncident.aggregate([
      { $match: { school: school } },
      { $group: { _id: '$incidentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const incidentsBySeverity = await DisciplineIncident.aggregate([
      { $match: { school: school } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    res.json({
      totalIncidents,
      openIncidents,
      totalWarnings,
      activeWarnings,
      totalActions,
      activeActions,
      recentIncidents,
      incidentsByType,
      incidentsBySeverity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  resolveIncident,
  getWarnings,
  createWarning,
  acknowledgeWarning,
  getActions,
  createAction,
  completeAction,
  getNotifications,
  createNotification,
  updateNotificationResponse,
  getStudentDisciplineHistory,
  getDisciplineStats,
  incidentTypes,
  actionTypes
};
