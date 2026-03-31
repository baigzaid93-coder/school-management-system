import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, BookMarked, AlertCircle, Users, BookOpen } from 'lucide-react';
import api, { classGradeService, teacherService } from '../services/api';
import useToast from '../hooks/useToast';

function Subjects() {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Theory',
    description: '',
    theoryHoursPerWeek: 0,
    hasLab: false,
    labHoursPerWeek: 0,
    isCompulsory: false,
    classGrades: []
  });
  const [assignData, setAssignData] = useState({
    classGrades: [],
    teachers: []
  });
  const [teacherSearch, setTeacherSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [filterClass]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        api.get('/settings/subjects'),
        classGradeService.getAll(),
        teacherService.getAll()
      ]);
      
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setClassGrades(Array.isArray(classesRes.data) ? classesRes.data : []);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      let url = '/settings/subjects';
      if (filterClass) {
        url += `?classGrade=${filterClass}`;
      }
      const response = await api.get(url);
      setSubjects(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load subjects');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting subject:', formData);
      
      let response;
      if (editingSubject) {
        response = await api.put(`/settings/subjects/${editingSubject._id}`, formData);
      } else {
        response = await api.post('/settings/subjects', formData);
      }
      
      console.log('Response:', response.status, response.data);
      
      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        resetForm();
        loadSubjects();
        toast.success('Subject saved successfully');
      } else {
        toast.error(result.message || 'Failed to save subject');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to save subject');
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      type: subject.type || 'Theory',
      description: subject.description || '',
      theoryHoursPerWeek: subject.theoryHoursPerWeek || 0,
      hasLab: subject.hasLab || false,
      labHoursPerWeek: subject.labHoursPerWeek || 0,
      isCompulsory: subject.isCompulsory || false,
      classGrades: subject.classGrades?.map(c => c._id || c) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/settings/subjects/${id}`);
      loadSubjects();
      toast.success('Subject deleted successfully');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openAssignModal = (subject) => {
    setSelectedSubject(subject);
    setAssignData({
      classGrades: subject.classGrades?.map(cg => cg._id || cg) || [],
      teachers: subject.teachers?.map(t => t._id || t) || []
    });
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    try {
      const response = await api.put(`/settings/subjects/${selectedSubject._id}`, assignData);
      
      if (response.status === 200 || response.status === 201) {
        setShowAssignModal(false);
        loadSubjects();
        toast.success('Assignments saved successfully');
      } else {
        toast.error(response.data?.message || 'Failed to assign');
      }
    } catch (err) {
      toast.error('Failed to assign');
    }
  };

  const toggleClass = (classId) => {
    setAssignData(prev => ({
      ...prev,
      classGrades: prev.classGrades.includes(classId)
        ? prev.classGrades.filter(id => id !== classId)
        : [...prev.classGrades, classId]
    }));
  };

  const toggleTeacher = (teacherId) => {
    setAssignData(prev => ({
      ...prev,
      teachers: prev.teachers.includes(teacherId)
        ? prev.teachers.filter(id => id !== teacherId)
        : [...prev.teachers, teacherId]
    }));
  };

  const resetForm = () => {
    setEditingSubject(null);
    setFormData({
      name: '', code: '', type: 'Theory', description: '',
      theoryHoursPerWeek: 0, hasLab: false, labHoursPerWeek: 0, isCompulsory: false, classGrades: []
    });
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
          <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
          <p className="text-gray-500">Manage subjects and assign to classes</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filter by Class:</span>
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">All Classes</option>
            {classGrades.map(cg => (
              <option key={cg._id} value={cg._id}>{cg.name} ({cg.code})</option>
            ))}
          </select>
          {filterClass && (
            <button
              onClick={() => setFilterClass('')}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <BookMarked className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Subjects Yet</h3>
          <p className="text-gray-500 mb-4">Add subjects and link them to classes</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div key={subject._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{subject.name}</h3>
                  <p className="text-sm text-gray-500">{subject.code}</p>
                </div>
                <div className="flex gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    subject.type === 'Theory' ? 'bg-blue-100 text-blue-700' : 
                    subject.type === 'Practical' ? 'bg-green-100 text-green-700' : 
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {subject.type}
                  </span>
                  {subject.isCompulsory && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                      Compulsory
                    </span>
                  )}
                </div>
              </div>
              
              {subject.description && (
                <p className="text-sm text-gray-600 mb-3">{subject.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen size={14} className="text-gray-400" />
                  <span className="text-gray-500">Classes:</span>
                  <span className="font-medium">
                    {subject.classGrades?.length || 0} assigned
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-gray-500">Teachers:</span>
                  <span className="font-medium">
                    {subject.teachers?.length || 0} assigned
                  </span>
                </div>
              </div>

              {subject.classGrades && subject.classGrades.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {subject.classGrades.slice(0, 3).map((cg) => (
                    <span key={cg._id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {cg.name}
                    </span>
                  ))}
                  {subject.classGrades.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                      +{subject.classGrades.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {subject.teachers && subject.teachers.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {subject.teachers.slice(0, 2).map((t) => (
                    <span key={t._id} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                      {t.firstName} {t.lastName}
                    </span>
                  ))}
                  {subject.teachers.length > 2 && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-500 rounded text-xs">
                      +{subject.teachers.length - 2} more
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 pt-4 border-t">
                <button
                  onClick={() => openAssignModal(subject)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium"
                >
                  <Users size={14} /> Assign
                </button>
                <button
                  onClick={() => handleEdit(subject)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(subject._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics, English"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., MATH, ENG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theory Hours/Week</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.theoryHoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, theoryHoursPerWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab Hours/Week</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.labHoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, labHoursPerWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.hasLab && formData.type !== 'Practical' && formData.type !== 'Both'}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasLab}
                    onChange={(e) => setFormData({ ...formData, hasLab: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Has Lab Component</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isCompulsory}
                    onChange={(e) => setFormData({ ...formData, isCompulsory: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Compulsory</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Classes</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {classGrades.map(cg => (
                    <label key={cg._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.classGrades.includes(cg._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, classGrades: [...formData.classGrades, cg._id] });
                          } else {
                            setFormData({ ...formData, classGrades: formData.classGrades.filter(id => id !== cg._id) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">{cg.name} ({cg.code})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingSubject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Assign to Classes & Teachers</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">{selectedSubject.name}</p>
              <p className="text-sm text-blue-600">{selectedSubject.code}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Assign to Classes</h4>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {classGrades.length === 0 ? (
                <p className="text-sm text-gray-500">No classes available. Create classes first.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {classGrades.filter(cg => 
                    cg.name.toLowerCase().includes(classSearch.toLowerCase()) ||
                    cg.code?.toLowerCase().includes(classSearch.toLowerCase())
                  ).map((cg) => (
                    <label key={cg._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignData.classGrades.includes(cg._id)}
                        onChange={() => toggleClass(cg._id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{cg.name}</p>
                        <p className="text-xs text-gray-500">Level {cg.level}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Assign Teachers</h4>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search teachers by name or email..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {teachers.length === 0 ? (
                <p className="text-sm text-gray-500">No teachers available. Add teachers first.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {teachers.filter(t =>
                    `${t.firstName} ${t.lastName}`.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                    t.email?.toLowerCase().includes(teacherSearch.toLowerCase())
                  ).map((t) => (
                    <label key={t._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignData.teachers.includes(t._id)}
                        onChange={() => toggleTeacher(t._id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-sm font-medium">
                            {t.firstName?.[0]}{t.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{t.firstName} {t.lastName}</p>
                          <p className="text-xs text-gray-500">{t.email}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssign} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
