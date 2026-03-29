import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/api';
import api from '../services/api';
import {
  Check, X, Eye, Edit, FileDown, Search, Filter, Clock, UserCheck, UserX,
  ChevronLeft, ChevronRight, MoreVertical, AlertCircle, Download, FileText, Plus, Save, User
} from 'lucide-react';

function AdmissionApproval() {
  const navigate = useNavigate();
  const { hasPermission, currentSchool } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [editFormData, setEditFormData] = useState({});
  const [classGrades, setClassGrades] = useState([]);

  useEffect(() => {
    loadAdmissions();
  }, [statusFilter, pagination.page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        loadAdmissions();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchClassGrades();
  }, []);

  const fetchClassGrades = async () => {
    try {
      const response = await api.get('/class-grades');
      setClassGrades(response.data || []);
    } catch (error) {
      console.error('Error fetching class grades:', error);
    }
  };

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        status: statusFilter,
        ...(search && { search })
      });
      
      const response = await studentService.getAllAdmissions(params.toString());
      setAdmissions(response.data?.students || []);
      setPagination(response.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error loading admissions:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    try {
      setProcessing(true);
      setShowApproveModal(false);
      await studentService.approve(approvingId);
      loadAdmissions();
    } catch (error) {
      console.error('Error approving admission:', error);
    } finally {
      setProcessing(false);
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    setRejectingId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return;
    
    try {
      setProcessing(true);
      setShowRejectModal(false);
      await studentService.reject(rejectingId, { reason: rejectReason });
      loadAdmissions();
    } catch (error) {
      console.error('Error rejecting admission:', error);
    } finally {
      setProcessing(false);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const viewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    const admission = student.admissionForm || {};
    setEditFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student.gender || 'Male',
      classGrade: admission.classGrade || '',
      session: admission.session || '',
      fatherName: admission.father?.fullName || student.parentName || '',
      fatherMobile: admission.father?.mobile || student.parentPhone || '',
      fatherEmail: admission.father?.email || student.parentEmail || '',
      fatherCnic: admission.father?.cnic || '',
      fatherOccupation: admission.father?.occupation || '',
      motherName: admission.mother?.fullName || '',
      motherMobile: admission.mother?.mobile || '',
      motherCnic: admission.mother?.cnic || '',
      motherOccupation: admission.mother?.occupation || '',
      address: `${admission.currentAddress?.houseNo || ''} ${admission.currentAddress?.area || ''} ${admission.currentAddress?.city || ''}`.trim(),
      postalCode: admission.currentAddress?.postalCode || '',
      admissionFee: admission.fee?.admissionFee || '',
      securityFee: admission.fee?.securityFee || '',
      monthlyTuitionFee: admission.fee?.monthlyTuitionFee || '',
      transportFee: admission.fee?.transportFee || '',
      hostelFee: admission.fee?.hostelFee || '',
      otherFee: admission.fee?.otherFee || '',
      discount: admission.fee?.discount || '',
      birthCertNo: admission.birthCertNo || '',
      bloodGroup: admission.bloodGroup || '',
      religion: admission.religion || '',
      nationality: admission.nationality || 'Pakistani',
      placeOfBirth: admission.placeOfBirth || '',
      diseaseAllergy: admission.medical?.diseaseAllergy || '',
      emergencyContact: admission.medical?.emergencyContact || '',
      photo: admission.photo || '',
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleEditChange('photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedStudent) return;
    
    try {
      setProcessing(true);
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        dateOfBirth: editFormData.dateOfBirth,
        gender: editFormData.gender,
        parentName: editFormData.fatherName,
        parentPhone: editFormData.fatherMobile,
        parentEmail: editFormData.fatherEmail,
        admissionForm: {
          ...selectedStudent.admissionForm,
          classGrade: editFormData.classGrade,
          session: editFormData.session,
          father: {
            ...selectedStudent.admissionForm?.father,
            fullName: editFormData.fatherName,
            mobile: editFormData.fatherMobile,
            email: editFormData.fatherEmail,
            cnic: editFormData.fatherCnic,
            occupation: editFormData.fatherOccupation,
          },
          mother: {
            ...selectedStudent.admissionForm?.mother,
            fullName: editFormData.motherName,
            mobile: editFormData.motherMobile,
            cnic: editFormData.motherCnic,
            occupation: editFormData.motherOccupation,
          },
          currentAddress: {
            ...selectedStudent.admissionForm?.currentAddress,
            houseNo: editFormData.address.split(',')[0] || editFormData.address,
            area: editFormData.address.split(',')[1] || '',
            city: editFormData.address.split(',')[2] || '',
            postalCode: editFormData.postalCode,
          },
          birthCertNo: editFormData.birthCertNo,
          bloodGroup: editFormData.bloodGroup,
          religion: editFormData.religion,
          nationality: editFormData.nationality,
          placeOfBirth: editFormData.placeOfBirth,
          photo: editFormData.photo,
          medical: {
            ...selectedStudent.admissionForm?.medical,
            diseaseAllergy: editFormData.diseaseAllergy,
            emergencyContact: editFormData.emergencyContact,
          },
          fee: {
            ...selectedStudent.admissionForm?.fee,
            admissionFee: editFormData.admissionFee,
            securityFee: editFormData.securityFee,
            monthlyTuitionFee: editFormData.monthlyTuitionFee,
            transportFee: editFormData.transportFee,
            hostelFee: editFormData.hostelFee,
            otherFee: editFormData.otherFee,
            discount: editFormData.discount,
          },
        }
      };
      
      await api.put(`/students/${selectedStudent._id}`, updateData);
      showToast('Admission updated successfully!');
      setShowEditModal(false);
      loadAdmissions();
    } catch (error) {
      console.error('Error updating admission:', error);
      showToast(error.response?.data?.message || 'Failed to update admission', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-700',
      Approved: 'bg-emerald-100 text-emerald-700',
      Rejected: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const downloadPDF = async (student) => {
    try {
      const response = await studentService.getAdmissionPDF(student._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Admission_Form_${student.studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      showToast('Failed to download PDF', 'error');
    }
  };

  const canApprove = hasPermission('admission:approve') || hasPermission('admission:write') || currentSchool?.isSuperAdmin;
  const canCreate = hasPermission('admission:write') || hasPermission('admission:create') || currentSchool?.isSuperAdmin;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slideIn ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admission Management</h1>
          <p className="text-slate-500 mt-1">Review and manage student admissions</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/students/admit')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm"
          >
            <Plus size={20} />
            New Admission
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="">All</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
              {pagination.total} Total
            </span>
            {statusFilter === 'Pending' && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                {admissions.filter(a => a.admissionStatus === 'Pending').length} Pending
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={18} className="inline mr-2" />
              {error}
              <button onClick={loadAdmissions} className="ml-4 underline hover:no-underline">
                Retry
              </button>
            </div>
          )}
          <table className="w-full">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <UserCheck size={48} className="text-slate-300 mb-3" />
                      <p className="font-medium">No admissions found</p>
                      <p className="text-sm text-slate-400">There are no {statusFilter.toLowerCase()} admissions</p>
                    </div>
                  </td>
                </tr>
              ) : (
                admissions.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-slate-500">ID: {student.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{student.parentName || '-'}</p>
                      <p className="text-sm text-slate-500">{student.parentPhone || student.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{student.classGrade?.name || student.admissionForm?.classGrade || '-'}</p>
                      <p className="text-sm text-slate-500">{student.admissionForm?.session || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(student.admissionStatus)}
                      {student.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1" title={student.rejectionReason}>
                          <AlertCircle size={12} className="inline mr-1" />
                          {student.rejectionReason.substring(0, 30)}...
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(student.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewDetails(student)}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {student.admissionStatus === 'Pending' && canApprove && (
                          <>
                            <button
                              onClick={() => handleApprove(student._id)}
                              disabled={processing}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(student._id)}
                              disabled={processing}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <h3 className="text-lg font-bold">Student Admission Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">Student Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</span></div>
                      <div><span className="text-slate-500">Gender:</span> <span className="font-medium">{selectedStudent.gender}</span></div>
                      <div><span className="text-slate-500">DOB:</span> <span className="font-medium">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : '-'}</span></div>
                      <div><span className="text-slate-500">Class:</span> <span className="font-medium">{selectedStudent.classGrade?.name || selectedStudent.admissionForm?.classGrade || '-'}</span></div>
                      <div><span className="text-slate-500">Session:</span> <span className="font-medium">{selectedStudent.admissionForm?.session || '-'}</span></div>
                      <div><span className="text-slate-500">Blood Group:</span> <span className="font-medium">{selectedStudent.admissionForm?.bloodGroup || '-'}</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">Parent Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Father:</span> <span className="font-medium">{selectedStudent.admissionForm?.father?.fullName || selectedStudent.parentName || '-'}</span></div>
                      <div><span className="text-slate-500">Father CNIC:</span> <span className="font-medium">{selectedStudent.admissionForm?.father?.cnic || '-'}</span></div>
                      <div><span className="text-slate-500">Mobile:</span> <span className="font-medium">{selectedStudent.admissionForm?.father?.mobile || selectedStudent.parentPhone || '-'}</span></div>
                      <div><span className="text-slate-500">Occupation:</span> <span className="font-medium">{selectedStudent.admissionForm?.father?.occupation || '-'}</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">Address</h4>
                    <p className="text-sm text-slate-600">
                      {selectedStudent.admissionForm?.currentAddress?.houseNo}, {selectedStudent.admissionForm?.currentAddress?.area}, {selectedStudent.admissionForm?.currentAddress?.city} {selectedStudent.admissionForm?.currentAddress?.postalCode}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">Fee Structure</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Admission Fee:</span></div>
                      <div className="font-medium text-right">PKR {parseInt(selectedStudent.admissionForm?.fee?.admissionFee || 0).toLocaleString()}</div>
                      <div><span className="text-slate-500">Security Fee:</span></div>
                      <div className="font-medium text-right">PKR {parseInt(selectedStudent.admissionForm?.fee?.securityFee || 0).toLocaleString()}</div>
                      <div><span className="text-slate-500">Monthly Tuition:</span></div>
                      <div className="font-medium text-right">PKR {parseInt(selectedStudent.admissionForm?.fee?.monthlyTuitionFee || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="w-24 h-24 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl font-bold text-indigo-600">
                        {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-800">{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                    <p className="text-sm text-slate-500">{selectedStudent.studentId}</p>
                    <div className="mt-2">{getStatusBadge(selectedStudent.admissionStatus)}</div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">Documents</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'birthCertificate', label: 'Birth Certificate' },
                        { key: 'fatherCnic', label: "Father's CNIC" },
                        { key: 'photos', label: 'Photos' },
                        { key: 'leavingCertificate', label: 'Leaving Certificate' }
                      ].map(doc => (
                        <div key={doc.key} className="flex items-center gap-2 text-sm">
                          {selectedStudent.admissionForm?.documents?.[doc.key] ? (
                            <Check size={16} className="text-emerald-500" />
                          ) : (
                            <X size={16} className="text-red-400" />
                          )}
                          <span className={selectedStudent.admissionForm?.documents?.[doc.key] ? 'text-slate-700' : 'text-slate-400'}>
                            {doc.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-slate-500">Applied:</span>
                        <span className="font-medium">{new Date(selectedStudent.createdAt).toLocaleString()}</span>
                      </div>
                      {selectedStudent.approvedAt && (
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-emerald-500" />
                          <span className="text-slate-500">Processed:</span>
                          <span className="font-medium">{new Date(selectedStudent.approvedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedStudent.approvedBy && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">By:</span>
                          <span className="font-medium">{selectedStudent.approvedBy.firstName} {selectedStudent.approvedBy.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                {selectedStudent.admissionStatus === 'Pending' && canApprove && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setShowDetailModal(false); handleApprove(selectedStudent._id); }}
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium"
                    >
                      <Check size={18} className="inline mr-1" /> Approve
                    </button>
                    <button
                      onClick={() => { setShowDetailModal(false); handleReject(selectedStudent._id); }}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      <X size={18} className="inline mr-1" /> Reject
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadPDF(selectedStudent)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                  <FileText size={18} className="inline mr-1" /> Download Form
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); handleEdit(selectedStudent); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  <Edit size={18} className="inline mr-1" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <h3 className="text-lg font-bold">Edit Admission</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => handleEditChange('firstName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => handleEditChange('lastName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => handleEditChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) => handleEditChange('gender', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class / Grade <span className="text-red-500">*</span></label>
                    <select
                      value={editFormData.classGrade}
                      onChange={(e) => handleEditChange('classGrade', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">Select Class</option>
                      {classGrades.map(grade => (
                        <option key={grade._id} value={grade._id}>{grade.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Session</label>
                    <input
                      type="text"
                      value={editFormData.session || ''}
                      onChange={(e) => handleEditChange('session', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Photo</label>
                  <div className="space-y-3">
                    {editFormData.photo ? (
                      <div className="relative">
                        <img 
                          src={editFormData.photo} 
                          alt="Student" 
                          className="w-full h-40 object-cover rounded-xl border-2 border-indigo-200" 
                        />
                        <button
                          type="button"
                          onClick={() => handleEditChange('photo', '')}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                        <User size={32} className="mb-2" />
                        <span className="text-sm">No Photo</span>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <div className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl text-center text-sm font-medium hover:bg-indigo-100 transition-colors">
                        {editFormData.photo ? 'Change Photo' : 'Upload Photo'}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <h4 className="text-md font-semibold text-slate-800 mt-6 mb-3">Father's Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={editFormData.fatherName}
                    onChange={(e) => handleEditChange('fatherName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Father's Mobile</label>
                  <input
                    type="text"
                    value={editFormData.fatherMobile}
                    onChange={(e) => handleEditChange('fatherMobile', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Father's CNIC</label>
                  <input
                    type="text"
                    value={editFormData.fatherCnic}
                    onChange={(e) => handleEditChange('fatherCnic', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Father's Occupation</label>
                  <input
                    type="text"
                    value={editFormData.fatherOccupation}
                    onChange={(e) => handleEditChange('fatherOccupation', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Father's Email</label>
                  <input
                    type="email"
                    value={editFormData.fatherEmail}
                    onChange={(e) => handleEditChange('fatherEmail', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <h4 className="text-md font-semibold text-slate-800 mt-6 mb-3">Address & Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={editFormData.postalCode}
                    onChange={(e) => handleEditChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContact}
                    onChange={(e) => handleEditChange('emergencyContact', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <h4 className="text-md font-semibold text-slate-800 mt-6 mb-3">Fee Structure</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admission Fee</label>
                  <input
                    type="number"
                    value={editFormData.admissionFee}
                    onChange={(e) => handleEditChange('admissionFee', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Security Fee</label>
                  <input
                    type="number"
                    value={editFormData.securityFee}
                    onChange={(e) => handleEditChange('securityFee', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Tuition</label>
                  <input
                    type="number"
                    value={editFormData.monthlyTuitionFee}
                    onChange={(e) => handleEditChange('monthlyTuitionFee', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transport Fee</label>
                  <input
                    type="number"
                    value={editFormData.transportFee}
                    onChange={(e) => handleEditChange('transportFee', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hostel Fee</label>
                  <input
                    type="number"
                    value={editFormData.hostelFee}
                    onChange={(e) => handleEditChange('hostelFee', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Other Fee</label>
                  <input
                    type="number"
                    value={editFormData.otherFee}
                    onChange={(e) => handleEditChange('otherFee', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                  <input
                    type="text"
                    value={editFormData.discount}
                    onChange={(e) => handleEditChange('discount', e.target.value)}
                    placeholder="e.g., 10% Sibling Discount"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={processing || !editFormData.firstName || !editFormData.classGrade}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center gap-2"
              >
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <X size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reject Admission</h3>
                  <p className="text-red-100 text-sm">Please provide a reason for rejection</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter the reason for rejecting this admission..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectingId(null); }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim() || processing}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Check size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Approve Admission</h3>
                  <p className="text-emerald-100 text-sm">Confirm student registration</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <p className="text-emerald-800 text-sm">
                  By approving this admission:
                </p>
                <ul className="text-emerald-700 text-sm mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check size={14} /> Student will be registered
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} /> User account will be created
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} /> Admission status will change to Approved
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowApproveModal(false); setApprovingId(null); }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdmissionApproval;
