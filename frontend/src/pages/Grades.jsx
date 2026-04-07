import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ClipboardCheck, AlertCircle, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Grades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentScores, setStudentScores] = useState({});
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    assessmentType: 'Test',
    score: '',
    maxScore: 100,
    weight: 1,
    term: 'Term 1'
  });
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherClassId, setTeacherClassId] = useState(null);

  useEffect(() => { 
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const roleCode = user?.role?.code;
    if (roleCode === 'TEACHER') {
      setIsTeacher(true);
      try {
        const teacherRes = await api.get('/teachers/my-profile');
        const teacherData = teacherRes.data;
        if (teacherData.assignedClass) {
          const classId = teacherData.assignedClass._id || teacherData.assignedClass;
          setTeacherClassId(classId);
          // Load data after setting teacherClassId
          loadData(classId);
        } else {
          loadData(null);
        }
      } catch (err) {
        console.error('Error loading teacher profile:', err);
        loadData(null);
      }
    } else {
      loadData(null);
    }
  };

  const loadData = async (classId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      let studentsRes;
      
      // Use classId from parameter or state
      const classGradeId = classId || teacherClassId;
      
      if (isTeacher && classGradeId) {
        // Teachers only see their assigned class students
        studentsRes = await api.get(`/students/all?all=true&classGrade=${classGradeId}`, { headers });
      } else {
        // Admin sees all students
        studentsRes = await api.get('/students/all?all=true', { headers });
      }
      
      const [gradesRes, subjectsRes, examsRes] = await Promise.all([
        api.get('/grades', { headers }),
        api.get('/settings/subjects', { headers }),
        classGradeId ? api.get(`/exams?classGrade=${classGradeId}`, { headers }) : Promise.resolve({ data: [] })
      ]);
      
      setGrades(gradesRes.data || []);
      setStudents(studentsRes.data?.students || studentsRes.data || []);
      setCourses(subjectsRes.data || []);
      setExams(examsRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const data = { 
        student: formData.student,
        subject: formData.course || null,
        assessmentType: formData.assessmentType, 
        score: parseFloat(formData.score), 
        maxScore: parseFloat(formData.maxScore), 
        weight: parseFloat(formData.weight),
        term: formData.term
      };
      
      if (editingGrade) {
        await api.put(`/grades/${editingGrade._id}`, data, { headers });
      } else {
        await api.post('/grades', data, { headers });
      }
      
      setShowModal(false);
      resetForm();
      loadData(teacherClassId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save grade');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      student: grade.student?._id || grade.student || '',
      course: grade.subject?._id || grade.course?._id || grade.subject || grade.course || '',
      assessmentType: grade.assessmentType || 'Test',
      score: grade.score?.toString() || '',
      maxScore: grade.maxScore?.toString() || '100',
      weight: grade.weight?.toString() || '1',
      term: grade.term || 'Term 1'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      await api.delete(`/grades/${id}`, { headers });
      loadData(teacherClassId);
    } catch (err) {
      alert('Failed to delete grade');
    }
  };

  const resetForm = () => {
    setEditingGrade(null);
    setSelectedExam(null);
    setStudentScores({});
    setFormData({
      student: '',
      course: '',
      assessmentType: 'Test',
      score: '',
      maxScore: '100',
      weight: '1',
      term: 'Term 1'
    });
  };

  const handleExamSelect = (examId) => {
    const exam = exams.find(e => e._id === examId);
    setSelectedExam(exam);
    setFormData({ ...formData, maxScore: exam?.subjects?.[0]?.maxMarks || 100 });
    
    const existingScores = {};
    grades
      .filter(g => g.exam?._id === examId)
      .forEach(g => {
        existingScores[g.student?._id || g.student] = {
          score: g.score,
          maxScore: g.maxScore
        };
      });
    setStudentScores(existingScores);
  };

  const handleScoreChange = (studentId, field, value) => {
    setStudentScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleBulkSave = async () => {
    if (!selectedExam) {
      alert('Please select an exam first');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const schoolId = localStorage.getItem('currentSchoolId');
    const headers = { 'Authorization': `Bearer ${token}` };
    if (schoolId) headers['x-school-id'] = schoolId;

    try {
      for (const student of students) {
        const scoreData = studentScores[student._id];
        if (scoreData && scoreData.score !== undefined && scoreData.score !== '') {
          const score = parseFloat(scoreData.score);
          const maxScore = parseFloat(scoreData.maxScore) || selectedExam.subjects?.[0]?.maxMarks || 100;
          
          if (score > maxScore) {
            alert(`Score for ${student.firstName} ${student.lastName} cannot exceed ${maxScore}`);
            return;
          }

          const existingGrade = grades.find(g => 
            (g.student?._id === student._id || g.student === student._id) && 
            g.exam?._id === selectedExam._id
          );

          const data = {
            student: student._id,
            subject: selectedExam.subjects?.[0]?.subject?._id || null,
            exam: selectedExam._id,
            assessmentType: selectedExam.examType?.name || 'Test',
            score: score,
            maxScore: maxScore,
            weight: 1,
            term: 'Term 1'
          };

          if (existingGrade) {
            await api.put(`/grades/${existingGrade._id}`, data, { headers });
          } else {
            await api.post('/grades', data, { headers });
          }
        }
      }
      alert('Grades saved successfully!');
      setShowModal(false);
      resetForm();
      loadData(teacherClassId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save grades');
    }
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grades</h1>
          <p className="text-gray-500">Manage student grades</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Plus size={18} /> Add Grade
        </button>
      </div>

      {grades.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <ClipboardCheck size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Grades Found</h3>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Add First Grade
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grades.map((grade) => {
                const pct = grade.maxScore > 0 ? ((grade.score / grade.maxScore) * 100).toFixed(1) : 0;
                return (
                  <tr key={grade._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {grade.student?.firstName} {grade.student?.lastName}
                    </td>
                    <td className="px-4 py-3">{grade.subject?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{grade.assessmentType}</td>
                    <td className="px-4 py-3">{grade.score}/{grade.maxScore}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${pct >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleEdit(grade)} className="p-2 text-blue-600"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(grade._id)} className="p-2 text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">Enter Grades for Exam</h3>
                <p className="text-sm text-gray-500">Select an exam and enter marks for each student</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
              <select 
                value={selectedExam?._id || ''}
                onChange={(e) => handleExamSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select an Exam</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>
                    {exam.name} ({exam.classGrade?.name}) - {exam.examType?.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedExam && students.length > 0 && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Exam:</strong> {selectedExam.name} | 
                    <strong> Type:</strong> {selectedExam.examType?.name} | 
                    <strong> Max Marks:</strong> {selectedExam.subjects?.[0]?.maxMarks || 100}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obtained Marks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map(student => {
                        const scoreData = studentScores[student._id] || {};
                        const score = parseFloat(scoreData.score) || 0;
                        const maxScore = parseFloat(scoreData.maxScore) || selectedExam.subjects?.[0]?.maxMarks || 100;
                        const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : 0;
                        const hasScore = scoreData.score !== undefined && scoreData.score !== '';
                        const isInvalid = hasScore && score > maxScore;
                        
                        return (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{student.studentId || '-'}</td>
                            <td className="px-4 py-3">
                              <input 
                                type="number"
                                value={scoreData.maxScore || selectedExam.subjects?.[0]?.maxMarks || 100}
                                onChange={(e) => handleScoreChange(student._id, 'maxScore', e.target.value)}
                                className="w-20 px-2 py-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="number"
                                value={scoreData.score || ''}
                                onChange={(e) => handleScoreChange(student._id, 'score', e.target.value)}
                                className={`w-24 px-2 py-1 border rounded ${isInvalid ? 'border-red-500 bg-red-50' : ''}`}
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3">
                              {hasScore ? (
                                <span className={`px-2 py-1 rounded text-xs ${percentage >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {percentage}%
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedExam && students.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students found in this class
              </div>
            )}

            {!selectedExam && (
              <div className="text-center py-8 text-gray-500">
                Please select an exam to enter grades
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button 
                onClick={handleBulkSave}
                disabled={!selectedExam || Object.keys(studentScores).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
              >
                <Check size={18} /> Save All Grades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Grades;
