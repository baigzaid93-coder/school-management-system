import { useState, useEffect } from 'react';
import { User, Users, Calendar, BookOpen, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, GraduationCap } from 'lucide-react';

function ParentPortal() {
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const parentsRes = await fetch('http://localhost:5000/api/parents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const parentsData = await parentsRes.json();
      
      const parentWithChildren = Array.isArray(parentsData) 
        ? parentsData.find(p => p.userId?.username === JSON.parse(atob(token.split('.')[1]))?.username)
        : null;
      
      if (parentWithChildren) {
        setParent(parentWithChildren);
        
        const childrenWithDetails = await Promise.all(
          (parentWithChildren.students || []).map(async (studentId) => {
            const studentRes = await fetch(`http://localhost:5000/api/students/${typeof studentId === 'object' ? studentId._id : studentId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const student = await studentRes.json();
            
            const attendanceRes = await fetch(`http://localhost:5000/api/attendance/student/${student._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const attendance = await attendanceRes.json();
            
            const gradesRes = await fetch(`http://localhost:5000/api/grades/student/${student._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const grades = await gradesRes.json();
            
            const feesRes = await fetch(`http://localhost:5000/api/fees/student/${student._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const fees = await feesRes.json();
            
            return {
              ...student,
              attendance: Array.isArray(attendance) ? attendance : (attendance.data || []),
              grades: Array.isArray(grades) ? grades : (grades.data || []),
              fees: Array.isArray(fees) ? fees : (fees.data || [])
            };
          })
        );
        
        setChildren(childrenWithDetails);
        if (childrenWithDetails.length > 0) {
          setSelectedChild(childrenWithDetails[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load parent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = (attendanceList) => {
    const total = attendanceList.length;
    const present = attendanceList.filter(a => a.status === 'Present').length;
    const absent = attendanceList.filter(a => a.status === 'Absent').length;
    const late = attendanceList.filter(a => a.status === 'Late').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    return { total, present, absent, late, percentage };
  };

  const getFeeStats = (feesList) => {
    const total = feesList.reduce((sum, f) => sum + (f.amount || 0), 0);
    const paid = feesList.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
    const pending = total - paid;
    return { total, paid, pending };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-300" size={64} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Parent Account Linked</h3>
          <p className="text-gray-500">Please contact the school administration to link your parent account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parent Portal</h1>
        <p className="text-gray-500">Welcome, {parent.firstName} {parent.lastName}</p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-300" size={64} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Children Registered</h3>
          <p className="text-gray-500">No students are linked to your account yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex gap-3 overflow-x-auto">
              {children.map((child) => (
                <button
                  key={child._id}
                  onClick={() => { setSelectedChild(child); setActiveTab('overview'); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg min-w-[200px] transition-colors ${
                    selectedChild?._id === child._id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">
                      {child.firstName?.[0]}{child.lastName?.[0]}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{child.firstName} {child.lastName}</p>
                    <p className="text-xs text-gray-500">ID: {child.studentId || 'N/A'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedChild && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="font-semibold text-gray-800">{selectedChild.firstName} {selectedChild.lastName}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Class:</span> <span className="font-medium">{selectedChild.classGrade?.name || 'Not Assigned'}</span></p>
                    <p><span className="text-gray-500">Section:</span> <span className="font-medium">{selectedChild.section?.name || 'N/A'}</span></p>
                    <p><span className="text-gray-500">Status:</span> 
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                        selectedChild.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedChild.status || 'Active'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Attendance</p>
                      <p className="text-2xl font-bold text-green-600">
                        {getAttendanceStats(selectedChild.attendance).percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-green-50 rounded p-2">
                      <p className="font-bold text-green-600">{getAttendanceStats(selectedChild.attendance).present}</p>
                      <p className="text-gray-500">Present</p>
                    </div>
                    <div className="bg-red-50 rounded p-2">
                      <p className="font-bold text-red-600">{getAttendanceStats(selectedChild.attendance).absent}</p>
                      <p className="text-gray-500">Absent</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-2">
                      <p className="font-bold text-yellow-600">{getAttendanceStats(selectedChild.attendance).late}</p>
                      <p className="text-gray-500">Late</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Average Marks</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedChild.grades.length > 0
                          ? (selectedChild.grades.reduce((sum, g) => sum + (g.marks || 0), 0) / selectedChild.grades.length).toFixed(1)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{selectedChild.grades.length} exam records</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <DollarSign size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fee Status</p>
                      <p className="text-2xl font-bold text-orange-600">
                        PKR {getFeeStats(selectedChild.fees).pending.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Paid: PKR {getFeeStats(selectedChild.fees).paid.toLocaleString()} / {getFeeStats(selectedChild.fees).total.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b">
                  <div className="flex gap-1 px-4">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                        activeTab === 'overview'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                        activeTab === 'attendance'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => setActiveTab('grades')}
                      className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                        activeTab === 'grades'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Grades
                    </button>
                    <button
                      onClick={() => setActiveTab('fees')}
                      className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                        activeTab === 'fees'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Fees
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <GraduationCap size={24} className="text-blue-600" />
                            <h3 className="font-semibold text-blue-800">Academic Performance</h3>
                          </div>
                          <p className="text-3xl font-bold text-blue-600 mb-1">
                            {selectedChild.grades.length > 0
                              ? (selectedChild.grades.reduce((sum, g) => sum + (g.marks || 0), 0) / selectedChild.grades.length).toFixed(1)
                              : 'N/A'}%
                          </p>
                          <p className="text-sm text-blue-600">Average Score</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle size={24} className="text-green-600" />
                            <h3 className="font-semibold text-green-800">Attendance Rate</h3>
                          </div>
                          <p className="text-3xl font-bold text-green-600 mb-1">
                            {getAttendanceStats(selectedChild.attendance).percentage}%
                          </p>
                          <p className="text-sm text-green-600">
                            {getAttendanceStats(selectedChild.attendance).present} days present
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign size={24} className="text-orange-600" />
                            <h3 className="font-semibold text-orange-800">Fee Dues</h3>
                          </div>
                          <p className="text-3xl font-bold text-orange-600 mb-1">
                            PKR {getFeeStats(selectedChild.fees).pending.toLocaleString()}
                          </p>
                          <p className="text-sm text-orange-600">Pending Amount</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'attendance' && (
                    <div>
                      {selectedChild.attendance.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
                          <p>No attendance records found</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {selectedChild.attendance.slice(0, 30).map((record, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-800">
                                    {new Date(record.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                      record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {record.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {record.remarks || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'grades' && (
                    <div>
                      {selectedChild.grades.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
                          <p>No grade records found</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Exam</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Marks</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Max Marks</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Percentage</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Grade</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {selectedChild.grades.map((grade, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-800">
                                    {grade.exam?.name || 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-800">
                                    {grade.subject?.name || 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                    {grade.marks || 0}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {grade.maxMarks || 100}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-800">
                                    {((grade.marks / grade.maxMarks) * 100).toFixed(1)}%
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      (grade.marks / grade.maxMarks) >= 0.9 ? 'bg-green-100 text-green-700' :
                                      (grade.marks / grade.maxMarks) >= 0.75 ? 'bg-blue-100 text-blue-700' :
                                      (grade.marks / grade.maxMarks) >= 0.60 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {grade.grade || '-'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'fees' && (
                    <div>
                      {selectedChild.fees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <DollarSign className="mx-auto mb-4 text-gray-300" size={48} />
                          <p>No fee records found</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fee Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Due Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Paid</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {selectedChild.fees.map((fee, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-800">
                                    {fee.feeType || 'Tuition Fee'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                    PKR {(fee.amount || 0).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                    PKR {(fee.paidAmount || 0).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      fee.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                      fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {fee.status || 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ParentPortal;
