import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Eye, Edit, Trash2, Check, X, User, Calendar } from 'lucide-react';
import api from '../../services/api';

function AuditTrail() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    module: '',
    status: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      if (filters.action) params.append('action', filters.action);
      if (filters.module) params.append('module', filters.module);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/audit?${params}`);
      setLogs(response.data.logs || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
      PASSWORD_CHANGE: 'bg-orange-100 text-orange-700',
      VIEW: 'bg-gray-100 text-gray-700'
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status) => {
    return status === 'SUCCESS' ? 'text-green-600' : 'text-red-600';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (!hasPermission('*') && !hasPermission('settings:view')) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Audit Trail</h2>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue"
              />
            </div>
          </div>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="PASSWORD_CHANGE">Password Change</option>
          </select>
          <select
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue"
          >
            <option value="">All Modules</option>
            <option value="Auth">Auth</option>
            <option value="User">User</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Fee">Fee</option>
          </select>
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-light-blue text-white rounded-lg hover:bg-blue-400 transition"
          >
            Filter
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-sm">{log.user?.username || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{log.module}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{log.description}</td>
                      <td className="px-4 py-3">
                        {log.status === 'SUCCESS' ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-red-600" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {logs.length === 0 && (
              <p className="text-center py-8 text-gray-500">No audit logs found</p>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .bg-light-blue { background-color: #60a5fa; }
        .hover\\:bg-light-blue:hover { background-color: #60a5fa; }
        .focus\\:ring-light-blue:focus { --tw-ring-color: #60a5fa; }
        .focus\\:border-light-blue:focus { border-color: #60a5fa; }
        .hover\\:bg-blue-400:hover { background-color: #60a5fa; }
      `}</style>
    </div>
  );
}

export default AuditTrail;
