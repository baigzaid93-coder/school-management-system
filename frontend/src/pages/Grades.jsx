import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ClipboardCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';

function Grades() {
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
    term: 'Term 1'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const [gradesRes, studentsRes, subjectsRes] = await Promise.all([
        api.get('/grades', { headers }),
        api.get('/students/all?all=true', { headers }),
        api.get('/settings/subjects', { headers })
      ]);
      
      setGrades(gradesRes.data || []);
      setStudents(studentsRes.data?.students || studentsRes.data || []);
      setCourses(subjectsRes.data || []);
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
        ...formData, 
        score: parseFloat(formData.score), 
        maxScore: parseFloat(formData.maxScore), 
        weight: parseFloat(formData.weight)
      };
      
      if (editingGrade) {
        await api.put(`/grades/${editingGrade._id}`, data, { headers });
      } else {
        await api.post('/grades', data, { headers });
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save grade');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      student: grade.student?._id || grade.student || '',
      course: grade.subject?._id || grade.subject || '',
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
      loadData();
    } catch (err) {
      alert('Failed to delete grade');
    }
  };

  const resetForm = () => {
    setEditingGrade(null);
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingGrade ? 'Edit Grade' : 'Add Grade'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select 
                  required 
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
                <select 
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Subject</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
                  <select 
                    value={formData.assessmentType}
                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {['Quiz', 'Test', 'Midterm', 'Final', 'Assignment'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select 
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {['Term 1', 'Term 2', 'Term 3', 'Final'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                  <input 
                    type="number" 
                    required 
                    step="0.01" 
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {editingGrade ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Grades;
