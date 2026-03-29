import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Building2, Users, GraduationCap, CreditCard, CheckCircle, XCircle, AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';

const AVAILABLE_MODULES = [
  { key: 'student', label: 'Student Management', description: 'Admissions, profiles, attendance' },
  { key: 'teacher', label: 'Teacher Management', description: 'Staff management, assignments' },
  { key: 'attendance', label: 'Attendance', description: 'Daily attendance tracking' },
  { key: 'exams', label: 'Examinations', description: 'Exam scheduling, hall tickets' },
  { key: 'grades', label: 'Grades', description: 'Marks, report cards' },
  { key: 'fees', label: 'Fees Management', description: 'Fee collection, vouchers' },
  { key: 'expenses', label: 'Expenses', description: 'School expenses tracking' },
  { key: 'reports', label: 'Reports', description: 'Analytics and reports' },
  { key: 'timetable', label: 'Timetable', description: 'Class schedules' },
  { key: 'subjects', label: 'Subjects', description: 'Subject management' },
  { key: 'classes', label: 'Classes', description: 'Class and section management' },
  { key: 'library', label: 'Library', description: 'Book management' },
  { key: 'transport', label: 'Transport', description: 'Route and vehicle management' }
];

const PLANS = [
  { key: 'Free', price: 0, maxStudents: 50, maxTeachers: 10 },
  { key: 'Basic', price: 5000, maxStudents: 200, maxTeachers: 30 },
  { key: 'Standard', price: 10000, maxStudents: 500, maxTeachers: 75 },
  { key: 'Premium', price: 20000, maxStudents: 1000, maxTeachers: 150 },
  { key: 'Enterprise', price: 50000, maxStudents: -1, maxTeachers: -1 }
];

function Schools() {
  const toast = useToast();
  const { switchSchool } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: { street: '', city: '', country: 'Pakistan' },
    adminEmail: '',
    adminPassword: '',
    modules: ['student', 'teacher', 'attendance', 'fees', 'exams', 'grades', 'reports', 'timetable', 'subjects', 'classes'],
    subscription: { plan: 'Free', billingCycle: 'Monthly' }
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSchools(data);
      } else if (data.message) {
        console.error('Error loading schools:', data.message);
        setSchools([]);
      } else {
        setSchools([]);
      }
    } catch (err) {
      console.error('Failed to load schools:', err);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const method = editingSchool ? 'PUT' : 'POST';
      const url = editingSchool 
        ? `http://localhost:5000/api/schools/${editingSchool._id}`
        : 'http://localhost:5000/api/schools';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        loadSchools();
        toast.success('School saved successfully');
      }
    } catch (err) {
      toast.error('Failed to save school');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will also delete all users associated with this school.')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:5000/api/schools/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSchools();
      toast.success('School deleted successfully');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleLogin = async (school) => {
    await switchSchool(school);
    navigate('/');
  };

  const resetForm = () => {
    setEditingSchool(null);
    setFormData({
      name: '', code: '', email: '', phone: '',
      address: { street: '', city: '', country: 'Pakistan' },
      adminEmail: '', adminPassword: '',
      modules: ['student', 'teacher', 'attendance', 'fees', 'exams', 'grades', 'reports', 'timetable', 'subjects', 'classes'],
      subscription: { plan: 'Free', billingCycle: 'Monthly' }
    });
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || { street: '', city: '', country: 'Pakistan' },
      adminEmail: '',
      adminPassword: '',
      modules: school.modules || [],
      subscription: school.subscription || { plan: 'Free', billingCycle: 'Monthly' }
    });
    setShowModal(true);
  };

  const toggleModule = (moduleKey) => {
    const newModules = formData.modules.includes(moduleKey)
      ? formData.modules.filter(m => m !== moduleKey)
      : [...formData.modules, moduleKey];
    setFormData({ ...formData, modules: newModules });
  };

  const getPlanColor = (plan) => {
    const colors = {
      'Free': 'bg-gray-100 text-gray-700',
      'Trial': 'bg-yellow-100 text-yellow-700',
      'Basic': 'bg-blue-100 text-blue-700',
      'Standard': 'bg-green-100 text-green-700',
      'Premium': 'bg-purple-100 text-purple-700',
      'Enterprise': 'bg-orange-100 text-orange-700'
    };
    return colors[plan] || colors.Free;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-100 text-green-700',
      'Trial': 'bg-yellow-100 text-yellow-700',
      'Expired': 'bg-red-100 text-red-700',
      'Suspended': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.Expired;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schools Management</h1>
          <p className="text-gray-500">Manage all registered schools</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} /> Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div key={school._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{school.name}</h3>
                    <p className="text-sm text-gray-500">{school.code}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(school.subscription?.status)}`}>
                  {school.subscription?.status || 'Trial'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPlanColor(school.subscription?.plan)}`}>
                    {school.subscription?.plan || 'Free'}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span>{school.address?.city || 'N/A'}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{school.modules?.length || 0} modules</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {(school.modules || []).slice(0, 5).map((mod) => (
                  <span key={mod} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {mod}
                  </span>
                ))}
                {(school.modules || []).length > 5 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    +{school.modules.length - 5}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-xs text-gray-500">
                  {new Date(school.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLogin(school)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Login as this school"
                  >
                    <LogIn size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(school)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(school._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingSchool ? 'Edit School' : 'Add New School'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Green Valley School"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                  <input
                    type="text" required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., GVS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                  <select
                    value={formData.subscription.plan}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      subscription: { ...formData.subscription, plan: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PLANS.map(p => (
                      <option key={p.key} value={p.key}>{p.key} - PKR {p.price.toLocaleString()}/month</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingSchool && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-3">School Admin Account</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                        <input
                          type="email"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="admin@school.edu"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
                        <input
                          type="password"
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Leave empty for default"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-3">Enabled Modules</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {AVAILABLE_MODULES.map((mod) => (
                    <label
                      key={mod.key}
                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${
                        formData.modules.includes(mod.key) ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.modules.includes(mod.key)}
                        onChange={() => toggleModule(mod.key)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{mod.label}</p>
                        <p className="text-xs text-gray-500">{mod.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSchool ? 'Update' : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schools;
