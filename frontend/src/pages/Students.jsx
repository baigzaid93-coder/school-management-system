import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit2, Trash2, X, Users, AlertCircle, Download, CreditCard, Plus, Eye, FileText, DollarSign, Phone, Mail, Calendar, BookOpen, User, UsersRound, FileDown } from 'lucide-react';
import { studentService, feeService, classGradeService } from '../services/api';
import { generateFeeVoucherPDF, generateFamilyChallanPDF, generateBulkFeeVouchersPDF } from '../utils/pdfGenerator';
import StudentIDCard from '../components/StudentIDCard';
import useToast from '../hooks/useToast';

function Students() {
  const toast = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [studentFines, setStudentFines] = useState([]);
  const [showIDCard, setShowIDCard] = useState(false);
  const [idCardStudent, setIdCardStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    familyNumber: '',
    status: 'Active',
    classGrade: '',
    section: '',
    photo: ''
  });

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      loadStudents();
    }
  }, [searchQuery]);

  const loadClasses = async () => {
    try {
      const response = await classGradeService.getAll();
      setClassGrades(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load classes');
    }
  };

  const loadSections = async (classId) => {
    if (!classId) {
      setSections([]);
      return;
    }
    try {
      const response = await classGradeService.getSections(classId);
      setSections(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load sections');
    }
  };

  const loadStudents = async (search = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentService.getAll({ search });
      const data = response.data;
      
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (Array.isArray(data?.students)) {
        setStudents(data.students);
      } else if (data?.data && Array.isArray(data.data)) {
        setStudents(data.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      setError(err.response?.data?.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadStudents(searchQuery);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const data = {
        ...formData,
        school: schoolId,
        section: formData.section || undefined
      };
      if (editingStudent) {
        await studentService.update(editingStudent._id, data);
      } else {
        await studentService.create(data);
      }
      setShowModal(false);
      resetForm();
      loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    const classId = student.classGrade?._id || student.classGrade;
    if (classId) {
      loadSections(classId);
    }
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
      gender: student.gender,
      email: student.email,
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      familyNumber: student.familyNumber || '',
      status: student.status,
      classGrade: classId || '',
      section: student.section?._id || student.section || '',
      photo: student.photo || ''
    });
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
  };

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    try {
      const response = await feeService.getByStudent(student._id);
      const allFees = response.data || [];
      const regularFees = allFees.filter(f => f.feeType !== 'Fine');
      const fines = allFees.filter(f => f.feeType === 'Fine');
      setStudentFees(regularFees);
      setStudentFines(fines);
    } catch (err) {
      console.error('Failed to load student fees:', err);
      setStudentFees([]);
      setStudentFines([]);
    }
    setShowDetailModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentService.delete(id);
      loadStudents();
      toast.success('Student deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  };

  const navigateToSOA = (type, id) => {
    setShowDetailModal(false);
    navigate(`/reports?type=soa&entity=student&id=${id}`);
  };

  const navigateToFamilySOA = (familyNumber) => {
    setShowDetailModal(false);
    navigate(`/reports?type=soa&entity=family&id=${familyNumber}`);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setSections([]);
    setFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      email: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      familyNumber: '',
      status: 'Active',
      classGrade: '',
      section: ''
    });
  };

  const handleDownloadFeeVoucher = async (fee) => {
    try {
      generateFeeVoucherPDF({
        student: { fullName: `${selectedStudent.firstName} ${selectedStudent.lastName}` },
        father: { fullName: selectedStudent.parentName },
        studentId: selectedStudent.studentId,
        classGrade: selectedStudent.class?.name || selectedStudent.classGrade?.name || '-'
      }, [fee]);
      toast.success('Voucher downloaded');
    } catch (err) {
      toast.error('Error generating voucher');
    }
  };

  const handleDownloadVoucher = async (student) => {
    try {
      let fees = [];
      try {
        const response = await feeService.getByStudent(student._id);
        fees = response.data || [];
      } catch (e) {}
      
      if (fees.length === 0) {
        fees = [
          { description: 'Registration Fee', amount: 5000, paidAmount: 0 },
          { description: 'Monthly Tuition Fee', amount: 3000, paidAmount: 0 },
          { description: 'Security Fee', amount: 2000, paidAmount: 0 },
        ];
      }
      
      generateFeeVoucherPDF({
        student: { fullName: `${student.firstName} ${student.lastName}` },
        father: { fullName: student.parentName },
        studentId: student.studentId,
        classGrade: student.class?.name || '-'
      }, fees);
    } catch (err) {
      toast.error('Error generating fee voucher');
    }
  };

  const handleDownloadFamilyChallan = async (student) => {
    try {
      if (!student.familyNumber) {
        toast.error('No family number assigned to this student');
        return;
      }
      
      const response = await studentService.getSiblings(student._id);
      const { siblings, familyNumber } = response.data;
      
      if (siblings.length <= 1) {
        toast.warning('No siblings found with the same family number');
        return;
      }
      
      generateFamilyChallanPDF({ siblings, familyNumber });
      toast.success('Family challan downloaded');
    } catch (err) {
      console.error('Error generating family challan:', err);
      toast.error('Error generating family challan');
    }
  };

  const handleDownloadCard = (student) => {
    setIdCardStudent(student);
    setShowIDCard(true);
  };

  const handleSelectAllStudents = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(students.map(s => s._id));
      setSelectAll(true);
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
    setSelectAll(false);
  };

  const handleBulkDownloadVouchers = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('Please select at least one student');
      return;
    }
    
    try {
      const feesData = [];
      
      for (const studentId of selectedStudents) {
        const student = students.find(s => s._id === studentId);
        if (!student) continue;
        
        let fees = [];
        try {
          const response = await feeService.getByStudent(studentId);
          fees = response.data || [];
        } catch (e) {
          fees = [
            { description: 'Registration Fee', amount: 5000, paidAmount: 0 },
            { description: 'Monthly Tuition Fee', amount: 3000, paidAmount: 0 },
            { description: 'Security Fee', amount: 2000, paidAmount: 0 },
          ];
        }
        
        feesData.push({
          student: {
            fullName: `${student.firstName} ${student.lastName}`,
            studentId: student.studentId,
            classGrade: student.classGrade?.name || student.class?.name || '-',
            fatherName: student.parentName,
            phone: student.parentPhone,
            familyNumber: student.familyNumber || ''
          },
          fees: fees.length > 0 ? fees : [{ description: 'Tuition Fee', amount: 5000, paidAmount: 0 }]
        });
      }
      
      await generateBulkFeeVouchersPDF(feesData);
      toast.success(`Downloaded vouchers for ${selectedStudents.length} students`);
    } catch (err) {
      console.error('Error generating bulk vouchers:', err);
      toast.error('Failed to generate bulk vouchers');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Students</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadStudents} className="btn btn-danger btn-md">Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage all student records</p>
        </div>
        <div className="flex gap-2">
          {selectedStudents.length > 0 && (
            <button onClick={handleBulkDownloadVouchers} className="btn btn-purple btn-md">
              <FileDown size={18} />
              Download Vouchers ({selectedStudents.length})
            </button>
          )}
          <button onClick={() => navigate('/students/admit')} className="btn btn-primary btn-md">
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, family number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input pl-11"
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary btn-md">Search</button>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn btn-secondary btn-md">Clear</button>
          )}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="card p-12">
          <div className="empty-state">
            <Users size={64} className="empty-state-icon" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Students Found</h3>
            <p className="text-slate-500 mb-6">No student records yet.</p>
            <button onClick={() => navigate('/students/admit')} className="btn btn-primary btn-md">
              <Plus size={18} />
              Add First Student
            </button>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAllStudents}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Family #</th>
                <th>Parent</th>
                <th>Status</th>
                <th>User Account</th>
                <th>Downloads</th>
                <th>Actions</th>
              </tr>
            </thead>
              <tbody>
              {students.map((student) => {
                const isSelected = selectedStudents.includes(student._id);
                return (
                <tr key={student._id} className={isSelected ? 'bg-blue-50' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectStudent(student._id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="font-semibold text-indigo-600">{student.studentId}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      {student.photo || student.admissionForm?.photo ? (
                        <img 
                          src={student.photo || student.admissionForm?.photo} 
                          alt={`${student.firstName} ${student.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                        />
                      ) : (
                        <div className="avatar avatar-md">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{student.gender}</td>
                  <td>
                    {student.familyNumber ? (
                      <span className="font-mono text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        {student.familyNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td>
                    <p className="font-medium">{student.parentName || 'N/A'}</p>
                    <p className="text-sm text-slate-500">{student.parentPhone || ''}</p>
                  </td>
                  <td>
                    <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-slate'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    {student.userId ? (
                      <div className="flex items-center gap-2">
                        <span className={`badge ${student.userId.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {student.userId.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-slate-500">@{student.userId.username}</span>
                      </div>
                    ) : (
                      <span className="badge badge-slate">No Account</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleDownloadVoucher(student)} className="btn btn-sm btn-ghost text-purple-600">
                        <Download size={16} />
                        Voucher
                      </button>
                      {student.familyNumber && (
                        <button 
                          onClick={() => handleDownloadFamilyChallan(student)} 
                          className="btn btn-sm btn-ghost text-amber-600"
                          title="Download Family Challan"
                        >
                          <UsersRound size={16} />
                          Family
                        </button>
                      )}
                      <button onClick={() => handleDownloadCard(student)} className="btn btn-sm btn-ghost text-blue-600">
                        <CreditCard size={16} />
                        Card
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleViewStudent(student)} className="btn btn-icon btn-ghost text-indigo-600" title="View Details">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleEdit(student)} className="btn btn-icon btn-ghost text-slate-500">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(student._id)} className="btn btn-icon btn-ghost text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="flex items-center gap-6 mb-6 pb-4 border-b">
                  <div className="flex-shrink-0">
                    {formData.photo ? (
                      <div className="relative">
                        <img 
                          src={formData.photo} 
                          alt="Student" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400">
                        {formData.firstName?.[0] || '?'}{formData.lastName?.[0] || ''}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="btn btn-sm btn-outline cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <span className="flex items-center gap-2">
                        <Plus size={16} /> Upload Photo
                      </span>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Student ID</label>
                    <input type="text" required value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="input" />
                  </div>
                  <div>
                    <label className="input-label">Status</label>
                    <select value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="select">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="input-label">First Name</label>
                    <input type="text" required value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="input" />
                  </div>
                  <div>
                    <label className="input-label">Last Name</label>
                    <input type="text" required value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="input-label">Gender</label>
                    <select value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="select">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Date of Birth</label>
                    <input type="date" value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="input-label">Email</label>
                    <input type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input" />
                  </div>
                  <div>
                    <label className="input-label">Phone</label>
                    <input type="text" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="input-label">Parent Name</label>
                    <input type="text" value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="input" />
                  </div>
                  <div>
                    <label className="input-label">Parent Phone</label>
                    <input type="text" value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="input-label">Family Number</label>
                    <input type="text" value={formData.familyNumber}
                      onChange={(e) => setFormData({ ...formData, familyNumber: e.target.value })}
                      className="input" placeholder="e.g., FAM-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="input-label">Class</label>
                    <select value={formData.classGrade}
                      onChange={(e) => {
                        setFormData({ ...formData, classGrade: e.target.value, section: '' });
                        loadSections(e.target.value);
                      }}
                      className="select">
                      <option value="">Select Class</option>
                      {classGrades.map(cg => (
                        <option key={cg._id} value={cg._id}>{cg.name} ({cg.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Section</label>
                    <select value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="select"
                      disabled={!formData.classGrade}>
                      <option value="">Select Section</option>
                      {sections.map(sec => (
                        <option key={sec._id} value={sec._id}>{sec.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-md">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-md">
                  {editingStudent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '900px', width: '95vw' }}>
            <div className="modal-header">
              <h3 className="modal-title">Student Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="btn btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  {selectedStudent.photo || selectedStudent.admissionForm?.photo ? (
                    <img 
                      src={selectedStudent.photo || selectedStudent.admissionForm?.photo} 
                      alt={selectedStudent.firstName} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-600">
                      {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Student ID</label>
                      <p className="font-bold text-lg text-indigo-600">{selectedStudent.studentId}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Family #</label>
                      <p className="font-bold text-lg text-amber-600">{selectedStudent.familyNumber || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Status</label>
                      <p>
                        <span className={`badge ${selectedStudent.status === 'Active' ? 'badge-success' : 'badge-slate'}`}>
                          {selectedStudent.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Class</label>
                      <p className="font-semibold">{selectedStudent.class?.name || selectedStudent.classGrade?.name || 'N/A'}</p>
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-slate-500 uppercase">Full Name</label>
                      <p className="font-bold text-xl">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Gender</label>
                      <p>{selectedStudent.gender}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Section</label>
                      <p>{selectedStudent.section?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Date of Birth</label>
                      <p className="flex items-center gap-2">
                        <Calendar size={14} /> 
                        {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Email</label>
                      <p className="flex items-center gap-2">
                        <Mail size={14} /> {selectedStudent.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Phone</label>
                      <p className="flex items-center gap-2">
                        <Phone size={14} /> {selectedStudent.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Parent Name</label>
                      <p className="flex items-center gap-2">
                        <User size={14} /> {selectedStudent.parentName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Parent Phone</label>
                      <p>{selectedStudent.parentPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                    <DollarSign size={20} /> Fee Summary
                  </h4>
                  <div className="flex items-center gap-4">
                    {selectedStudent.familyNumber && (
                      <button
                        onClick={() => navigateToFamilySOA(selectedStudent.familyNumber)}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        View Family Statement →
                      </button>
                    )}
                    {studentFees.length > 3 && (
                      <button
                        onClick={() => navigateToSOA('student', selectedStudent._id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Statement of Account →
                      </button>
                    )}
                  </div>
                </div>
               
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-3xl font-bold text-blue-600">
                      {studentFees.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-500 uppercase mt-1">Total Amount</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                    <p className="text-3xl font-bold text-green-600">
                      {studentFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-500 uppercase mt-1">Paid</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                    <p className="text-3xl font-bold text-orange-600">
                      {studentFees.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-orange-500 uppercase mt-1">Pending</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                    <p className="text-3xl font-bold text-purple-600">{studentFees.length}</p>
                    <p className="text-sm text-purple-500 uppercase mt-1">Records</p>
                  </div>
                </div>

                {studentFees.length > 0 ? (
                  <>
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Voucher #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Paid</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Balance</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Due Date</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentFees
                            .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                            .slice(0, 3)
                            .map((fee) => (
                              <tr key={fee._id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono text-sm">{fee.voucherNumber || 'N/A'}</td>
                                <td className="px-4 py-3">{fee.feeType}</td>
                                <td className="px-4 py-3 text-right">PKR {fee.amount?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-green-600">PKR {(fee.paidAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-orange-600">PKR {(fee.amount - (fee.paidAmount || 0)).toLocaleString()}</td>
                                <td className="px-4 py-3">{new Date(fee.dueDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                    fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {fee.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleDownloadFeeVoucher(fee)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                                    title="Download Voucher"
                                  >
                                    <Download size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No fee records found for this student</p>
                  </div>
                )}

                {studentFines.length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    <h4 className="font-bold text-lg text-slate-700 flex items-center gap-2 mb-4">
                      <AlertCircle size={20} className="text-red-500" /> Fines
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                        <p className="text-2xl font-bold text-red-600">
                          {studentFines.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-red-500 uppercase mt-1">Total Fines</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                        <p className="text-2xl font-bold text-green-600">
                          {studentFines.reduce((sum, f) => sum + (f.paidAmount || 0), 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-green-500 uppercase mt-1">Paid</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                        <p className="text-2xl font-bold text-purple-600">{studentFines.length}</p>
                        <p className="text-sm text-purple-500 uppercase mt-1">Fine Records</p>
                      </div>
                    </div>
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">Voucher #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">Fine Type</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-red-600 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">Date</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {studentFines
                            .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                            .slice(0, 3)
                            .map((fine) => (
                              <tr key={fine._id} className="hover:bg-red-50">
                                <td className="px-4 py-3 font-mono text-sm">{fine.voucherNumber || 'N/A'}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                    {fine.fineType || 'Fine'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">PKR {fine.amount?.toLocaleString()}</td>
                                <td className="px-4 py-3">{new Date(fine.dueDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    fine.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {fine.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleDownloadFeeVoucher(fine)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                                    title="Download Voucher"
                                  >
                                    <Download size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {studentFines.length > 3 && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                        <p className="text-red-700">
                          Showing latest {3} of {studentFines.length} fine records.
                        </p>
                        <button 
                          onClick={() => navigateToSOA('student', selectedStudent._id)}
                          className="mt-2 text-red-600 hover:text-red-800 font-medium underline"
                        >
                          View Statement of Account for all fines →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => handleDownloadVoucher(selectedStudent)} className="btn btn-secondary btn-lg flex items-center gap-2">
                <Download size={18} /> Download Voucher
              </button>
              {selectedStudent.familyNumber && (
                <button 
                  onClick={() => handleDownloadFamilyChallan(selectedStudent)} 
                  className="btn btn-secondary btn-lg flex items-center gap-2 text-amber-600"
                >
                  <UsersRound size={18} /> Download Family Challan
                </button>
              )}
              <button onClick={() => handleDownloadCard(selectedStudent)} className="btn btn-secondary btn-lg flex items-center gap-2">
                <CreditCard size={18} /> Download ID Card
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedStudent); }} className="btn btn-primary btn-lg flex items-center gap-2">
                <Edit2 size={18} /> Edit Student
              </button>
            </div>
          </div>
        </div>
      )}

      {showIDCard && idCardStudent && (
        <StudentIDCard
          student={idCardStudent}
          onClose={() => setShowIDCard(false)}
        />
      )}
    </div>
  );
}

export default Students;
