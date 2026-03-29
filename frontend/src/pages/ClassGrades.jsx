import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, BookOpen, AlertCircle, ChevronRight, UserPlus, UserMinus } from 'lucide-react';
import { classGradeService, sectionService, studentService } from '../services/api';
import useToast from '../hooks/useToast';

function ClassGrades() {
  const toast = useToast();
  const [classGrades, setClassGrades] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: '',
    description: '',
    capacity: 40
  });
  const [sectionData, setSectionData] = useState({
    name: '',
    code: '',
    capacity: 40
  });

  useEffect(() => {
    loadClassGrades();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassDetails(selectedClass._id);
    }
  }, [selectedClass]);

  const loadClassGrades = async () => {
    try {
      setLoading(true);
      const response = await classGradeService.getAll();
      setClassGrades(response.data);
      if (response.data.length > 0 && !selectedClass) {
        setSelectedClass(response.data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetails = async (id) => {
    try {
      const response = await classGradeService.getById(id);
      setSelectedClass(response.data);
    } catch (err) {
      console.error('Failed to load class details:', err);
    }
  };

  const loadUnassignedStudents = async () => {
    try {
      const response = await studentService.getAll();
      const unassigned = response.data.students?.filter(s => !s.classGrade) || 
                         response.data.filter(s => !s.classGrade) || [];
      setUnassignedStudents(unassigned);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const data = { ...formData, school: schoolId };
      if (editingClass) {
        await classGradeService.update(editingClass._id, data);
      } else {
        await classGradeService.create(data);
      }
      setShowModal(false);
      resetForm();
      loadClassGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will also delete all sections.')) return;
    try {
      await classGradeService.delete(id);
      loadClassGrades();
      if (selectedClass?._id === id) setSelectedClass(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await classGradeService.updateSection(selectedClass._id, editingSection._id, sectionData);
      } else {
        await classGradeService.createSection(selectedClass._id, sectionData);
      }
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionData({ name: '', code: '', capacity: 40 });
      loadClassDetails(selectedClass._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Are you sure?')) return;
    try {
      await classGradeService.deleteSection(selectedClass._id, sectionId);
      loadClassDetails(selectedClass._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleAddStudent = async (studentId) => {
    try {
      await classGradeService.addStudent(selectedClass._id, { studentId });
      loadClassDetails(selectedClass._id);
      setShowStudentModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('Remove this student from class?')) return;
    try {
      await classGradeService.removeStudent(selectedClass._id, studentId);
      loadClassDetails(selectedClass._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({ name: '', code: '', level: '', description: '', capacity: 40 });
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
          <p className="text-gray-500">Manage classes, sections, and students</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Class
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">All Classes</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {classGrades.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No classes yet
                </div>
              ) : (
                classGrades.map((cg) => (
                  <button
                    key={cg._id}
                    onClick={() => { setSelectedClass(cg); setActiveTab('overview'); }}
                    className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                      selectedClass?._id === cg._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{cg.name}</p>
                        <p className="text-sm text-gray-500">{cg.code}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {cg.studentCount || 0} students
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          {selectedClass ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedClass.name}</h2>
                    <p className="text-gray-500">{selectedClass.code} - Level {selectedClass.level}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingClass(selectedClass);
                        setFormData({
                          name: selectedClass.name,
                          code: selectedClass.code,
                          level: selectedClass.level,
                          description: selectedClass.description || '',
                          capacity: selectedClass.capacity || 40
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedClass._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

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
                    onClick={() => setActiveTab('sections')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      activeTab === 'sections'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sections ({selectedClass.sections?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      activeTab === 'students'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Students ({selectedClass.students?.length || 0})
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{selectedClass.students?.length || 0}</p>
                          <p className="text-sm text-gray-500">Total Students</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="text-green-600" size={24} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{selectedClass.sections?.length || 0}</p>
                          <p className="text-sm text-gray-500">Sections</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="text-purple-600" size={24} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{selectedClass.capacity || 40}</p>
                          <p className="text-sm text-gray-500">Class Capacity</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'sections' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">Sections</h3>
                      <button
                        onClick={() => {
                          setEditingSection(null);
                          setSectionData({ name: '', code: '', capacity: 40 });
                          setShowSectionModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus size={16} /> Add Section
                      </button>
                    </div>
                    {selectedClass.sections?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No sections yet. Add a section to organize students.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedClass.sections?.map((section) => (
                          <div key={section._id} className="border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold text-gray-800">Section {section.name}</p>
                                <p className="text-sm text-gray-500">
                                  {section.code} | Capacity: {section.capacity} | 
                                  Students: {section.students?.length || 0}
                                  {section.teacher && ` | Teacher: ${section.teacher.firstName} ${section.teacher.lastName}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingSection(section);
                                    setSectionData({
                                      name: section.name,
                                      code: section.code,
                                      capacity: section.capacity
                                    });
                                    setShowSectionModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSection(section._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {section.students && section.students.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-gray-500 mb-2">Students in this section:</p>
                                <div className="flex flex-wrap gap-2">
                                  {section.students.map((student) => (
                                    <div key={student._id} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                                      <span className="text-sm">{student.firstName} {student.lastName}</span>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await classGradeService.removeStudentFromSection(selectedClass._id, section._id, student._id);
                                            loadClassDetails(selectedClass._id);
                                            toast.success('Student removed from section');
                                          } catch (err) {
                                            toast.error('Failed to remove student');
                                          }
                                        }}
                                        className="text-gray-400 hover:text-red-600"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'students' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">Students</h3>
                      <button
                        onClick={() => {
                          loadUnassignedStudents();
                          setShowStudentModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <UserPlus size={16} /> Add Student
                      </button>
                    </div>
                    {selectedClass.students?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No students in this class yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Section</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedClass.students?.map((student) => (
                              <tr key={student._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-blue-600">{student.studentId}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                  {student.firstName} {student.lastName}
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={student.section?._id || student.section || ''}
                                    onChange={async (e) => {
                                      try {
                                        if (e.target.value) {
                                          await classGradeService.addStudentToSection(selectedClass._id, e.target.value, student._id);
                                        }
                                        loadClassDetails(selectedClass._id);
                                        toast.success('Section assigned');
                                      } catch (err) {
                                        toast.error('Failed to assign section');
                                      }
                                    }}
                                    className="px-2 py-1 border rounded text-sm bg-gray-50"
                                  >
                                    <option value="">No Section</option>
                                    {selectedClass.sections?.map((section) => (
                                      <option key={section._id} value={section._id}>
                                        Section {section.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {student.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleRemoveStudent(student._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Remove from class"
                                  >
                                    <UserMinus size={16} />
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
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Class Selected</h3>
              <p className="text-gray-500">Select a class from the left to view details</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Class 1, Grade 5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., C1, G5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <input
                    type="number"
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1, 5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingClass ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingSection ? 'Edit Section' : 'Add Section'}</h3>
              <button onClick={() => setShowSectionModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                <input
                  type="text"
                  required
                  value={sectionData.name}
                  onChange={(e) => setSectionData({ ...sectionData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={sectionData.code}
                    onChange={(e) => setSectionData({ ...sectionData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1A, 5B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={sectionData.capacity}
                    onChange={(e) => setSectionData({ ...sectionData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowSectionModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingSection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Student to Class</h3>
              <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {unassignedStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No unassigned students available.
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedStudents.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-800">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-gray-500">{student.studentId}</p>
                      </div>
                      <button
                        onClick={() => handleAddStudent(student._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassGrades;
