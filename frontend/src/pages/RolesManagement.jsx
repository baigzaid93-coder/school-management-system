import { useState, useEffect } from 'react';
import { Shield, Save, X, ChevronRight, Users, AlertCircle, Check, Loader2, Plus } from 'lucide-react';
import api from '../services/api';
import useToast from '../hooks/useToast';

const PERMISSION_GROUPS = [
  {
    name: 'Dashboard',
    key: 'dashboard',
    permissions: [
      { key: 'dashboard:view', label: 'View Dashboard' },
      { key: 'dashboard:analytics', label: 'View Analytics' },
    ]
  },
  {
    name: 'Students',
    key: 'students',
    permissions: [
      { key: 'student:view', label: 'View Students' },
      { key: 'student:create', label: 'Create Students' },
      { key: 'student:edit', label: 'Edit Students' },
      { key: 'student:delete', label: 'Delete Students' },
      { key: 'student:import', label: 'Import Students' },
      { key: 'student:export', label: 'Export Students' },
    ]
  },
  {
    name: 'Teachers',
    key: 'teachers',
    permissions: [
      { key: 'teacher:view', label: 'View Teachers' },
      { key: 'teacher:create', label: 'Create Teachers' },
      { key: 'teacher:edit', label: 'Edit Teachers' },
      { key: 'teacher:delete', label: 'Delete Teachers' },
    ]
  },
  {
    name: 'Courses',
    key: 'courses',
    permissions: [
      { key: 'course:view', label: 'View Courses' },
      { key: 'course:create', label: 'Create Courses' },
      { key: 'course:edit', label: 'Edit Courses' },
      { key: 'course:delete', label: 'Delete Courses' },
    ]
  },
  {
    name: 'Grades',
    key: 'grades',
    permissions: [
      { key: 'grade:view', label: 'View Grades' },
      { key: 'grade:create', label: 'Create Grades' },
      { key: 'grade:edit', label: 'Edit Grades' },
      { key: 'grade:delete', label: 'Delete Grades' },
    ]
  },
  {
    name: 'Attendance',
    key: 'attendance',
    permissions: [
      { key: 'attendance:view', label: 'View Attendance' },
      { key: 'attendance:mark', label: 'Mark Attendance' },
      { key: 'attendance:edit', label: 'Edit Attendance' },
      { key: 'attendance:delete', label: 'Delete Attendance' },
    ]
  },
  {
    name: 'Fees',
    key: 'fees',
    permissions: [
      { key: 'fee:view', label: 'View Fees' },
      { key: 'fee:create', label: 'Create Fees' },
      { key: 'fee:edit', label: 'Edit Fees' },
      { key: 'fee:delete', label: 'Delete Fees' },
      { key: 'fee:payment', label: 'Process Payments' },
    ]
  },
  {
    name: 'Admissions',
    key: 'admissions',
    permissions: [
      { key: 'admission:view', label: 'View Admissions' },
      { key: 'admission:read', label: 'Read Details' },
      { key: 'admission:write', label: 'Create/Edit' },
      { key: 'admission:verify', label: 'Verify Applications' },
      { key: 'admission:approve', label: 'Approve Applications' },
      { key: 'admission:delete', label: 'Delete Applications' },
    ]
  },
  {
    name: 'Users',
    key: 'users',
    permissions: [
      { key: 'user:view', label: 'View Users' },
      { key: 'user:create', label: 'Create Users' },
      { key: 'user:edit', label: 'Edit Users' },
      { key: 'user:delete', label: 'Delete Users' },
    ]
  },
  {
    name: 'Reports',
    key: 'reports',
    permissions: [
      { key: 'report:view', label: 'View Reports' },
      { key: 'report:generate', label: 'Generate Reports' },
      { key: 'report:export', label: 'Export Reports' },
    ]
  },
  {
    name: 'Settings',
    key: 'settings',
    permissions: [
      { key: 'settings:view', label: 'View Settings' },
      { key: 'settings:edit', label: 'Edit Settings' },
    ]
  },
];

function RolesManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setError(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || []);
    setHasChanges(false);
    setSuccessMessage('');
  };

  const togglePermission = (permKey) => {
    if (selectedRole?.code === 'SUPER_ADMIN') return;
    
    setSelectedPermissions(prev => {
      if (prev.includes(permKey)) {
        return prev.filter(p => p !== permKey);
      } else {
        return [...prev, permKey];
      }
    });
    setHasChanges(true);
    setSuccessMessage('');
  };

  const toggleGroupPermission = (group) => {
    if (selectedRole?.code === 'SUPER_ADMIN') return;
    
    const groupPerms = group.permissions.map(p => p.key);
    const allSelected = groupPerms.every(p => selectedPermissions.includes(p));
    
    setSelectedPermissions(prev => {
      if (allSelected) {
        return prev.filter(p => !groupPerms.includes(p));
      } else {
        const newPerms = [...prev];
        groupPerms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
        return newPerms;
      }
    });
    setHasChanges(true);
    setSuccessMessage('');
  };

  const selectAllPermissions = () => {
    if (selectedRole?.code === 'SUPER_ADMIN') return;
    
    const allPerms = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
    setSelectedPermissions(allPerms);
    setHasChanges(true);
    setSuccessMessage('');
  };

  const clearAllPermissions = () => {
    if (selectedRole?.code === 'SUPER_ADMIN') return;
    
    setSelectedPermissions([]);
    setHasChanges(true);
    setSuccessMessage('');
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      await api.put(`/roles/${selectedRole._id}`, {
        permissions: selectedPermissions
      });
      setHasChanges(false);
      setSuccessMessage('Permissions saved successfully!');
      loadRoles();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save permissions';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const createNewRole = async () => {
    if (!selectedRole.name || !selectedRole.code) {
      setError('Role name and code are required');
      return;
    }
    try {
      setSaving(true);
      await api.post('/roles', {
        name: selectedRole.name,
        code: selectedRole.code.toUpperCase().replace(/\s+/g, '_'),
        description: selectedRole.description || '',
        permissions: selectedPermissions,
        isSystem: false,
        level: 99,
        canApprove: false,
        maxBranches: 1
      });
      setSuccessMessage('Role created successfully!');
      loadRoles();
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create role';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getGroupStatus = (group) => {
    const groupPerms = group.permissions.map(p => p.key);
    const selectedCount = groupPerms.filter(p => selectedPermissions.includes(p)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === groupPerms.length) return 'all';
    return 'partial';
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
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Roles</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadRoles} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Role Permissions</h1>
          <p className="text-gray-500">Manage access permissions for each role</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Select Role</h3>
            <button
              onClick={() => {
                setSelectedRole({ _id: 'new', name: '', code: '', description: '', permissions: [], isSystem: false });
                setSelectedPermissions([]);
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus size={14} /> New Role
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {roles.map(role => (
              <button
                key={role._id}
                onClick={() => selectRole(role)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                  selectedRole?._id === role._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-gray-800">{role.name}</p>
                  <p className="text-xs text-gray-500">{role.permissions?.length || 0} permissions</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm">
          {selectedRole ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="text-purple-600" size={20} />
                  </div>
                  {selectedRole._id === 'new' ? (
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Role Name"
                        value={selectedRole.name || ''}
                        onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                        className="px-3 py-1.5 border rounded-lg text-sm font-semibold w-48"
                      />
                      <input
                        type="text"
                        placeholder="Code (e.g., CUSTOM_ADMIN)"
                        value={selectedRole.code || ''}
                        onChange={(e) => setSelectedRole({...selectedRole, code: e.target.value})}
                        className="px-3 py-1.5 border rounded-lg text-sm ml-2 w-48"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedRole.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedRole.description}
                        {selectedRole.isSystem && ' • System Role'}
                      </p>
                    </div>
                  )}
                </div>
                {selectedRole.code === 'SUPER_ADMIN' && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    All Access Granted
                  </span>
                )}
              </div>

              {successMessage && (
                <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                  <Check size={18} />
                  {successMessage}
                </div>
              )}

              <div className="p-4 border-b flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedPermissions.length} of {PERMISSION_GROUPS.flatMap(g => g.permissions).length} permissions selected
                </span>
                {selectedRole.code !== 'SUPER_ADMIN' && (
                  <>
                    <button
                      onClick={selectAllPermissions}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={clearAllPermissions}
                      className="text-sm text-gray-600 hover:text-gray-700 hover:underline"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>

              <div className="p-4 max-h-[500px] overflow-y-auto">
                <div className="space-y-6">
                  {PERMISSION_GROUPS.map(group => {
                    const status = getGroupStatus(group);
                    return (
                      <div key={group.key} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={status === 'all'}
                            ref={(el) => {
                              if (el) el.indeterminate = status === 'partial';
                            }}
                            onChange={() => toggleGroupPermission(group)}
                            disabled={selectedRole.code === 'SUPER_ADMIN'}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <h4 className="font-semibold text-gray-800">{group.name}</h4>
                          <span className="text-xs text-gray-500">
                            ({group.permissions.filter(p => selectedPermissions.includes(p.key)).length}/{group.permissions.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-7">
                          {group.permissions.map(perm => (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedPermissions.includes(perm.key)
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50 text-gray-600'
                              } ${selectedRole.code === 'SUPER_ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.key) || selectedRole.code === 'SUPER_ADMIN'}
                                onChange={() => togglePermission(perm.key)}
                                disabled={selectedRole.code === 'SUPER_ADMIN'}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-sm">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedRole._id === 'new' ? (
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedRole(null);
                      setSelectedPermissions([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewRole}
                    disabled={saving || !selectedRole.name || !selectedRole.code}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Role
                      </>
                    )}
                  </button>
                </div>
              ) : !selectedRole.isSystem && selectedRole.code !== 'SUPER_ADMIN' ? (
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedPermissions(selectedRole.permissions || []);
                      setHasChanges(false);
                    }}
                    disabled={!hasChanges}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePermissions}
                    disabled={!hasChanges || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Permissions
                      </>
                    )}
                  </button>
                </div>
              ) : selectedRole.isSystem && (
                <div className="p-4 border-t bg-yellow-50">
                  <p className="text-yellow-700 text-sm text-center">
                    System roles cannot be modified
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center p-6">
              <Shield className="text-gray-300 mb-4" size={64} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Role</h3>
              <p className="text-gray-500">Choose a role from the list to manage its permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RolesManagement;
