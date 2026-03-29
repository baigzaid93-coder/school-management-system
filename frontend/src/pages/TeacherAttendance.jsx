import { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, AlertCircle, Calendar, Users, Download, Filter, Upload, FileSpreadsheet } from 'lucide-react';
import { attendanceService, teacherService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import useToast from '../hooks/useToast';

function TeacherAttendance() {
  const toast = useToast();
  const { user, hasPermission } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [bulkRecords, setBulkRecords] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    loadData(); 
    // eslint-disable-next-line
  }, [selectedDate]);

  useEffect(() => {
    calculateStats(attendance);
  }, [attendance, allTeachers]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'x-school-id': schoolId || ''
      };
      
      const [teachersRes, attendanceRes] = await Promise.all([
        fetch('http://localhost:5000/api/teachers', { headers }),
        fetch(`http://localhost:5000/api/attendance?attendeeType=teacher`, { headers })
      ]);
      
      if (!teachersRes.ok) {
        const errData = await teachersRes.json();
        console.error('Teachers API error:', errData);
        throw new Error(errData.message || 'Failed to load teachers');
      }
      
      if (!attendanceRes.ok) {
        const errData = await attendanceRes.json();
        console.error('Attendance API error:', errData);
        throw new Error(errData.message || 'Failed to load attendance');
      }
      
      const teachersData = await teachersRes.json();
      const attendanceData = await attendanceRes.json();
      
      setAllTeachers(Array.isArray(teachersData) ? teachersData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      
      calculateStats(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records) => {
    const dateFiltered = records.filter(a => {
      const recordDate = new Date(a.date).toDateString();
      const selected = new Date(selectedDate).toDateString();
      return recordDate === selected;
    });
    
    const present = dateFiltered.filter(r => r.status === 'Present').length;
    const absent = dateFiltered.filter(r => r.status === 'Absent').length;
    const late = dateFiltered.filter(r => r.status === 'Late').length;
    const total = allTeachers.length;
    setStats({
      present,
      absent,
      late,
      total
    });
  };

  const getTeachers = () => {
    return allTeachers.map(teacher => {
      const record = attendance.find(r => {
        const recordDate = new Date(r.date).toDateString();
        const selected = new Date(selectedDate).toDateString();
        if (recordDate !== selected) return false;
        
        const teacherId = r.teacher?._id?.toString() || r.teacher?.toString();
        return teacherId === teacher._id?.toString();
      });
      return {
        ...teacher,
        attendance: record || null
      };
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700 border-green-200';
      case 'Absent': return 'bg-red-100 text-red-700 border-red-200';
      case 'Late': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Excused': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const markAttendance = async (teacherId, status, currentStatus) => {
    if (currentStatus === status) return;
    
    if (currentStatus && currentStatus !== 'Not Marked') {
      if (!confirm(`Change attendance from "${currentStatus}" to "${status}"?`)) return;
    }
    
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const response = await fetch('http://localhost:5000/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'x-school-id': schoolId || ''
        },
        body: JSON.stringify({
          attendeeType: 'teacher',
          teacher: teacherId,
          date: selectedDate,
          status,
          school: schoolId
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setAttendance(prev => {
          const existingIndex = prev.findIndex(a => {
            const recordDate = new Date(a.date).toDateString();
            const selected = new Date(selectedDate).toDateString();
            if (recordDate !== selected) return false;
            const teacherIdField = a.teacher?._id?.toString() || a.teacher?.toString();
            return teacherIdField === teacherId;
          });
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], status };
            return updated;
          } else {
            return [...prev, result];
          }
        });
      } else {
        toast.error(result.message || 'Failed to mark attendance');
      }
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      toast.error('Failed to mark attendance');
    }
  };

  const openBulkModal = () => {
    const teachersWithStatus = getTeachers().map(t => ({
      teacherId: t._id,
      name: `${t.firstName} ${t.lastName}`,
      status: t.attendance?.status || ''
    }));
    setBulkRecords(teachersWithStatus);
    setShowBulkModal(true);
  };

  const updateBulkRecord = (index, status) => {
    setBulkRecords(prev => prev.map((r, i) => 
      i === index ? { ...r, status } : r
    ));
  };

  const saveBulkAttendance = async () => {
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const records = bulkRecords
        .filter(r => r.status)
        .map(r => ({
          attendeeType: 'teacher',
          teacher: r.teacherId,
          date: selectedDate,
          status: r.status,
          school: schoolId
        }));
      
      if (records.length === 0) {
        toast.error('Please select at least one attendance status');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'x-school-id': schoolId || ''
        },
        body: JSON.stringify({ attendanceRecords: records })
      });
      
      if (response.ok) {
        setShowBulkModal(false);
        loadData();
        toast.success('Attendance saved successfully');
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to save attendance');
      }
    } catch (err) {
      console.error('Failed to save bulk attendance:', err);
      toast.error('Failed to save attendance');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const preview = jsonData.slice(0, 10).map(row => ({
          teacherId: row.TeacherID || row.teacherId || row['Teacher ID'] || '',
          name: row.Name || row.name || row.Teacher || '',
          status: row.Status || row.status || 'Present',
          date: row.Date || row.date || selectedDate
        }));
        
        setImportPreview({
          data: jsonData,
          fileName: file.name,
          totalRows: jsonData.length
        });
        setShowImportModal(true);
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        toast.error('Failed to parse Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importFromExcel = async () => {
    if (!importPreview.data || importPreview.data.length === 0) {
      toast.error('No data to import');
      return;
    }
    
    setImporting(true);
    
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const teacherMap = {};
      allTeachers.forEach(t => {
        teacherMap[t.teacherId?.toString()] = t._id;
        teacherMap[t._id?.toString()] = t._id;
        teacherMap[`${t.firstName} ${t.lastName}`.toLowerCase()] = t._id;
      });
      
      const validRecords = [];
      const errors = [];
      
      importPreview.data.forEach((row, index) => {
        const teacherIdRaw = row.TeacherID || row.teacherId || row['Teacher ID'] || '';
        const teacherIdStr = teacherIdRaw.toString().trim();
        
        let teacherId = teacherMap[teacherIdStr];
        
        if (!teacherId) {
          const name = row.Name || row.name || row.Teacher || '';
          teacherId = teacherMap[name.toLowerCase()];
        }
        
        let status = (row.Status || row.status || 'Present').toString().trim();
        status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        
        if (!['Present', 'Absent', 'Late', 'Excused'].includes(status)) {
          status = 'Present';
        }
        
        if (teacherId) {
          validRecords.push({
            attendeeType: 'teacher',
            teacher: teacherId,
            date: selectedDate,
            status,
            school: schoolId
          });
        } else {
          errors.push(`Row ${index + 1}: Teacher not found (${teacherIdRaw || row.Name || row.name})`);
        }
      });
      
      if (errors.length > 0 && validRecords.length === 0) {
        toast.error(`Import failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`);
        setImporting(false);
        return;
      }
      
      if (errors.length > 0) {
        const proceed = confirm(`${errors.length} teachers not found. Import ${validRecords.length} valid records anyway?`);
        if (!proceed) {
          setImporting(false);
          return;
        }
      }
      
      if (validRecords.length === 0) {
        toast.error('No valid records to import');
        setImporting(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'x-school-id': schoolId || ''
        },
        body: JSON.stringify({ attendanceRecords: validRecords })
      });
      
      if (response.ok) {
        setShowImportModal(false);
        setImportPreview([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadData();
        toast.success(`Successfully imported ${validRecords.length} attendance records`);
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to import attendance');
      }
    } catch (err) {
      console.error('Failed to import attendance:', err);
      toast.error('Failed to import attendance');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { TeacherID: 'TCH001', Name: 'John Smith', Status: 'Present', Date: selectedDate },
      { TeacherID: 'TCH002', Name: 'Jane Doe', Status: 'Late', Date: selectedDate },
      { TeacherID: 'TCH003', Name: 'Bob Wilson', Status: 'Absent', Date: selectedDate }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, 'attendance_template.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teacher Attendance</h1>
          <p className="text-gray-500">Mark and manage teacher attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
            <Calendar size={18} className="text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload size={18} /> Import Excel
            </button>
            <button
              onClick={openBulkModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} /> Bulk Mark
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <Check size={24} className="text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <X size={24} className="text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            </div>
            <AlertCircle size={24} className="text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Teachers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users size={24} className="text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Teacher ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {getTeachers().map((teacher) => (
                <tr key={teacher._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{teacher.firstName} {teacher.lastName}</p>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{teacher.teacherId || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {teacher.attendance ? (
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(teacher.attendance.status)}`}>
                        {teacher.attendance.status}
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-500 border border-gray-300">
                        Not Marked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => markAttendance(teacher._id, 'Present', teacher.attendance?.status)}
                        disabled={teacher.attendance?.status === 'Present'}
                        className={`p-2 w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${
                          teacher.attendance?.status === 'Present'
                            ? 'bg-green-500 text-white border-green-500 cursor-default'
                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 cursor-pointer'
                        }`}
                        title="Present"
                        type="button"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => markAttendance(teacher._id, 'Late', teacher.attendance?.status)}
                        disabled={teacher.attendance?.status === 'Late'}
                        className={`p-2 w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${
                          teacher.attendance?.status === 'Late'
                            ? 'bg-yellow-500 text-white border-yellow-500 cursor-default'
                            : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 cursor-pointer'
                        }`}
                        title="Late"
                        type="button"
                      >
                        <AlertCircle size={18} />
                      </button>
                      <button
                        onClick={() => markAttendance(teacher._id, 'Absent', teacher.attendance?.status)}
                        disabled={teacher.attendance?.status === 'Absent'}
                        className={`p-2 w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${
                          teacher.attendance?.status === 'Absent'
                            ? 'bg-red-500 text-white border-red-500 cursor-default'
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer'
                        }`}
                        title="Absent"
                        type="button"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {getTeachers().length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No teachers found</p>
            </div>
          )}
        </div>
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bulk Mark Attendance - {selectedDate}</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Teacher</th>
                    <th className="px-4 py-2 text-center text-sm">Present</th>
                    <th className="px-4 py-2 text-center text-sm">Late</th>
                    <th className="px-4 py-2 text-center text-sm">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bulkRecords.map((record, index) => (
                    <tr key={record.teacherId}>
                      <td className="px-4 py-2">{record.name}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={`status-${index}`}
                          checked={record.status === 'Present'}
                          onChange={() => updateBulkRecord(index, 'Present')}
                          className="w-5 h-5 text-green-600"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={`status-${index}`}
                          checked={record.status === 'Late'}
                          onChange={() => updateBulkRecord(index, 'Late')}
                          className="w-5 h-5 text-yellow-600"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={`status-${index}`}
                          checked={record.status === 'Absent'}
                          onChange={() => updateBulkRecord(index, 'Absent')}
                          className="w-5 h-5 text-red-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveBulkAttendance}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet size={24} className="text-green-600" /> Import Attendance from Excel
              </h3>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            {!importPreview.data ? (
              <div className="flex-1">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Select an Excel file (.xlsx, .xls) with teacher attendance data</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700"
                  >
                    <Upload size={18} /> Choose File
                  </label>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Excel Format Requirements:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li><strong>TeacherID:</strong> Teacher's unique ID (e.g., TCH001)</li>
                    <li><strong>Name:</strong> Teacher's full name (fallback if ID not found)</li>
                    <li><strong>Status:</strong> Present, Absent, Late, or Excused</li>
                    <li><strong>Date:</strong> Date (optional, defaults to selected date)</li>
                  </ul>
                </div>
                
                <button
                  onClick={downloadTemplate}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Download size={18} /> Download Template
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-800">
                    <strong>File:</strong> {importPreview.fileName} - <strong>{importPreview.totalRows}</strong> records found
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">TeacherID</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importPreview.data.slice(0, 50).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{row.TeacherID || row.teacherId || row['Teacher ID'] || '-'}</td>
                          <td className="px-4 py-2">{row.Name || row.name || row.Teacher || '-'}</td>
                          <td className="px-4 py-2">{row.Status || row.status || 'Present'}</td>
                          <td className="px-4 py-2">{row.Date || row.date || selectedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.totalRows > 50 && (
                    <p className="p-4 text-center text-gray-500">
                      Showing first 50 of {importPreview.totalRows} records
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setImportPreview([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Choose Different File
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={importFromExcel}
                      disabled={importing}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {importing ? 'Importing...' : `Import ${importPreview.totalRows} Records`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAttendance;
