import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users, AlertCircle, UserCheck, UserX, ChevronDown, Shield, KeyRound } from 'lucide-react';
import api from '../services/api';
import useToast from '../hooks/useToast';

function UsersManagement() {
  const toast = useToast();
  const [people, setPeople] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: '',
    isActive: true
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      searchPeople();
    } else {
      loadPeople();
    }
  }, [searchQuery, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesRes] = await Promise.all([
        api.get('/roles')
      ]);
      setRoles(rolesRes.data);
      await loadPeople();
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    try {
      const type = activeTab === 'all' ? '' : activeTab.toLowerCase();
      const res = await api.get(`/auth/people?limit=100&type=${type}`);
      setPeople(res.data.people || []);
    } catch (err) {
      console.error('Failed to load people:', err);
    }
  };

  const searchPeople = async () => {
    try {
      const type = activeTab === 'all' ? '' : activeTab.toLowerCase();
      const res = await api.get(`/auth/people?search=${searchQuery}&limit=100&type=${type}`);
      setPeople(res.data.people || []);
    } catch (err) {
      console.error('Failed to search people:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users?limit=100');
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName
        }
      };
      delete payload.firstName;
      delete payload.lastName;
      
      await api.post('/auth/register', payload);
      setShowCreateUserModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await api.patch(`/auth/users/${userId}/toggle`);
      loadPeople();
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      loadPeople();
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        userId: resetPasswordUser._id,
        newPassword: newPassword
      });
      setShowResetPasswordModal(false);
      setResetPasswordUser(null);
      setNewPassword('');
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const openResetPasswordModal = (user) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setShowResetPasswordModal(true);
  };

  const resetForm = () => {
    setEditingPerson(null);
    setSelectedPerson(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: '',
      isActive: true
    });
  };

  const openCreateUserModal = (person = null) => {
    if (person) {
      setSelectedPerson(person);
      setFormData({
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        email: person.email || '',
        username: `${(person.firstName || '').toLowerCase()}.${(person.lastName || '').toLowerCase()}`,
        password: '',
        role: '',
        isActive: true
      });
    } else {
      resetForm();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        role: '',
        isActive: true
      });
    }
    setShowCreateUserModal(true);
  };

  const filteredPeople = people;

  const getTypeColor = (type) => {
    switch (type) {
      case 'Teacher': return 'bg-purple-100 text-purple-700';
      case 'Student': return 'bg-blue-100 text-blue-700';
      case 'Parent': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-red-100 text-red-700';
      case 'On Leave': return 'bg-yellow-100 text-yellow-700';
      case 'Graduated': return 'bg-blue-100 text-blue-700';
      case 'Suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">People Management</h1>
          <p className="text-gray-500">Manage teachers, students, parents, and user accounts</p>
        </div>
        <button
          onClick={() => openCreateUserModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} /> Add User Only
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b">
          <div className="flex gap-1 px-4 pt-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All ({people.length})
            </button>
            <button
              onClick={() => setActiveTab('Teacher')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'Teacher'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Teachers ({people.filter(p => p.type === 'Teacher').length})
            </button>
            <button
              onClick={() => setActiveTab('Student')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'Student'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Students ({people.filter(p => p.type === 'Student').length})
            </button>
            <button
              onClick={() => setActiveTab('Parent')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'Parent'
                  ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Parents ({people.filter(p => p.type === 'Parent').length})
            </button>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          </div>
        </div>

        {filteredPeople.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No People Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding teachers, students, or parents</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Record Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User Account</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPeople.map((person) => (
                  <tr key={`${person.type}-${person._id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          person.type === 'Teacher' ? 'bg-purple-100' :
                          person.type === 'Student' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <span className={`font-semibold ${
                            person.type === 'Teacher' ? 'text-purple-600' :
                            person.type === 'Student' ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {person.firstName?.[0]}{person.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{person.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(person.type)}`}>
                        {person.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                      {person.uniqueId}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(person.status)}`}>
                        {person.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {person.user ? (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            person.user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {person.user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">
                            @{person.user.username}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            No Account
                          </span>
                          <button
                            onClick={() => openCreateUserModal(person)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Create Account
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {person.user && (
                          <>
                            <button
                              onClick={() => openResetPasswordModal(person.user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Reset Password"
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(person.user._id)}
                              className={`p-2 rounded-lg ${
                                person.user.isActive 
                                  ? 'text-orange-600 hover:bg-orange-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={person.user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {person.user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(person.user._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete User Account"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedPerson ? `Create User for ${selectedPerson.firstName} ${selectedPerson.lastName}` : 'Create New User'}
              </h3>
              <button onClick={() => { setShowCreateUserModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required={!selectedPerson}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingPerson && '(Leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  required={!editingPerson}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={editingPerson ? 'Enter new password to change' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateUserModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <button onClick={() => { setShowResetPasswordModal(false); setResetPasswordUser(null); }} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Reset password for: <strong>{resetPasswordUser.profile?.firstName} {resetPasswordUser.profile?.lastName}</strong>
                <br />
                <span className="text-blue-600">@{resetPasswordUser.username}</span>
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowResetPasswordModal(false); setResetPasswordUser(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagement;
