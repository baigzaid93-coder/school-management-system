import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  Shield,
  Users,
  DollarSign,
  Calendar,
  UserCheck,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const typeIcons = {
  admission: Users,
  leave: Calendar,
  fee_concession: DollarSign,
  fee_waiver: DollarSign,
  expense: DollarSign,
  admin_action: Shield,
  custom: Settings
};

const typeLabels = {
  admission: 'Student Admission',
  leave: 'Leave Request',
  fee_concession: 'Fee Concession',
  fee_waiver: 'Fee Waiver',
  expense: 'Expense',
  admin_action: 'Admin Action',
  custom: 'Custom Request'
};

const permissionOptions = [
  { code: 'admission:approve', label: 'Approve Admissions' },
  { code: 'leave:approve', label: 'Approve Leave' },
  { code: 'fee:approve', label: 'Approve Fee Concessions' },
  { code: 'expense:approve', label: 'Approve Expenses' },
  { code: 'admin:approve', label: 'Approve Admin Actions' }
];

export default function ApprovalSettings() {
  const { user, hasPermission } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  const [formData, setFormData] = useState({
    name: '',
    type: 'admission',
    description: '',
    isDefault: false,
    allowSelfApproval: false,
    levels: [{ order: 1, approverType: 'role', approverRoleCode: 'SCHOOL_ADMIN', requiredPermission: '' }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workflowsRes, rolesRes] = await Promise.all([
        api.get('/approvals/workflows'),
        api.get('/approvals/roles')
      ]);

      setWorkflows(Array.isArray(workflowsRes.data) ? workflowsRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkflow = async (workflowData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      
      const url = editingWorkflow 
        ? `/api/approvals/workflows/${editingWorkflow._id}`
        : '/api/approvals/workflows';
      
      const method = editingWorkflow ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-school-id': schoolId
        },
        body: JSON.stringify(workflowData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingWorkflow(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save workflow');
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
      alert('Failed to save workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      
      const response = await fetch(`/api/approvals/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'x-school-id': schoolId }
      });

      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const openWorkflowModal = (workflow = null) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setFormData({
        name: workflow.name || '',
        type: workflow.type || 'admission',
        description: workflow.description || '',
        isDefault: workflow.isDefault || false,
        allowSelfApproval: workflow.allowSelfApproval || false,
        levels: workflow.levels || [{ order: 1, approverType: 'role', approverRoleCode: 'SCHOOL_ADMIN', requiredPermission: '' }]
      });
    } else {
      setEditingWorkflow(null);
      setFormData({
        name: '',
        type: 'admission',
        description: '',
        isDefault: false,
        allowSelfApproval: false,
        levels: [{ order: 1, approverType: 'role', approverRoleCode: 'SCHOOL_ADMIN', requiredPermission: '' }]
      });
    }
    setShowModal(true);
  };

  const addLevel = () => {
    setFormData({
      ...formData,
      levels: [...formData.levels, { 
        order: formData.levels.length + 1, 
        approverType: 'role', 
        approverRoleCode: 'SCHOOL_ADMIN',
        requiredPermission: '' 
      }]
    });
  };

  const removeLevel = (index) => {
    setFormData({
      ...formData,
      levels: formData.levels.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i + 1 }))
    });
  };

  const updateLevel = (index, field, value) => {
    const newLevels = [...formData.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setFormData({ ...formData, levels: newLevels });
  };

  const renderWorkflowForm = () => {

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </h3>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Fee Concession Approval"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={editingWorkflow}
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="Describe when this approval is needed..."
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Set as default workflow for this type</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowSelfApproval}
                  onChange={(e) => setFormData({ ...formData, allowSelfApproval: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Allow self-approval</span>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Approval Levels</label>
                <button
                  onClick={addLevel}
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={16} /> Add Level
                </button>
              </div>

              {formData.levels.map((level, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Level {level.order}</span>
                    {formData.levels.length > 1 && (
                      <button
                        onClick={() => removeLevel(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Approver Type</label>
                      <select
                        value={level.approverType}
                        onChange={(e) => updateLevel(index, 'approverType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="role">By Role</option>
                        <option value="user">By User</option>
                        <option value="auto">Auto Approve</option>
                      </select>
                    </div>
                    {level.approverType === 'role' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Role</label>
                        <select
                          value={level.approverRoleCode || ''}
                          onChange={(e) => updateLevel(index, 'approverRoleCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select Role</option>
                          {roles.map(role => (
                            <option key={role._id} value={role.code}>{role.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Required Permission</label>
                      <select
                        value={level.requiredPermission || ''}
                        onChange={(e) => updateLevel(index, 'requiredPermission', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Any Permission</option>
                        {permissionOptions.map(opt => (
                          <option key={opt.code} value={opt.code}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {(formData.type === 'fee_concession' || formData.type === 'fee_waiver') && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max Amount (PKR)</label>
                        <input
                          type="number"
                          value={level.maxAmount || ''}
                          onChange={(e) => updateLevel(index, 'maxAmount', parseFloat(e.target.value) || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="50000"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveWorkflow(formData)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save size={16} />
              Save Workflow
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
          <h1 className="text-2xl font-bold text-gray-900">Approval Settings</h1>
          <p className="text-gray-500">Configure who can approve what in your school</p>
        </div>
        <button
          onClick={() => openWorkflowModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Create Workflow
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'workflows' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Workflows ({workflows.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'permissions' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Permission Matrix
            </button>
          </div>
        </div>

        {activeTab === 'workflows' && (
          <div className="divide-y divide-gray-100">
            {workflows.length === 0 ? (
              <div className="p-8 text-center">
                <Settings size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No workflows configured yet</p>
                <p className="text-sm text-gray-400 mt-1">Create a workflow to start managing approvals</p>
              </div>
            ) : (
              workflows.map((workflow) => {
                const Icon = typeIcons[workflow.type] || Settings;
                return (
                  <div key={workflow._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          workflow.type === 'admission' ? 'bg-blue-100 text-blue-600' :
                          workflow.type === 'leave' ? 'bg-purple-100 text-purple-600' :
                          workflow.type === 'fee_concession' || workflow.type === 'fee_waiver' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                            {workflow.isDefault && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                Default
                              </span>
                            )}
                            {workflow.isActive ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                <CheckCircle size={10} /> Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{workflow.description || typeLabels[workflow.type]}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>{workflow.levels?.length || 1} level(s)</span>
                            {workflow.levels?.[0]?.approverRoleCode && (
                              <span>Approver: {workflow.levels[0].approverRoleCode}</span>
                            )}
                            {workflow.levels?.[0]?.requiredPermission && (
                              <span>Permission: {workflow.levels[0].requiredPermission}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openWorkflowModal(workflow)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Permission-Based Approvals</p>
                <p className="text-sm text-blue-600 mt-1">
                  Users can only approve requests if they have the required permission and appropriate role.
                  Admins (SCHOOL_ADMIN, ADMIN) can always approve.
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-4">Approval Permissions Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Request Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Required Permission</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Can Approve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {permissionOptions.map((perm) => (
                    <tr key={perm.code} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {perm.label.replace('Approve ', '')}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{perm.code}</code>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            SCHOOL_ADMIN, ADMIN
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Users with {perm.code} permission
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            SUPER_ADMIN (always)
                          </li>
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-gray-900 mb-4 mt-8">Workflow Amount Limits</h3>
            <p className="text-sm text-gray-600 mb-4">
              Fee-related workflows can have amount limits per approval level:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>Fee Concession:</strong> Default max PKR 5,000 per approval level</li>
                <li><strong>Fee Waiver:</strong> Default max PKR 50,000 per approval level</li>
                <li><strong>Custom Limits:</strong> Configure in workflow settings</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {showModal && renderWorkflowForm()}
    </div>
  );
}
