import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, X, Users, AlertCircle, Eye, Phone, Mail, Calendar, Briefcase, GraduationCap, FileText, DollarSign, Download } from 'lucide-react';
import { teacherService, classGradeService, attendanceService, expenseService } from '../services/api';
import { generateExpenseVoucherPDF } from '../utils/pdfGenerator';
import useToast from '../hooks/useToast';

function Teachers() {
  const toast = useToast();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherAttendance, setTeacherAttendance] = useState({ present: 0, absent: 0, total: 0 });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherExpenses, setTeacherExpenses] = useState({ salary: [], summary: null, deductions: [], totalDeductions: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    teacherId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    phone: '',
    subjects: '',
    salary: '',
    status: 'Active',
    assignedClass: '',
    photo: '',
    designation: '',
    qualification: ''
  });

  useEffect(() => {
    loadTeachers();
    loadClasses();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      loadTeachers();
    }
  }, [searchQuery]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleView = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
    setTeacherExpenses({ salary: [], summary: null });
    try {
      const presentRes = await attendanceService.getByTeacher(teacher._id, { status: 'Present' });
      const absentRes = await attendanceService.getByTeacher(teacher._id, { status: 'Absent' });
      const totalRes = await attendanceService.getByTeacher(teacher._id);
      setTeacherAttendance({
        present: presentRes.data?.length || 0,
        absent: absentRes.data?.length || 0,
        total: totalRes.data?.length || 0
      });

      const summaryRes = await expenseService.getTeacherSummary(teacher._id);
      const latestRes = await expenseService.getByTeacher(teacher._id);
      const allTeacherExpenses = latestRes.data || [];
      const salaryVouchers = allTeacherExpenses.filter(e => 
        e.category === 'Salary' || e.category === 'Advance Salary'
      ).slice(0, 3) || [];
      const deductionVouchers = allTeacherExpenses.filter(e => 
        e.category === 'Deduction'
      );
      
      setTeacherExpenses({
        salary: salaryVouchers,
        summary: summaryRes.data,
        deductions: deductionVouchers,
        totalDeductions: deductionVouchers.reduce((sum, d) => sum + d.amount, 0)
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setTeacherAttendance({ present: 0, absent: 0, total: 0 });
    }
  };

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teacherService.getAll();
      setTeachers(response.data);
    } catch (err) {
      console.error('Error loading teachers:', err);
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classGradeService.getAll();
      setClassGrades(response.data);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTeachers();
      return;
    }
    try {
      setLoading(true);
      const response = await teacherService.getAll({ search: searchQuery });
      setTeachers(response.data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSOA = (type, id) => {
    setShowDetailModal(false);
    navigate(`/reports?type=soa&entity=teacher&id=${id}`);
  };

  const handleDownloadVoucher = async (voucher) => {
    try {
      await generateExpenseVoucherPDF(voucher, selectedTeacher);
      toast.success('Voucher downloaded');
    } catch (err) {
      toast.error('Error downloading voucher');
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : '',
      gender: teacher.gender || 'Male',
      email: teacher.email,
      phone: teacher.phone,
      subjects: teacher.subjects?.join(', ') || '',
      salary: teacher.salary || '',
      status: teacher.status || 'Active',
      assignedClass: teacher.assignedClass?._id || teacher.assignedClass || '',
      photo: teacher.photo || '',
      designation: teacher.designation || '',
      qualification: teacher.qualification || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await teacherService.delete(id);
      toast.success('Teacher deleted successfully');
      loadTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete teacher');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      if (editingTeacher) {
        await teacherService.update(editingTeacher._id, data);
        toast.success('Teacher updated successfully');
      } else {
        await teacherService.create(data);
        toast.success('Teacher created successfully');
      }
      setShowModal(false);
      resetForm();
      loadTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      teacherId: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      email: '',
      phone: '',
      subjects: '',
      salary: '',
      status: 'Active',
      assignedClass: '',
      photo: '',
      designation: '',
      qualification: ''
    });
    setEditingTeacher(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading teachers...</p>
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
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Teachers</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTeachers}
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
          <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
          <p className="text-gray-500">Manage teacher records</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Clear
            </button>
          )}
        </div>

        {teachers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Teachers Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first teacher</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Teacher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User Account</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{teacher.teacherId}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{teacher.firstName} {teacher.lastName}</p>
                        <p className="text-sm text-gray-500">{teacher.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects?.map((subject, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        teacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {teacher.userId ? (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            teacher.userId.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {teacher.userId.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">@{teacher.userId.username}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                          No Account
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleView(teacher)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(teacher)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(teacher._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2 overflow-hidden border-2 border-gray-300">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={40} className="text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-blue-600 hover:text-blue-700">Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher ID</label>
                  <input type="text" required value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" required value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" required value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (comma-separated)</label>
                  <input type="text" value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Math, Science, English" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input type="number" value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Class (Optional)</label>
                  <select value={formData.assignedClass}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">No Class Assigned</option>
                    {classGrades.map(cg => (
                      <option key={cg._id} value={cg._id}>{cg.name} ({cg.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingTeacher ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Teacher Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-200">
                  {selectedTeacher.photo ? (
                    <img src={selectedTeacher.photo} alt="Teacher" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedTeacher.firstName?.[0]}{selectedTeacher.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{selectedTeacher.firstName} {selectedTeacher.lastName}</h4>
                  <p className="text-gray-500">{selectedTeacher.teacherId}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                    selectedTeacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedTeacher.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span className="text-sm">{selectedTeacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span className="text-sm">{selectedTeacher.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span className="text-sm">DOB: {selectedTeacher.dateOfBirth ? new Date(selectedTeacher.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase size={16} />
                  <span className="text-sm">Salary: {selectedTeacher.salary ? `$${selectedTeacher.salary}` : 'N/A'}</span>
                </div>
              </div>

              {selectedTeacher.subjects?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Subjects</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map((subject, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Attendance Summary</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{teacherAttendance.present}</p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{teacherAttendance.absent}</p>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-600">{teacherAttendance.total}</p>
                    <p className="text-sm text-gray-600">Total Days</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Salary & Payments</h5>
                {teacherExpenses.summary ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-green-600">Rs.{teacherExpenses.summary.totalSalary?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-600">Total Salary</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-blue-600">Rs.{teacherExpenses.summary.totalAdvance?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-600">Total Advance</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-purple-600">{teacherExpenses.summary.salaryCount || 0}</p>
                      <p className="text-xs text-gray-600">Salary Vouchers</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-orange-600">{teacherExpenses.summary.advanceCount || 0}</p>
                      <p className="text-xs text-gray-600">Advance Vouchers</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-red-600">Rs.{teacherExpenses.totalDeductions?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-600">Deductions</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">Loading salary data...</p>
                )}
                
                {teacherExpenses.salary.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-medium text-gray-600 uppercase">Latest Vouchers</h6>
                      {(teacherExpenses.summary?.totalRecords > 0 || teacherExpenses.deductions.length > 0) && (
                        <button
                          onClick={() => navigateToSOA('teacher', selectedTeacher._id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Statement of Account →
                        </button>
                      )}
                    </div>
                    {teacherExpenses.salary.slice(0, 3).map((voucher) => (
                      <div key={voucher._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{voucher.voucherNumber}</p>
                            <p className="text-xs text-gray-500">{new Date(voucher.date).toLocaleDateString()} - {voucher.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-green-600">Rs.{voucher.amount.toLocaleString()}</p>
                          <button
                            onClick={() => handleDownloadVoucher(voucher)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                            title="Download Voucher"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(teacherExpenses.deductions?.length || 0) > 0 && (
                  <div className="mt-4 space-y-2">
                    <h6 className="text-xs font-medium text-gray-600 uppercase">Deductions</h6>
                    {teacherExpenses.deductions?.slice(0, 3).map((voucher) => (
                      <div key={voucher._id} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{voucher.voucherNumber}</p>
                            <p className="text-xs text-gray-500">{new Date(voucher.date).toLocaleDateString()} - {voucher.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-red-600">Rs.{voucher.amount.toLocaleString()}</p>
                          <button
                            onClick={() => handleDownloadVoucher(voucher)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                            title="Download Voucher"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedTeacher.userId && (
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">User Account</h5>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm"><span className="font-medium">Username:</span> @{selectedTeacher.userId.username}</p>
                    <p className="text-sm"><span className="font-medium">Status:</span> {selectedTeacher.userId.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedTeacher);
                }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
