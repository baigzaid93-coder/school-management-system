import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, BookOpen, AlertCircle } from 'lucide-react';
import { courseService } from '../services/api';
import useToast from '../hooks/useToast';

function Courses() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '',
    name: '',
    code: '',
    description: '',
    credits: 3,
    maxStudents: 30,
    status: 'Active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseService.getAll();
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || 'Failed to load courses. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const data = { ...formData, school: schoolId };
      if (editingCourse) {
        await courseService.update(editingCourse._id, data);
      } else {
        await courseService.create(data);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      courseId: course.courseId,
      name: course.name,
      code: course.code,
      description: course.description || '',
      credits: course.credits || 3,
      maxStudents: course.maxStudents || 30,
      status: course.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await courseService.delete(id);
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      courseId: '', name: '', code: '', description: '', credits: 3, maxStudents: 30, status: 'Active'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading courses...</p>
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
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Courses</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Courses</h1>
          <p className="text-gray-500">Manage courses and subjects</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} />
          Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Courses Found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first course</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  course.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>{course.status}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{course.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Credits:</span>
                  <span className="font-medium">{course.credits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Students:</span>
                  <span className="font-medium">{course.students?.length || 0}/{course.maxStudents}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <button onClick={() => handleEdit(course)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(course._id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course ID</label>
                  <input type="text" required value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                  <input type="text" required value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input type="number" value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingCourse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
