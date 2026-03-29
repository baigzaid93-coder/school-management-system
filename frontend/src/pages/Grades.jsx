import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ClipboardCheck, AlertCircle } from 'lucide-react';
import { gradeService, studentService, courseService } from '../services/api';
import useToast from '../hooks/useToast';

function Grades() {
  const toast = useToast();
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    assessmentType: 'Test',
    score: '',
    maxScore: 100,
    weight: 1,
    term: 'Term 1',
    academicYear: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gradesRes, studentsRes, coursesRes] = await Promise.all([
        gradeService.getAll(),
        studentService.getAll(),
        courseService.getAll()
      ]);
      setGrades(gradesRes.data);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || 'Failed to load grades. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const data = { ...formData, score: parseFloat(formData.score), maxScore: parseFloat(formData.maxScore), weight: parseFloat(formData.weight), school: schoolId };
      if (editingGrade) {
        await gradeService.update(editingGrade._id, data);
      } else {
        await gradeService.create(data);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save grade');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      student: grade.student?._id || '',
      course: grade.course?._id || '',
      assessmentType: grade.assessmentType,
      score: grade.score,
      maxScore: grade.maxScore,
      weight: grade.weight,
      term: grade.term || 'Term 1',
      academicYear: grade.academicYear || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await gradeService.delete(id);
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const resetForm = () => {
    setEditingGrade(null);
    setFormData({ student: '', course: '', assessmentType: 'Test', score: '', maxScore: 100, weight: 1, term: 'Term 1', academicYear: '' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading grades...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Grades</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grades</h1>
          <p className="text-gray-500">Manage student grades and assessments</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
          <Plus size={18} /> Add Grade
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {grades.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Grades Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding the first grade record</p>
            <button onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add First Grade</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">%</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grades.map((grade) => {
                  const percentage = ((grade.score / grade.maxScore) * 100).toFixed(1);
                  return (
                    <tr key={grade._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium">{grade.student?.firstName} {grade.student?.lastName}</p>
                        <p className="text-sm text-gray-500">{grade.student?.studentId}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">{grade.course?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">{grade.assessmentType}</td>
                      <td className="px-6 py-4 text-sm">{grade.score}/{grade.maxScore}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${percentage >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(grade)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(grade._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingGrade ? 'Edit Grade' : 'Add New Grade'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select required value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Course (Optional)</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
                  <select value={formData.assessmentType}
                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {['Quiz', 'Test', 'Midterm', 'Final', 'Assignment', 'Project', 'Participation'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {['Term 1', 'Term 2', 'Term 3', 'Final'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                  <input type="number" required step="0.01" value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input type="number" required value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <input type="number" step="0.1" value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingGrade ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Grades;
