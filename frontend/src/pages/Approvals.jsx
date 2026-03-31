import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Filter,
  Download,
  MessageSquare,
  Settings,
  Shield
} from 'lucide-react';

const typeLabels = {
  admission: 'Admission',
  leave: 'Leave Request',
  fee_concession: 'Fee Concession',
  fee_waiver: 'Fee Waiver',
  expense: 'Expense',
  admin_action: 'Admin Action',
  custom: 'Custom Request'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  escalated: 'bg-orange-100 text-orange-800'
};

const priorityColors = {
  low: 'text-gray-500',
  normal: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500'
};

export default function Approvals() {
  const { user, hasPermission } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: 'pending' });
  const [expandedId, setExpandedId] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    loadApprovals();
    loadStats();
  }, [filter]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status && filter.status !== 'all') params.append('status', filter.status);

      const endpoint = filter.status === 'pending' 
        ? '/api/approvals/my-pending'
        : `/api/approvals/pending`;

      const response = await fetch(
        `${endpoint}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-school-id': schoolId
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setApprovals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/approvals/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await api.post(
        `/approvals/${selectedApproval._id}/approve`,
        { comments: actionComment }
      );

      if (response.status === 200 || response.status === 201) {
        setShowApproveModal(false);
        setSelectedApproval(null);
        setActionComment('');
        loadApprovals();
        loadStats();
      } else {
        alert(response.data?.message || 'Failed to approve');
      }
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!actionComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await api.post(
        `/approvals/${selectedApproval._id}/reject`,
        { reason: actionComment }
      );

      if (response.status === 200 || response.status === 201) {
        setShowRejectModal(false);
        setSelectedApproval(null);
        setActionComment('');
        loadApprovals();
        loadStats();
      } else {
        alert(response.data?.message || 'Failed to reject');
      }
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('Failed to reject request');
    }
  };

  const openApproveModal = (approval) => {
    setSelectedApproval(approval);
    setActionComment('');
    setShowApproveModal(true);
  };

  const openRejectModal = (approval) => {
    setSelectedApproval(approval);
    setActionComment('');
    setShowRejectModal(true);
  };

  const renderApprovalDetails = (approval) => {
    const data = approval.data || {};
    
    switch (approval.type) {
      case 'admission':
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Student Name:</span> {data.firstName} {data.lastName}</div>
            <div><span className="text-gray-500">Class:</span> {data.classGrade?.name || 'N/A'}</div>
            <div><span className="text-gray-500">Parent:</span> {data.parentName || 'N/A'}</div>
            <div><span className="text-gray-500">Phone:</span> {data.parentPhone || 'N/A'}</div>
            <div className="col-span-2"><span className="text-gray-500">Email:</span> {data.email || 'N/A'}</div>
          </div>
        );
      case 'leave':
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Staff:</span> {data.staffName || approval.requesterName}</div>
            <div><span className="text-gray-500">Leave Type:</span> {data.leaveType}</div>
            <div><span className="text-gray-500">From:</span> {new Date(data.startDate).toLocaleDateString()}</div>
            <div><span className="text-gray-500">To:</span> {new Date(data.endDate).toLocaleDateString()}</div>
            <div><span className="text-gray-500">Days:</span> {data.totalDays}</div>
            <div><span className="text-gray-500">Reason:</span> {data.reason}</div>
          </div>
        );
      case 'fee_concession':
      case 'fee_waiver':
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Student:</span> {data.studentName}</div>
            <div><span className="text-gray-500">Fee Type:</span> {data.feeType}</div>
            <div><span className="text-gray-500">Original Amount:</span> PKR {data.originalAmount?.toLocaleString()}</div>
            <div><span className="text-gray-500">Concession:</span> {data.concessionType === 'percentage' ? `${data.concessionValue}%` : `PKR ${data.concessionValue?.toLocaleString()}`}</div>
            <div><span className="text-gray-500">Reason:</span> {data.reason || 'Not specified'}</div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-500">
            <pre className="bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending', count: stats.pending, icon: Clock },
    { id: 'approved', label: 'Approved', count: stats.approved, icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle },
    { id: 'all', label: 'All', count: stats.total, icon: FileText }
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-500">Review and process pending requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/approval-settings"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100"
          >
            <Settings size={16} />
            Workflow Settings
          </Link>
          <button
            onClick={loadApprovals}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Shield size={20} className="text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-800 font-medium">Permission-Based Approvals</p>
          <p className="text-blue-600 mt-1">
            You can only approve requests that match your role and permissions. 
            Admins can approve all requests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setFilter({ ...filter, status: tab.id === 'all' ? '' : tab.id });
            }}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-50 border-2 border-indigo-500'
                : 'bg-white border border-gray-200 hover:border-indigo-300'
            }`}
          >
            <tab.icon
              size={24}
              className={
                tab.id === 'pending' ? 'text-yellow-500' :
                tab.id === 'approved' ? 'text-green-500' :
                tab.id === 'rejected' ? 'text-red-500' : 'text-blue-500'
              }
            />
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
              <p className="text-sm text-gray-500">{tab.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Filter by type:</span>
            </div>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="admission">Admission</option>
              <option value="leave">Leave Request</option>
              <option value="fee_concession">Fee Concession</option>
              <option value="fee_waiver">Fee Waiver</option>
              <option value="expense">Expense</option>
              <option value="admin_action">Admin Action</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading approvals...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No {filter.status !== 'all' ? filter.status : ''} requests found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {approvals.map((approval) => (
              <div key={approval._id} className="p-4">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === approval._id ? null : approval._id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      approval.type === 'admission' ? 'bg-blue-100 text-blue-600' :
                      approval.type === 'leave' ? 'bg-purple-100 text-purple-600' :
                      approval.type === 'fee_concession' || approval.type === 'fee_waiver' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {approval.type === 'admission' ? <Users size={20} /> :
                       approval.type === 'leave' ? <Calendar size={20} /> :
                       approval.type === 'fee_concession' || approval.type === 'fee_waiver' ? <DollarSign size={20} /> :
                       <FileText size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {typeLabels[approval.type] || approval.type}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[approval.status]}`}>
                          {approval.status}
                        </span>
                        <span className={`text-xs font-medium ${priorityColors[approval.priority]}`}>
                          {approval.priority === 'urgent' && 'URGENT'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Requested by {approval.requesterName || 'Unknown'} • {new Date(approval.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {approval.currentLevel}/{approval.totalLevels} levels
                        {approval.dueDate && ` • Due: ${new Date(approval.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {approval.status === 'pending' && (
                      <>
                        {approval.canApprove !== false ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); openApproveModal(approval); }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openRejectModal(approval); }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                            <Shield size={12} /> No Permission
                          </span>
                        )}
                      </>
                    )}
                    {expandedId === approval._id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedId === approval._id && (
                  <div className="mt-4 pl-14">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Request Details</h4>
                      {renderApprovalDetails(approval)}
                    </div>

                    {approval.history && approval.history.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <MessageSquare size={16} />
                          History
                        </h4>
                        <div className="space-y-3">
                          {approval.history.map((h, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                h.action === 'approve' ? 'bg-green-200 text-green-700' :
                                h.action === 'reject' ? 'bg-red-200 text-red-700' :
                                h.action === 'escalate' ? 'bg-orange-200 text-orange-700' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {h.action === 'approve' ? '✓' :
                                 h.action === 'reject' ? '✗' :
                                 h.action === 'escalate' ? '↑' : '•'}
                              </div>
                              <div>
                                <p className="text-gray-700">
                                  <span className="font-medium">{h.actionByName}</span>
                                  <span className="text-gray-500"> - {h.action}</span>
                                  {h.level > 0 && <span className="text-gray-400"> (Level {h.level})</span>}
                                </p>
                                {h.comments && <p className="text-gray-500 mt-1">{h.comments}</p>}
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(h.actionAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showApproveModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Request</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve this {typeLabels[selectedApproval.type]?.toLowerCase()} request?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (optional)
              </label>
              <textarea
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Add any comments..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this {typeLabels[selectedApproval.type]?.toLowerCase()} request.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Enter rejection reason..."
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
