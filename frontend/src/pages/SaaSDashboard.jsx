import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { invoiceService } from '../services/api';
import {
  Building2, Users, TrendingUp, CreditCard, CheckCircle, Clock, DollarSign,
  Plus, ArrowRight, Shield, BarChart3, Briefcase, UserCog, Building, School,
  Receipt, RefreshCw
} from 'lucide-react';

function SaaSDashboard() {
  const { user, switchSchool } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    trialSchools: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingAmount: 0,
    totalStudents: 0,
    totalTeachers: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schoolsRes, invoicesRes] = await Promise.all([
        api.get('/schools'),
        api.get('/invoices?limit=100')
      ]);
      
      const schoolsList = Array.isArray(schoolsRes.data) ? schoolsRes.data : [];
      const invoicesList = invoicesRes.data.invoices || [];
      
      setSchools(schoolsList);
      
      const schoolIds = new Set(schoolsList.map(s => s._id?.toString()));
      const schoolNames = {};
      schoolsList.forEach(s => schoolNames[s._id?.toString()] = s.name);
      
      const validInvoices = invoicesList
        .filter(inv => {
          const schoolId = inv.school?._id?.toString() || inv.school?.toString();
          return schoolId && schoolIds.has(schoolId);
        })
        .map(inv => {
          const schoolId = inv.school?._id?.toString() || inv.school?.toString();
          return {
            ...inv,
            schoolName: schoolNames[schoolId] || 'Unknown'
          };
        });
      
      const active = schoolsList.filter(s => s.subscription?.status === 'Active').length;
      const trial = schoolsList.filter(s => s.subscription?.status === 'Trial').length;
      
      const paidInvoices = validInvoices.filter(inv => inv.status === 'Paid');
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.charges?.total || 0), 0);
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthlyPaid = paidInvoices.filter(inv => 
        inv.period?.month === currentMonth && inv.period?.year === currentYear
      );
      const monthlyRevenue = monthlyPaid.reduce((sum, inv) => sum + (inv.charges?.total || 0), 0);
      
      const pendingInvoices = validInvoices.filter(inv => ['Generated', 'Sent', 'Overdue'].includes(inv.status));
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.charges?.total || 0), 0);
      
      const allRecentInvoices = validInvoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(inv => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          schoolName: inv.schoolName,
          amount: inv.charges?.total || 0,
          date: inv.paidDate || inv.dueDate || inv.createdAt,
          plan: inv.subscription?.plan || 'Free',
          status: inv.status
        }));
      
      setStats({
        totalSchools: schoolsList.length,
        activeSchools: active,
        trialSchools: trial,
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue,
        pendingAmount: pendingAmount,
        totalStudents: 0,
        totalTeachers: 0
      });
      
      setRecentTransactions([]);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSchool = async (school) => {
    await switchSchool(school);
    navigate('/');
  };

  const quickActions = [
    { label: 'Add School', icon: Plus, path: '/schools/new', color: 'bg-blue-500' },
    { label: 'SaaS Users', icon: UserCog, path: '/saas/users', color: 'bg-purple-500' },
    { label: 'Revenue', icon: TrendingUp, path: '/saas/revenue', color: 'bg-green-500' },
    { label: 'Analytics', icon: BarChart3, path: '/saas/analytics', color: 'bg-orange-500' },
    { label: 'CBS', icon: Briefcase, path: '/saas/cbs', color: 'bg-indigo-500' },
    { label: 'HR', icon: Users, path: '/saas/hr', color: 'bg-teal-500' },
  ];

  const modules = [
    { key: 'cbs', label: 'CBS', description: 'Core Banking System', icon: Briefcase },
    { key: 'hr', label: 'HR', description: 'Human Resources', icon: Users },
    { key: 'admin', label: 'Administration', description: 'School Administration', icon: Building },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">SaaS Dashboard</h1>
          <p className="page-subtitle">Manage your multi-tenant school platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="btn btn-secondary btn-md"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/schools/new')}
            className="btn btn-primary btn-md"
          >
            <Plus size={18} /> Add School
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Schools</p>
              <p className="text-4xl font-bold mt-2">{stats.totalSchools}</p>
            </div>
            <School size={48} className="text-blue-300" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Schools</p>
              <p className="text-4xl font-bold mt-2">{stats.activeSchools}</p>
            </div>
            <CheckCircle size={48} className="text-green-300" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Trial Schools</p>
              <p className="text-4xl font-bold mt-2">{stats.trialSchools}</p>
            </div>
            <Clock size={48} className="text-amber-300" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
              <p className="text-4xl font-bold mt-2">Rs. {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign size={48} className="text-purple-300" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">This Month</p>
              <p className="text-4xl font-bold mt-2">Rs. {stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp size={48} className="text-teal-300" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending</p>
              <p className="text-4xl font-bold mt-2">Rs. {stats.pendingAmount.toLocaleString()}</p>
            </div>
            <Clock size={48} className="text-orange-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">All Schools</h3>
              <button
                onClick={() => navigate('/schools/new')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View All <ArrowRight size={14} className="inline" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">School</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">City</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schools.slice(0, 5).map(school => (
                    <tr key={school._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Building2 className="text-indigo-600" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{school.name}</p>
                            <p className="text-sm text-gray-500">{school.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{school.address?.city || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                          {school.subscription?.plan || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          school.subscription?.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          school.subscription?.status === 'Trial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {school.subscription?.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSwitchSchool(school)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="card">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {recentTransactions.length} payments
                </span>
              </div>
              <button
                onClick={() => navigate('/saas/billing')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View All <ArrowRight size={14} className="inline" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Plan</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">No transactions yet</p>
                        <p className="text-sm text-slate-400">Payments will appear here when schools pay their invoices</p>
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{tx.schoolName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            {tx.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-slate-900">Rs {tx.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {new Date(tx.date).toLocaleDateString('en-US', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                            tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">SaaS Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.key} className="p-6 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} className="text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900">{mod.label}</h4>
                <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
                <button
                  onClick={() => navigate(`/saas/${mod.key}`)}
                  className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Manage <ArrowRight size={14} className="inline" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SaaSDashboard;
