import { useState, useEffect } from 'react';
import { Plus, Check, X, AlertCircle, Calendar, Users, Download, Filter } from 'lucide-react';
import { attendanceService, studentService, classGradeService } from '../services/api';
import useToast from '../hooks/useToast';

function Attendance() {
  const toast = useToast();
  const [attendance, setAttendance] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRecords, setBulkRecords] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsRes, classesRes] = await Promise.all([
        studentService.getAll(),
        classGradeService.getAll()
      ]);
      setAllStudents(studentsRes.data?.students || studentsRes.data || []);
      setClassGrades(classesRes.data || []);
      await loadAttendance();
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await attendanceService.getAll();
      const dateFiltered = response.data.filter(a => a.date?.startsWith(selectedDate));
      setAttendance(dateFiltered);
      calculateStats(dateFiltered);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const calculateStats = (records) => {
    const filteredRecords = getFilteredRecords(records);
    const present = filteredRecords.filter(r => r.status === 'Present').length;
    const absent = filteredRecords.filter(r => r.status === 'Absent').length;
    const late = filteredRecords.filter(r => r.status === 'Late').length;
    setStats({
      present,
      absent,
      late,
      total: filteredRecords.length
    });
  };

  const getFilteredRecords = (records) => {
    let filtered = records;
    
    if (selectedClass) {
      const classStudents = allStudents.filter(s => 
        (s.classGrade?._id === selectedClass || s.classGrade === selectedClass)
      );
      const studentIds = classStudents.map(s => s._id);
      filtered = filtered.filter(r => studentIds.includes(r.student?._id || r.student));
    }
    
    if (selectedSection) {
      const sectionStudents = allStudents.filter(s => 
        (s.section?._id === selectedSection || s.section === selectedSection)
      );
      const studentIds = sectionStudents.map(s => s._id);
      filtered = filtered.filter(r => studentIds.includes(r.student?._id || r.student));
    }
    
    return filtered;
  };

  const getStudents = () => {
    let filtered = [...allStudents];
    
    if (selectedClass) {
      filtered = filtered.filter(s => 
        s.classGrade?._id === selectedClass || s.classGrade === selectedClass
      );
    }
    
    if (selectedSection) {
      filtered = filtered.filter(s => 
        s.section?._id === selectedSection || s.section === selectedSection
      );
    }
    
    return filtered;
  };

  const getSections = () => {
    if (!selectedClass) return [];
    const classData = classGrades.find(c => c._id === selectedClass);
    return classData?.sections || [];
  };

  const handleMark = async (studentId, status) => {
    try {
      await attendanceService.mark({
        attendeeType: 'student',
        student: studentId,
        date: selectedDate,
        status
      });
      loadAttendance();
    } catch (error) {
      console.error('Mark attendance failed:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const openBulkModal = () => {
    const students = getStudents();
    setBulkRecords(students.map(s => ({ 
      student: s._id, 
      studentName: `${s.firstName} ${s.lastName}`,
      studentId: s.studentId,
      status: 'Present', 
      remarks: '' 
    })));
    setShowBulkModal(true);
  };

  const handleBulkSave = async () => {
    try {
      const records = bulkRecords.map(r => ({
        attendeeType: 'student',
        student: r.student,
        date: selectedDate,
        status: r.status,
        remarks: r.remarks
      }));
      await attendanceService.bulkMark(records);
      setShowBulkModal(false);
      loadAttendance();
    } catch (error) {
      console.error('Bulk save failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    }
  };

  const updateBulkRecord = (index, field, value) => {
    const updated = [...bulkRecords];
    updated[index][field] = value;
    setBulkRecords(updated);
  };

  useEffect(() => { 
    loadAttendance(); 
  }, [selectedDate, selectedClass, selectedSection]);

  const markAllPresent = () => {
    setBulkRecords(prev => prev.map(r => ({ ...r, status: 'Present' })));
  };

  const markAllAbsent = () => {
    setBulkRecords(prev => prev.map(r => ({ ...r, status: 'Absent' })));
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-500';
      case 'Absent': return 'bg-red-500';
      case 'Late': return 'bg-yellow-500';
      case 'Excused': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const students = getStudents();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500">Mark and manage student attendance by class</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openBulkModal} disabled={students.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50">
            <Plus size={18} /> Bulk Mark
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg"><Users className="text-green-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-xl font-bold text-green-600">{stats.present}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg"><X className="text-red-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-xl font-bold text-red-600">{stats.absent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg"><AlertCircle className="text-yellow-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Late</p>
              <p className="text-xl font-bold text-yellow-600">{stats.late}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="text-blue-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline mr-1" /> Date
            </label>
            <input type="date" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter size={14} className="inline mr-1" /> Class
            </label>
            <select value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-[160px]">
              <option value="">All Classes</option>
              {classGrades.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-[140px] disabled:opacity-50">
              <option value="">All Sections</option>
              {getSections().map(s => (
                <option key={s._id} value={s._id}>Section {s.name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => { setSelectedClass(''); setSelectedSection(''); }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
            Clear Filters
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Found</h3>
          <p className="text-gray-500">
            {selectedClass ? 'No students in selected class/section' : 'Add students first to mark attendance'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {students.length} student{students.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map((student) => {
              const record = attendance.find(a => a.student?._id === student._id || a.student === student._id);
              return (
                <div key={student._id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-gray-500">{student.studentId}</p>
                      </div>
                    </div>
                    {record && (
                      <div className={`${getStatusColor(record.status)} p-2 rounded-lg`}>
                        {record.status === 'Present' && <Check size={16} className="text-white" />}
                        {record.status === 'Absent' && <X size={16} className="text-white" />}
                        {record.status === 'Late' && <AlertCircle size={16} className="text-white" />}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {student.classGrade?.name || 'No Class'} 
                    {student.section?.name && ` - Section ${student.section.name}`}
                  </div>
                  {record ? (
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1.5 rounded text-sm font-medium ${
                        record.status === 'Present' ? 'bg-green-100 text-green-700' :
                        record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                        record.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{record.status}</span>
                      <button 
                        onClick={() => handleMark(student._id, record.status === 'Present' ? 'Absent' : 'Present')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Toggle
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleMark(student._id, 'Present')}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium">Present</button>
                      <button onClick={() => handleMark(student._id, 'Absent')}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium">Absent</button>
                      <button onClick={() => handleMark(student._id, 'Late')}
                        className="py-2 px-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium" title="Late">
                        <AlertCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Bulk Mark Attendance</h3>
                <p className="text-sm text-gray-500">
                  {selectedDate} - {students.length} students
                  {selectedClass && ` - ${classGrades.find(c => c._id === selectedClass)?.name}`}
                  {selectedSection && ` - Section ${getSections().find(s => s._id === selectedSection)?.name}`}
                </p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button onClick={markAllPresent} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
                Mark All Present
              </button>
              <button onClick={markAllAbsent} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
                Mark All Absent
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {bulkRecords.map((record, index) => (
                  <div key={record.student} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-gray-500">{record.studentId}</p>
                    </div>
                    <select value={record.status}
                      onChange={(e) => updateBulkRecord(index, 'status', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-w-[120px]">
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleBulkSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save All Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;
