import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FileText, Calendar, Users, BookOpen, ClipboardCheck, Download } from 'lucide-react';
import api from '../services/api';
import useToast from '../hooks/useToast';
import ReportCardModal from '../components/ReportCardModal';

function Exams() {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [showExamModal, setShowExamModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [examMarks, setExamMarks] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    examType: '',
    classGrade: '',
    startDate: '',
    endDate: '',
    subjects: [],
    status: 'Scheduled'
  });
  const [markFormData, setMarkFormData] = useState({
    subject: '',
    maxMarks: 100
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadExamsByClass();
    }
  }, [selectedClass]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [classesRes, examTypesRes, subjectsRes] = await Promise.all([
        api.get('/class-grades'),
        api.get('/settings/exam-types'),
        api.get('/settings/subjects')
      ]);
      
      setClassGrades(Array.isArray(classesRes.data) ? classesRes.data : []);
      setExamTypes(Array.isArray(examTypesRes.data) ? examTypesRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      
      if (classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExamsByClass = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      console.log('Loading exams for class:', selectedClass);
      const response = await fetch(`/api/exams?classGrade=${selectedClass}`, { headers });
      const data = await response.json();
      console.log('Exams response:', data);
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load exams:', err);
      setExams([]);
    }
  };

  const loadStudentsByClass = async (classId) => {
    try {
      const response = await api.get('/students/all?all=true');
      const data = response.data;
      const studentsList = data.students || data || [];
      const classStudents = studentsList.filter(s => 
        s.classGrade === classId || s.classGrade?._id === classId
      );
      setStudents(classStudents);
      return classStudents;
    } catch (err) {
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingExam) {
        response = await api.put(`/exams/${editingExam._id}`, formData);
      } else {
        response = await api.post('/exams', formData);
      }
      
      if (response.status === 200 || response.status === 201) {
        setShowExamModal(false);
        resetForm();
        console.log('Exam saved:', response.data);
        await loadExamsByClass();
        toast.showToast('Exam saved successfully', 'success');
      } else {
        toast.showToast(response.data?.message || 'Failed to save exam', 'error');
      }
    } catch (err) {
      toast.showToast('Failed to save exam', 'error');
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      examType: exam.examType?._id || exam.examType,
      classGrade: exam.classGrade?._id || exam.classGrade,
      startDate: exam.startDate?.split('T')[0] || '',
      endDate: exam.endDate?.split('T')[0] || '',
      subjects: exam.subjects || [],
      status: exam.status
    });
    setShowExamModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      await fetch(`/api/exams/${id}`, { method: 'DELETE', headers });
      loadExamsByClass();
      toast.showToast('Exam deleted successfully', 'success');
    } catch (err) {
      toast.showToast('Failed to delete', 'error');
    }
  };

  const openMarksModal = async (exam) => {
    setSelectedExam(exam);
    const classStudents = await loadStudentsByClass(exam.classGrade?._id || exam.classGrade);
    
    // Fetch existing marks for this exam
    let existingMarks = [];
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const response = await fetch(`/api/marks/exam/${exam._id}`, { headers });
      if (response.ok) {
        existingMarks = await response.json();
        console.log('Existing marks loaded:', existingMarks.length);
      }
    } catch (err) {
      console.error('Failed to load existing marks:', err);
    }
    
    setExamMarks(classStudents.map(s => {
      // Find existing mark for first subject
      const firstSubject = exam.subjects?.[0]?.subject;
      const firstSubjectId = typeof firstSubject === 'object' ? firstSubject?._id : firstSubject;
      
      // Find mark by student ID (compare as strings)
      const studentId = s._id.toString();
      const existing = existingMarks.find(m => {
        const markStudentId = (m.student?._id || m.student || '').toString();
        const markSubjectId = (m.subject?._id || m.subject || '').toString();
        return markStudentId === studentId && 
               (firstSubjectId ? markSubjectId === firstSubjectId.toString() : true);
      });
      
      return {
        student: s._id,
        studentName: `${s.firstName} ${s.lastName}`,
        studentId: s.studentId,
        marksObtained: existing ? existing.marksObtained.toString() : '',
        isAbsent: existing ? existing.isAbsent : false,
        maxMarks: existing?.maxMarks || exam.subjects?.[0]?.maxMarks || 100,
        markId: existing?._id
      };
    }));
    
    setMarkFormData({
      subject: typeof exam.subjects?.[0]?.subject === 'object' 
        ? exam.subjects?.[0]?.subject?._id 
        : exam.subjects?.[0]?.subject || '',
      maxMarks: exam.subjects?.[0]?.maxMarks || 100
    });
    
    setShowMarksModal(true);
  };

  const handleSaveMarks = async () => {
    try {
      // Validate marks don't exceed max
      const maxMarks = parseFloat(markFormData.maxMarks);
      for (const mark of examMarks) {
        if (mark.marksObtained !== '' && !mark.isAbsent) {
          const marks = parseFloat(mark.marksObtained);
          if (marks > maxMarks) {
            toast.showToast(`Mark for ${mark.studentName} exceeds maximum (${maxMarks})`, 'error');
            return;
          }
        }
      }
      
      const marksToSave = examMarks
        .filter(m => m.marksObtained !== '' || m.isAbsent)
        .map(m => ({
          exam: selectedExam._id,
          student: m.student,
          subject: markFormData.subject || selectedExam.subjects?.[0]?.subject,
          classGrade: selectedClass,
          marksObtained: m.isAbsent ? 0 : parseFloat(m.marksObtained),
          maxMarks: maxMarks,
          isAbsent: m.isAbsent,
          academicYear: new Date().getFullYear().toString()
        }));

      if (marksToSave.length === 0) {
        toast.showToast('Please enter at least one mark', 'error');
        return;
      }

      await api.post('/marks/bulk', { marks: marksToSave });

      setShowMarksModal(false);
      toast.showToast('Marks saved successfully!', 'success');
    } catch (err) {
      toast.showToast('Failed to save marks', 'error');
    }
  };

  const updateMark = (index, field, value) => {
    const updated = [...examMarks];
    
    if (field === 'marksObtained') {
      const numValue = parseFloat(value);
      const maxMarks = parseFloat(markFormData.maxMarks);
      
      if (!isNaN(numValue) && numValue > maxMarks) {
        toast.showToast(`Marks cannot exceed ${maxMarks}`, 'warning');
        updated[index][field] = maxMarks.toString();
      } else {
        updated[index][field] = value;
      }
    } else {
      updated[index][field] = value;
    }
    
    if (field === 'isAbsent' && value) {
      updated[index].marksObtained = '';
    }
    setExamMarks(updated);
  };

  const markAllPresent = () => {
    setExamMarks(prev => prev.map(m => ({ ...m, marksObtained: markFormData.maxMarks, isAbsent: false })));
  };

  const resetForm = () => {
    setEditingExam(null);
    setFormData({
      name: '', examType: '', classGrade: '', startDate: '', endDate: '', subjects: [], status: 'Scheduled'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Ongoing': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const openReportCard = async (exam) => {
    setSelectedExam(exam);
    setShowReportCardModal(true);
  };

  const generateReportCard = async (studentId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const response = await fetch(`/api/marks/exam/${selectedExam._id}`, { headers });
      const marks = await response.json();
      
      const studentMarks = marks.filter(m => m.student?._id === studentId || m.student === studentId);
      
      if (studentMarks.length === 0) {
        toast.showToast('No marks found for this student', 'warning');
        return;
      }
      
      const totalMarks = studentMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
      const totalMax = studentMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
      const percentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : 0;
      
      const studentName = studentMarks[0].student?.firstName + ' ' + studentMarks[0].student?.lastName;
      
      let grade = '';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';
      else grade = 'F';
      
      const reportContent = `
        <html>
        <head>
          <title>Report Card - ${selectedExam.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .student-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { text-align: right; font-size: 18px; font-weight: bold; }
            .grade { font-size: 24px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedExam.name}</h1>
            <p>Class: ${selectedExam.classGrade?.name || 'N/A'}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="student-info">
            <h3>Student: ${studentName}</h3>
            <p>Student ID: ${studentMarks[0].student?.studentId || 'N/A'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${studentMarks.map(m => {
                const pct = m.maxMarks > 0 ? ((m.marksObtained / m.maxMarks) * 100).toFixed(1) : 0;
                return `<tr>
                  <td>${m.subject?.name || 'N/A'}</td>
                  <td>${m.marksObtained}</td>
                  <td>${m.maxMarks}</td>
                  <td>${pct}%</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <div class="summary">
            <p>Total: ${totalMarks} / ${totalMax}</p>
            <p>Percentage: ${percentage}%</p>
          </div>
          <div class="grade">
            <p>Grade: ${grade}</p>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      toast.showToast('Failed to generate report card', 'error');
    }
  };

  const printAllReportCards = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const response = await fetch(`/api/marks/exam/${selectedExam._id}`, { headers });
      const marks = await response.json();
      
      if (marks.length === 0) {
        toast.showToast('No marks found', 'warning');
        return;
      }
      
      const studentIds = [...new Set(marks.map(m => m.student?._id || m.student))];
      const studentNames = {};
      
      marks.forEach(m => {
        if (m.student?._id) {
          studentNames[m.student._id] = {
            name: `${m.student.firstName} ${m.student.lastName}`,
            studentId: m.student.studentId
          };
        }
      });
      
      let reportContent = `
        <html>
        <head>
          <title>Report Cards - ${selectedExam.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .page-break { page-break-after: always; }
            .header { text-align: center; margin-bottom: 20px; }
            .student-info { margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { text-align: right; font-weight: bold; }
            .grade { font-size: 20px; text-align: center; }
          </style>
        </head>
        <body>
      `;
      
      studentIds.forEach((studentId, index) => {
        const studentMarks = marks.filter(m => (m.student?._id || m.student) === studentId);
        const studentData = studentNames[studentId] || { name: 'N/A', studentId: 'N/A' };
        
        const totalMarks = studentMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
        const totalMax = studentMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
        const percentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : 0;
        
        let grade = '';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else grade = 'F';
        
        reportContent += `
          ${index > 0 ? '<div class="page-break"></div>' : ''}
          <div class="header">
            <h2>${selectedExam.name}</h2>
            <p>Class: ${selectedExam.classGrade?.name || 'N/A'}</p>
          </div>
          <div class="student-info">
            <h3>Student: ${studentData.name}</h3>
            <p>ID: ${studentData.studentId}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Marks</th>
                <th>Max</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${studentMarks.map(m => {
                const pct = m.maxMarks > 0 ? ((m.marksObtained / m.maxMarks) * 100).toFixed(1) : 0;
                return `<tr>
                  <td>${m.subject?.name || 'N/A'}</td>
                  <td>${m.marksObtained}</td>
                  <td>${m.maxMarks}</td>
                  <td>${pct}%</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <div class="summary">
            <p>Total: ${totalMarks} / ${totalMax} | ${percentage}% | Grade: ${grade}</p>
          </div>
        `;
      });
      
      reportContent += '</body></html>';
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      toast.showToast('Failed to generate report cards', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Examinations</h1>
          <p className="text-gray-500">Manage exams and record student marks</p>
        </div>
        <button
          onClick={() => { 
            if (!selectedClass) {
              toast.showToast('Please select a class first', 'warning');
              return;
            }
            resetForm(); 
            setFormData(prev => ({ ...prev, classGrade: selectedClass })); 
            setShowExamModal(true); 
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Create Exam
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BookOpen size={14} className="inline mr-1" /> Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-[200px]"
            >
              <option value="">Select Class</option>
              {classGrades.map(cg => (
                <option key={cg._id} value={cg._id}>{cg.name} ({cg.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Exams Scheduled</h3>
          <p className="text-gray-500 mb-4">
            {selectedClass ? 'Create an exam for this class' : 'Select a class to view exams'}
          </p>
          {selectedClass && (
            <button
              onClick={() => { resetForm(); setFormData({ ...formData, classGrade: selectedClass }); setShowExamModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Exam
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{exam.name}</h3>
                  <p className="text-sm text-gray-500">{exam.examType?.name || 'Exam'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(exam.status)}`}>
                  {exam.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen size={14} />
                  <span>{exam.classGrade?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} />
                  <span>
                    {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'N/A'}
                    {exam.endDate && ` - ${new Date(exam.endDate).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText size={14} />
                  <span>{exam.subjects?.length || 0} subjects</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <button
                  onClick={() => openMarksModal(exam)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <ClipboardCheck size={14} /> Enter Marks
                </button>
                <button
                  onClick={() => openReportCard(exam)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                  title="Report Card"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={() => handleEdit(exam)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(exam._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingExam ? 'Edit Exam' : 'Create Exam'}</h3>
              <button onClick={() => setShowExamModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mid Term, Final Exam" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Type</option>
                    {examTypes.map(et => <option key={et._id} value={et._id}>{et.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select required value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Class</option>
                    {classGrades.map(cg => <option key={cg._id} value={cg._id}>{cg.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowExamModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingExam ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMarksModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Enter Marks</h3>
                <p className="text-sm text-gray-500">
                  {selectedExam.name} - {selectedExam.classGrade?.name}
                </p>
              </div>
              <button onClick={() => setShowMarksModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select value={markFormData.subject}
                  onChange={(e) => setMarkFormData({ ...markFormData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Subject</option>
                  {selectedExam.subjects?.map(s => (
                    <option key={s._id} value={s.subject?._id || s.subject}>
                      {s.subject?.name || 'Subject'}
                    </option>
                  ))}
                  {(!selectedExam.subjects || selectedExam.subjects.length === 0) && 
                    subjects.filter(s => s.classGrades?.includes(selectedClass)).map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                <input type="number" value={markFormData.maxMarks}
                  onChange={(e) => setMarkFormData({ ...markFormData, maxMarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-24" />
              </div>
              <div className="flex items-end">
                <button onClick={markAllPresent} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                  All Present
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Max</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Marks</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {examMarks.map((mark, index) => (
                    <tr key={mark.student} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{mark.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{mark.studentId}</td>
                      <td className="px-4 py-3 text-sm">{markFormData.maxMarks}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.5"
                          max={markFormData.maxMarks}
                          value={mark.marksObtained}
                          onChange={(e) => updateMark(index, 'marksObtained', e.target.value)}
                          disabled={mark.isAbsent}
                          className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={mark.isAbsent}
                          onChange={(e) => updateMark(index, 'isAbsent', e.target.checked)}
                          className="w-5 h-5 text-red-600 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowMarksModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSaveMarks} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Marks
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportCardModal && selectedExam && (
        <ReportCardModal 
          exam={selectedExam} 
          onClose={() => setShowReportCardModal(false)} 
        />
      )}
    </div>
  );
}

export default Exams;
