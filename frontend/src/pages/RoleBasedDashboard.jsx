import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { dashboardService, attendanceService, feeService } from '../services/api';
import {
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp,
  Calendar, Clock, CheckCircle, UserCheck, ArrowRight,
  UserPlus, Search, FileText, Settings, ClipboardCheck, TrendingDown,
  Building2, Plus
} from 'lucide-react';

function RoleBasedDashboard() {
  const { user, hasRole, currentSchool, switchSchool } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);

  const isSuperAdmin = user?.isSuperAdmin || user?.role?.code === 'SUPER_ADMIN';
  const showSaaSDashboard = isSuperAdmin && !currentSchool;
  const primaryColor = currentSchool?.branding?.primaryColor || '#4F46E5';
  const secondaryColor = currentSchool?.branding?.secondaryColor || '#7C3AED';

  useEffect(() => {
    if (showSaaSDashboard) {
      loadSchools();
    } else {
      loadDashboardData();
    }
  }, [currentSchool]);

  const loadSchools = async () => {
    try {
      const response = await api.get('/schools');
      setSchools(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
      setRecentStudents(response.data?.recentStudents || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSchool = async (school) => {
    await switchSchool(school);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // SaaS Dashboard View (Super Admin without school selected)
  if (showSaaSDashboard) {
    return (
      <div className="space-y-8">
        <div className="page-header">
          <div>
            <h1 className="page-title">SaaS Dashboard</h1>
            <p className="page-subtitle">Manage all registered schools</p>
          </div>
          <button
            onClick={() => navigate('/schools')}
            className="btn btn-primary btn-md"
          >
            <Plus size={18} /> Add School
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Schools</p>
                <p className="text-4xl font-bold mt-2">{schools.length}</p>
              </div>
              <Building2 size={48} className="text-indigo-300" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Schools</p>
                <p className="text-4xl font-bold mt-2">
                  {schools.filter(s => s.subscription?.status === 'Active').length}
                </p>
              </div>
              <CheckCircle size={48} className="text-green-300" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Trial Schools</p>
                <p className="text-4xl font-bold mt-2">
                  {schools.filter(s => s.subscription?.status === 'Trial').length}
                </p>
              </div>
              <Clock size={48} className="text-amber-300" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Revenue (PKR)</p>
                <p className="text-4xl font-bold mt-2">
                  {schools.reduce((sum, s) => sum + (s.subscription?.price || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign size={48} className="text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800">All Schools</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">School</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">City</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Modules</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {schools.map(school => (
                  <tr key={school._id} className="hover:bg-gray-50">
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
                      <span className="text-sm text-gray-600">{school.modules?.length || 0} modules</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSwitchSchool(school)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                      >
                        Open School
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'primary',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: GraduationCap,
      color: 'success',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Active Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'info',
      trend: '+3%',
      trendUp: true
    },
    {
      title: 'Pending Fees',
      value: `Rs. ${(stats?.pendingFees || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'warning',
      trend: '-8%',
      trendUp: false
    }
  ];

  const quickActions = [
    { label: 'New Inquiry', icon: UserPlus, path: '/inquiries', color: 'bg-indigo-500' },
    { label: 'View Inquiries', icon: Search, path: '/inquiries', color: 'bg-violet-500' },
    { label: 'Add Student', icon: Users, path: '/students/admit', color: 'bg-emerald-500' },
    { label: 'Add Teacher', icon: GraduationCap, path: '/teachers', color: 'bg-sky-500' },
    { label: 'Manage Fees', icon: DollarSign, path: '/fees', color: 'bg-amber-500' },
    { label: 'View Reports', icon: TrendingUp, path: '/reports', color: 'bg-rose-500' }
  ];

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isSuperAdmin && currentSchool ? currentSchool.name : `Welcome back, ${user?.firstName}!`}
          </h1>
          <p className="page-subtitle">
            {isSuperAdmin && currentSchool 
              ? `Managing ${currentSchool.name} - ${currentSchool.address?.city || ''}`
              : "Here's what's happening at your school today"}
          </p>
          {currentSchool?.phone && (
            <p className="text-sm text-slate-500 mt-1">{currentSchool.phone}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/students/admit')}
            className="btn btn-md flex items-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus size={18} />
            New Admission
          </button>
        </div>
      </div>

      <div className="grid-stats">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card stat-card card-hover p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {stat.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {stat.trend}
                    </span>
                    <span className="text-xs text-slate-400">vs last month</span>
                  </div>
                </div>
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recent Enrollments</h3>
              <button
                onClick={() => navigate('/students')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View All <ArrowRight size={16} />
              </button>
            </div>
            
            {recentStudents.length > 0 ? (
              <div className="space-y-4">
                {recentStudents.slice(0, 5).map((student, index) => (
                  <div
                    key={student._id || index}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-slate-500">{student.studentId} {student.class?.name ? `• ${student.class.name}` : ''}</p>
                      </div>
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Users size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500">No recent enrollments</p>
                <button
                  onClick={() => navigate('/students/admit')}
                  className="btn btn-primary btn-md mt-4"
                >
                  <UserPlus size={18} />
                  Add First Student
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:ring-2 hover:ring-indigo-200 transition-all group"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 text-center">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="stat-icon success">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Attendance Rate</p>
              <p className="text-2xl font-bold text-slate-900">94%</p>
            </div>
          </div>
          <div className="progress">
            <div className="progress-bar bg-emerald-500" style={{ width: '94%' }}></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="stat-icon info">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg. Grade</p>
              <p className="text-2xl font-bold text-slate-900">B+</p>
            </div>
          </div>
          <div className="progress">
            <div className="progress-bar bg-sky-500" style={{ width: '78%' }}></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="stat-icon warning">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Fee Collection</p>
              <p className="text-2xl font-bold text-slate-900">87%</p>
            </div>
          </div>
          <div className="progress">
            <div className="progress-bar bg-amber-500" style={{ width: '87%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleBasedDashboard;
