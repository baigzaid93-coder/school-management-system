import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, BookOpen, Users, Calendar, CheckCircle, Clock, AlertCircle,
  GraduationCap, Clipboard, FileText, DollarSign, TrendingUp, UserCheck
} from 'lucide-react';
import useToast from '../hooks/useToast';

function TeacherDashboard() {
  const toast = useToast();
  const { user, hasPermission } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [gradeData, setGradeData] = useState({ studentId: '', marks: '', grade: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeacherData();
  }, [user]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      
      const teacherRes = await api.get('/teachers/my-profile');
      setTeacher(teacherRes.data);
      setCourses(teacherRes.data.courses || []);
      
      const attRes = await api.get('/attendance/stats');
      setAttendance(attRes.data || []);
      
      const gradeRes = await api.get('/grades/teacher/all');
      setGrades(gradeRes.data || []);
      
    } catch (err) {
      console.error('Error loading teacher data:', err);
      try {
        const teachersRes = await api.get('/teachers');
        const myTeacher = teachersRes.data.find(t => t.email === user?.email);
        if (myTeacher) {
          setTeacher(myTeacher);
          setCourses(myTeacher.courses || []);
        }
      } catch (e) {
        console.error('Fallback error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStudents = async (courseId) => {
    try {
      // First, get the course to see if it already has students
      const courseRes = await api.get(`/courses/${courseId}`);
      const course = courseRes.data;
      
      // Use course's own students or fetch from endpoint
      const students = course.students || [];
      setSelectedCourse({ ...course, students });
      
      const attRes = await api.get(`/attendance/course/${courseId}`, {
        params: { date: attendanceDate }
      });
      const existingAtt = attRes.data || [];
      const attMap = {};
      existingAtt.forEach(a => { attMap[a.student?._id || a.student] = a.status; });
      setAttendanceRecords(attMap);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!selectedCourse?._id) return;
    setSaving(true);
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        student: studentId,
        course: selectedCourse._id,
        date: new Date(attendanceDate),
        status,
        markedBy: teacher._id
      }));
      
      await api.post('/attendance/bulk', { attendanceRecords: records });
      toast.success('Attendance saved successfully!');
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const saveGrade = async (studentId) => {
    try {
      await api.post('/grades', {
        student: studentId,
        course: selectedCourse._id,
        marks: parseFloat(gradeData.marks),
        grade: gradeData.grade,
        date: new Date()
      });
      toast.success('Grade saved successfully!');
      setGradeData({ studentId: '', marks: '', grade: '' });
    } catch (err) {
      console.error('Error saving grade:', err);
      toast.error('Error saving grade');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'attendance', label: 'Take Attendance', icon: UserCheck },
    { id: 'grades', label: 'Manage Grades', icon: GraduationCap },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teacher Portal</h1>
          <p className="text-gray-500">Welcome, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          <span className="text-sm">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="text-indigo-600" size={40} />
              </div>
              <h3 className="font-semibold text-gray-800">{teacher?.firstName} {teacher?.lastName}</h3>
              <p className="text-sm text-gray-500">{teacher?.email}</p>
            </div>
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{courses.length}</p>
                      <p className="text-sm text-gray-500">Assigned Courses</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Users className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {courses.reduce((sum, c) => sum + (c.students?.length || 0), 0)}
                      </p>
                      <p className="text-sm text-gray-500">Total Students</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Calendar className="text-yellow-600" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {courses.filter(c => c.schedule?.some(s => s.day === new Date().getDay())).length}
                      </p>
                      <p className="text-sm text-gray-500">Classes Today</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{grades.length}</p>
                      <p className="text-sm text-gray-500">Grades Recorded</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" size={20} />
                    My Courses
                  </h3>
                  <div className="space-y-3">
                    {courses.map(course => (
                      <div key={course._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{course.name}</p>
                          <p className="text-sm text-gray-500">{course.code}</p>
                        </div>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-full">
                          {course.students?.length || 0} students
                        </span>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No courses assigned yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="text-indigo-600" size={20} />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {grades.slice(0, 5).map(grade => (
                      <div key={grade._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">Grade recorded</p>
                          <p className="text-sm text-gray-500">{grade.student?.firstName} - {grade.marks}%</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(grade.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {grades.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Take Attendance</h2>
              
              <div className="flex gap-4 mb-6">
                <select
                  value={selectedCourse?._id || ''}
                  onChange={(e) => {
                    const course = courses.find(c => c._id === e.target.value);
                    setSelectedCourse(course || null);
                    if (e.target.value) loadCourseStudents(e.target.value);
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {selectedCourse?.students?.length > 0 && (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Roll No</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Student Name</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Present</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Absent</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Late</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedCourse.students?.map(student => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{student.studentId}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleMarkAttendance(student._id, 'Present')}
                                className={`w-8 h-8 rounded-full ${attendanceRecords[student._id] === 'Present' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                              >
                                <CheckCircle size={16} className="mx-auto" />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleMarkAttendance(student._id, 'Absent')}
                                className={`w-8 h-8 rounded-full ${attendanceRecords[student._id] === 'Absent' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                              >
                                <XCircle size={16} className="mx-auto" />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleMarkAttendance(student._id, 'Late')}
                                className={`w-8 h-8 rounded-full ${attendanceRecords[student._id] === 'Late' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
                              >
                                <Clock size={16} className="mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={saveAttendance}
                      disabled={saving || Object.keys(attendanceRecords).length === 0}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                  </div>
                </>
              )}

              {selectedCourse && !selectedCourse.students?.length && (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No students enrolled in this course</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Grades</h2>
              
              <div className="flex gap-4 mb-6">
                <select
                  value={selectedCourse?._id || ''}
                  onChange={(e) => {
                    const course = courses.find(c => c._id === e.target.value);
                    setSelectedCourse(course || null);
                    if (e.target.value) loadCourseStudents(e.target.value);
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {selectedCourse?.students?.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Roll No</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Student Name</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Marks (0-100)</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Grade</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedCourse.students.map(student => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{student.studentId}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Enter marks"
                              className="w-24 px-3 py-2 border rounded-lg text-center"
                              onChange={(e) => setGradeData(prev => ({ ...prev, [student._id]: e.target.value }))}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="w-24 px-3 py-2 border rounded-lg"
                              onChange={(e) => {
                                const marks = document.querySelector(`input[data-student="${student._id}"]`)?.value || 0;
                                setGradeData(prev => ({ ...prev, [`grade_${student._id}`]: e.target.value }));
                              }}
                            >
                              <option value="">Grade</option>
                              <option value="A+">A+</option>
                              <option value="A">A</option>
                              <option value="B+">B+</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="F">F</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={async () => {
                                const marksInput = selectedCourse.students.find(s => s._id === student._id);
                                const marksVal = document.querySelector(`input[data-student="${student._id}"]`)?.value;
                                const gradeVal = document.querySelector(`select[data-grade="${student._id}"]`)?.value;
                                if (!marksVal || !gradeVal) {
                                  toast.error('Please enter both marks and grade');
                                  return;
                                }
                                try {
                                  await api.post('/grades', {
                                    student: student._id,
                                    course: selectedCourse._id,
                                    marks: parseFloat(marksVal),
                                    grade: gradeVal,
                                    date: new Date()
                                  });
                                  toast.success('Grade saved successfully!');
                                } catch (err) {
                                  toast.error('Error saving grade');
                                }
                              }}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">My Profile</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher ID</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{teacher?.teacherId || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{teacher?.email || user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{teacher?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{teacher?.gender || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {teacher?.subjects?.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-600 text-sm rounded-full">{s}</span>
                    ))}
                    {!teacher?.subjects?.length && <span className="text-gray-500">No subjects assigned</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">
                    {teacher?.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">
                    {teacher?.salary ? `Rs. ${teacher.salary.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm ${teacher?.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {teacher?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function XCircle(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m15 9-6 6"></path>
      <path d="m9 9 6 6"></path>
    </svg>
  );
}

export default TeacherDashboard;
