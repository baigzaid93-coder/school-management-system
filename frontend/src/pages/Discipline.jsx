import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  AlertTriangle,
  Plus,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Search,
  Filter,
  Bell,
  AlertCircle,
  Shield,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MessageSquare,
  User
} from 'lucide-react';

const severityColors = {
  Minor: 'bg-blue-100 text-blue-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  Serious: 'bg-orange-100 text-orange-800',
  Severe: 'bg-red-100 text-red-800'
};

const statusColors = {
  Reported: 'bg-gray-100 text-gray-800',
  'Under Investigation': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Escalated: 'bg-red-100 text-red-800',
  Closed: 'bg-blue-100 text-blue-800'
};

const warningLevels = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-red-100 text-red-800'
};

export default function Discipline() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('incidents');
  const [incidents, setIncidents] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [actions, setActions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('incident');
  const [selectedItem, setSelectedItem] = useState(null);
  const [incidentFormData, setIncidentFormData] = useState({
    student: '',
    incidentType: 'Disobedience',
    severity: 'Minor',
    incidentDate: new Date().toISOString().split('T')[0],
    description: '',
    location: '',
    witnesses: []
  });
  const [warningFormData, setWarningFormData] = useState({
    student: '',
    incident: '',
    warningType: 'Written',
    reason: ''
  });
  const [actionFormData, setActionFormData] = useState({
    student: '',
    incident: '',
    actionType: 'Detention',
    severity: 'Medium',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [notificationFormData, setNotificationFormData] = useState({
    student: '',
    notificationType: 'General',
    channel: 'Letter',
    subject: '',
    message: ''
  });
  const [filter, setFilter] = useState({ status: '', severity: '', student: '' });
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (showModal && modalType === 'incident') {
      setIncidentFormData(selectedItem ? {
        student: selectedItem.student?._id || selectedItem.student || '',
        incidentType: selectedItem.incidentType || 'Disobedience',
        severity: selectedItem.severity || 'Minor',
        incidentDate: selectedItem.incidentDate ? new Date(selectedItem.incidentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: selectedItem.description || '',
        location: selectedItem.location || '',
        witnesses: selectedItem.witnesses || []
      } : {
        student: '',
        incidentType: 'Disobedience',
        severity: 'Minor',
        incidentDate: new Date().toISOString().split('T')[0],
        description: '',
        location: '',
        witnesses: []
      });
    } else if (showModal && modalType === 'warning') {
      setWarningFormData({
        student: selectedItem?.student?._id || selectedItem?.student || '',
        incident: '',
        warningType: 'Written',
        reason: ''
      });
    } else if (showModal && modalType === 'action') {
      setActionFormData({
        student: selectedItem?.student?._id || selectedItem?.student || '',
        incident: '',
        actionType: 'Detention',
        severity: 'Medium',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
    } else if (showModal && modalType === 'notification') {
      setNotificationFormData({
        student: selectedItem?.student?._id || selectedItem?.student || '',
        notificationType: 'General',
        channel: 'Letter',
        subject: '',
        message: ''
      });
    }
  }, [showModal, modalType, selectedItem]);

  useEffect(() => {
    loadData();
    loadStudents();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incidentsRes, warningsRes, actionsRes, notificationsRes, statsRes] = await Promise.all([
        api.get('/discipline/incidents'),
        api.get('/discipline/warnings'),
        api.get('/discipline/actions'),
        api.get('/discipline/notifications'),
        api.get('/discipline/stats')
      ]);

      setIncidents(Array.isArray(incidentsRes.data) ? incidentsRes.data : []);
      setWarnings(Array.isArray(warningsRes.data) ? warningsRes.data : []);
      setActions(Array.isArray(actionsRes.data) ? actionsRes.data : []);
      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load discipline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await api.get('/students?all=true');
      setStudents(Array.isArray(response.data.students) ? response.data.students : []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleSaveIncident = async () => {
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      
      if (!schoolId) {
        alert('Please select a school first');
        return;
      }
      
      if (!incidentFormData.student) {
        alert('Please select a student');
        return;
      }
      
      if (!incidentFormData.description) {
        alert('Please enter a description');
        return;
      }
      
      const url = selectedItem?._id
        ? `/api/discipline/incidents/${selectedItem._id}`
        : '/api/discipline/incidents';
      const method = selectedItem?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-school-id': schoolId
        },
        body: JSON.stringify(incidentFormData)
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedItem(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save incident');
      }
    } catch (err) {
      console.error('Failed to save incident:', err);
      alert('Failed to save incident. Please try again.');
    }
  };

  const handleSaveWarning = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      
      if (!schoolId) {
        alert('Please select a school first');
        return;
      }
      
      if (!warningFormData.student) {
        alert('Please select a student');
        return;
      }
      
      const response = await api.post('/discipline/warnings', warningFormData);

      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        loadData();
      } else {
        alert(response.data?.message || 'Failed to save warning');
      }
    } catch (err) {
      console.error('Failed to save warning:', err);
      alert('Failed to save warning. Please try again.');
    }
  };

  const handleSaveAction = async () => {
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      
      if (!schoolId) {
        alert('Please select a school first');
        return;
      }
      
      if (!actionFormData.student) {
        alert('Please select a student');
        return;
      }
      
      const response = await api.post('/discipline/actions', actionFormData);

      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        loadData();
      } else {
        alert(response.data?.message || 'Failed to save action');
      }
    } catch (err) {
      console.error('Failed to save action:', err);
      alert('Failed to save action. Please try again.');
    }
  };

  const handleSaveNotification = async () => {
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      
      if (!schoolId) {
        alert('Please select a school first');
        return;
      }
      
      if (!notificationFormData.student) {
        alert('Please select a student');
        return;
      }
      
      if (!notificationFormData.subject || !notificationFormData.message) {
        alert('Please fill in subject and message');
        return;
      }
      
      const response = await api.post('/discipline/notifications', notificationFormData);

      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        loadData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleResolveIncident = async (id, resolution) => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const response = await fetch(`/api/discipline/incidents/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-school-id': schoolId
        },
        body: JSON.stringify({ resolution })
      });

      if (response.ok) loadData();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const filteredIncidents = incidents.filter(i => {
    if (filter.status && i.status !== filter.status) return false;
    if (filter.severity && i.severity !== filter.severity) return false;
    if (search && !i.incidentNumber?.toLowerCase().includes(search.toLowerCase()) &&
        !i.student?.firstName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const renderIncidentForm = () => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedItem?._id ? 'Edit Incident' : 'Report Incident'}
            </h3>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <XCircle size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select
                value={incidentFormData.student}
                onChange={(e) => setIncidentFormData({ ...incidentFormData, student: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type *</label>
                <select
                  value={incidentFormData.incidentType}
                  onChange={(e) => setIncidentFormData({ ...incidentFormData, incidentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Verbal Abuse">Verbal Abuse</option>
                  <option value="Physical Fight">Physical Fight</option>
                  <option value="Bullying">Bullying</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Theft">Theft</option>
                  <option value="Vandalism">Vandalism</option>
                  <option value="Cheating">Cheating</option>
                  <option value="Truancy">Truancy</option>
                  <option value="Late Arrival">Late Arrival</option>
                  <option value="Dress Code">Dress Code</option>
                  <option value="Mobile Phone">Mobile Phone</option>
                  <option value="Disobedience">Disobedience</option>
                  <option value="Substance Abuse">Substance Abuse</option>
                  <option value="Weapon">Weapon</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                <select
                  value={incidentFormData.severity}
                  onChange={(e) => setIncidentFormData({ ...incidentFormData, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Serious">Serious</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={incidentFormData.incidentDate}
                  onChange={(e) => setIncidentFormData({ ...incidentFormData, incidentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={incidentFormData.location || ''}
                  onChange={(e) => setIncidentFormData({ ...incidentFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Classroom 101"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={incidentFormData.description}
                onChange={(e) => setIncidentFormData({ ...incidentFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder="Describe the incident in detail..."
                required
              />
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSaveIncident}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {selectedItem?._id ? 'Update' : 'Report'} Incident
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWarningForm = () => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Issue Warning</h3>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <XCircle size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select
                value={warningFormData.student}
                onChange={(e) => setWarningFormData({ ...warningFormData, student: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warning Type</label>
                <select
                  value={warningFormData.warningType}
                  onChange={(e) => setWarningFormData({ ...warningFormData, warningType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Verbal">Verbal</option>
                  <option value="Written">Written</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Incident</label>
                <select
                  value={warningFormData.incident || ''}
                  onChange={(e) => setWarningFormData({ ...warningFormData, incident: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">None</option>
                  {incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').map(i => (
                    <option key={i._id} value={i._id}>
                      {i.incidentNumber} - {i.incidentType}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                value={warningFormData.reason}
                onChange={(e) => setWarningFormData({ ...warningFormData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Reason for warning..."
                required
              />
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSaveWarning}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Issue Warning
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderActionForm = () => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Take Disciplinary Action</h3>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <XCircle size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select
                value={actionFormData.student}
                onChange={(e) => setActionFormData({ ...actionFormData, student: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type *</label>
                <select
                  value={actionFormData.actionType}
                  onChange={(e) => setActionFormData({ ...actionFormData, actionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Verbal Warning">Verbal Warning</option>
                  <option value="Written Warning">Written Warning</option>
                  <option value="Detention">Detention</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Parent Conference">Parent Conference</option>
                  <option value="Behavior Contract">Behavior Contract</option>
                  <option value="Loss of Privileges">Loss of Privileges</option>
                  <option value="In-School Suspension">In-School Suspension</option>
                  <option value="Out-School Suspension">Out-School Suspension</option>
                  <option value="Counseling">Counseling</option>
                  <option value="Community Service">Community Service</option>
                  <option value="Academic Probation">Academic Probation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={actionFormData.severity}
                  onChange={(e) => setActionFormData({ ...actionFormData, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={actionFormData.startDate}
                  onChange={(e) => setActionFormData({ ...actionFormData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={actionFormData.endDate || ''}
                  onChange={(e) => setActionFormData({ ...actionFormData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={actionFormData.description}
                onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                required
              />
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSaveAction}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Take Action
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationForm = () => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notify Parent</h3>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <XCircle size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select
                value={notificationFormData.student}
                onChange={(e) => setNotificationFormData({ ...notificationFormData, student: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
                <select
                  value={notificationFormData.notificationType}
                  onChange={(e) => setNotificationFormData({ ...notificationFormData, notificationType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Discipline Incident">Discipline Incident</option>
                  <option value="Warning Issued">Warning Issued</option>
                  <option value="Action Taken">Action Taken</option>
                  <option value="Meeting Request">Meeting Request</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={notificationFormData.channel}
                  onChange={(e) => setNotificationFormData({ ...notificationFormData, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Letter">Letter</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="SMS">SMS</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Portal">Portal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={notificationFormData.subject}
                onChange={(e) => setNotificationFormData({ ...notificationFormData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={notificationFormData.message}
                onChange={(e) => setNotificationFormData({ ...notificationFormData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={5}
                required
              />
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSaveNotification}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Notification
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discipline Management</h1>
          <p className="text-gray-500">Track incidents, warnings, and parent communications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setModalType('incident'); setSelectedItem(null); setShowModal(true); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            Report Incident
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalIncidents}</p>
                <p className="text-xs text-gray-500">Total Incidents</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.openIncidents}</p>
                <p className="text-xs text-gray-500">Open Cases</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeWarnings}</p>
                <p className="text-xs text-gray-500">Active Warnings</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-xs text-gray-500">Notifications</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 border-b md:border-b-0 md:gap-4">
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'incidents' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Incidents ({incidents.length})
              </button>
              <button
                onClick={() => setActiveTab('warnings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'warnings' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Warnings ({warnings.length})
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'actions' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Actions ({actions.length})
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'notifications' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Notifications ({notifications.length})
              </button>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              {activeTab === 'incidents' && (
                <>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="Reported">Reported</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                  <select
                    value={filter.severity}
                    onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Severity</option>
                    <option value="Minor">Minor</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Serious">Serious</option>
                    <option value="Severe">Severe</option>
                  </select>
                </>
              )}
              {activeTab === 'warnings' && (
                <button
                  onClick={() => { setModalType('warning'); setShowModal(true); }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Issue Warning
                </button>
              )}
              {activeTab === 'actions' && (
                <button
                  onClick={() => { setModalType('action'); setShowModal(true); }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Take Action
                </button>
              )}
              {activeTab === 'notifications' && (
                <button
                  onClick={() => { setModalType('notification'); setShowModal(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Notify Parent
                </button>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'incidents' && (
          <div className="divide-y divide-gray-100">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center">
                <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No incidents found</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <div key={incident._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{incident.incidentNumber}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[incident.status]}`}>
                            {incident.status}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${severityColors[incident.severity]}`}>
                            {incident.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {incident.incidentType} - Reported by {incident.reportedBy?.firstName} {incident.reportedBy?.lastName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Student: {incident.student?.firstName} {incident.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(incident.incidentDate).toLocaleDateString()} at {incident.location || 'Unknown location'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal('incident', incident)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {incident.status !== 'Resolved' && incident.status !== 'Closed' && (
                        <button
                          onClick={() => {
                            const resolution = prompt('Enter resolution notes:');
                            if (resolution) handleResolveIncident(incident._id, resolution);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Resolve"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="divide-y divide-gray-100">
            {warnings.length === 0 ? (
              <div className="p-8 text-center">
                <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No warnings issued</p>
              </div>
            ) : (
              warnings.map((warning) => (
                <div key={warning._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Shield size={20} className="text-yellow-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {warning.student?.firstName} {warning.student?.lastName}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${warningLevels[warning.level]}`}>
                            Level {warning.level} - {warning.warningType}
                          </span>
                          {warning.isActive && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{warning.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Issued: {new Date(warning.effectiveDate).toLocaleDateString()} by {warning.issuedBy?.firstName} {warning.issuedBy?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {warning.parentNotified ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Bell size={14} /> Parent Notified
                        </span>
                      ) : (
                        <button
                          onClick={() => { setModalType('notification'); setShowModal(true); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Notify Parent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="divide-y divide-gray-100">
            {actions.length === 0 ? (
              <div className="p-8 text-center">
                <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No disciplinary actions recorded</p>
              </div>
            ) : (
              actions.map((action) => (
                <div key={action._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        action.isCompleted ? 'bg-gray-100' : 'bg-red-100'
                      }`}>
                        <Shield size={20} className={action.isCompleted ? 'text-gray-400' : 'text-red-600'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{action.actionType}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            action.isCompleted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {action.isCompleted ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {action.student?.firstName} {action.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(action.startDate).toLocaleDateString()}
                          {action.endDate && ` - ${new Date(action.endDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    {!action.isCompleted && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/discipline/actions/${action._id}/complete`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                              'x-school-id': localStorage.getItem('currentSchoolId')
                            },
                            body: JSON.stringify({ completionNotes: 'Action completed' })
                          });
                          loadData();
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No parent notifications sent</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bell size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{notification.subject}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            notification.status === 'Delivered' || notification.status === 'Read' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          To: {notification.parentName || notification.student?.firstName + "'s Parent"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.channel} - Sent {new Date(notification.sentAt).toLocaleDateString()} by {notification.sentBy?.firstName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.responseReceived ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} /> {notification.responseType}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No response</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showModal && modalType === 'incident' && renderIncidentForm()}
      {showModal && modalType === 'warning' && renderWarningForm()}
      {showModal && modalType === 'action' && renderActionForm()}
      {showModal && modalType === 'notification' && renderNotificationForm()}
    </div>
  );
}
