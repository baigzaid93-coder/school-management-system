import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, UsersRound, AlertCircle } from 'lucide-react';
import useToast from '../hooks/useToast';

function Staff() {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    salary: ''
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const schoolId = localStorage.getItem('currentSchoolId');
      const response = await fetch('http://localhost:5000/api/staff', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'x-school-id': schoolId || ''
        }
      });
      const data = await response.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      loadStaff();
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const method = editingStaff ? 'PUT' : 'POST';
      const url = editingStaff 
        ? `http://localhost:5000/api/staff/${editingStaff._id}`
        : 'http://localhost:5000/api/staff';
      
      await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'x-school-id': schoolId || ''
        },
        body: JSON.stringify({ ...formData, school: schoolId })
      });
      
      setShowModal(false);
      resetForm();
      loadStaff();
      toast.success('Staff saved successfully');
    } catch (err) {
      toast.error('Failed to save staff');
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      designation: staffMember.designation || '',
      department: staffMember.department || '',
      salary: staffMember.salary || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`http://localhost:5000/api/staff/${id}`, { method: 'DELETE' });
      loadStaff();
      toast.success('Staff deleted successfully');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', designation: '', department: '', salary: '' });
  };

  const filteredStaff = staff.filter(s => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return s.firstName?.toLowerCase().includes(query) || 
           s.lastName?.toLowerCase().includes(query) ||
           s.email?.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-500">Manage non-teaching staff members</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4">
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <UsersRound className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Staff Found</h3>
          <p className="text-gray-500 mb-4">Add staff members to manage your team</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Staff
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((staffMember) => (
                <tr key={staffMember._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {staffMember.firstName?.[0]}{staffMember.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{staffMember.firstName} {staffMember.lastName}</p>
                        <p className="text-sm text-gray-500">{staffMember.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{staffMember.designation || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{staffMember.department || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{staffMember.email || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(staffMember)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(staffMember._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingStaff ? 'Edit Staff' : 'Add Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" required value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" required value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingStaff ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Staff;
