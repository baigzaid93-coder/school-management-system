import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp } from 'lucide-react';
import { dashboardService } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Teachers', value: stats?.totalTeachers || 0, icon: GraduationCap, color: 'bg-green-500' },
    { label: 'Active Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Pending Fees', value: stats?.pendingFees || 0, icon: DollarSign, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-500" size={20} />
            Performance Overview
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Average Grade</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-2xl font-bold">{stats?.averageGrade || 0}%</p>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats?.averageGrade || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Attendance Today</p>
              <p className="text-2xl font-bold mt-1">{stats?.attendanceToday || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Enrollments</h3>
          {stats?.recentStudents?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentStudents.map((student) => (
                <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-gray-500">{student.studentId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent enrollments</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
