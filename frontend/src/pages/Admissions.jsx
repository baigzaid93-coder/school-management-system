import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import useToast from '../hooks/useToast';
import { generateAdmissionPDF, generateFeeVoucherPDF } from '../utils/pdfGenerator';
import {
  Users, Search, Plus, Eye, Edit, Trash2, FileText, CheckCircle, XCircle,
  Clock, Calendar, User, Phone, Mail, MapPin, BookOpen, Award,
  Upload, Check, X, ChevronRight, Filter, Download, RefreshCw, UserPlus,
  MessageSquare, Send, Save, ArrowRight, Receipt, IndianRupee, Home,
  Building, Globe, Newspaper, Share2, UsersRound, Footprints, Book,
  GraduationCap, Stethoscope, Clock3, ClipboardList, Star
} from 'lucide-react';

const inquiryStatuses = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Plus },
  'follow-up': { label: 'Follow-up', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: MessageSquare },
  converted: { label: 'Converted', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: X }
};

const sourceOptions = [
  { value: 'facebook', label: 'Facebook', icon: Globe },
  { value: 'instagram', label: 'Instagram', icon: Globe },
  { value: 'google', label: 'Google Search', icon: Search },
  { value: 'website', label: 'School Website', icon: Globe },
  { value: 'newspaper', label: 'Newspaper', icon: Newspaper },
  { value: 'banner', label: 'Banner / Flex', icon: Share2 },
  { value: 'referral', label: 'Friend / Family Referral', icon: UsersRound },
  { value: 'parent', label: 'Existing Parent', icon: Users },
  { value: 'walk-in', label: 'Walk-in', icon: Footprints }
];

function Admissions() {
  const { hasPermission, user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('inquiries');
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [formData, setFormData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [converting, setConverting] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const fetchInquiries = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });
      const response = await api.get(`/admissions?${params}`);
      setInquiries(response.data.admissions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchInquiries(1);
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchTerm, statusFilter]);

  const handleNewInquiry = () => {
    setFormData(getInitialFormData());
    setModalMode('create');
    setShowModal(true);
  };

  const handleViewInquiry = async (inquiry) => {
    setSelectedInquiry(inquiry);
    setFormData(inquiry);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setFormData(inquiry);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.delete(`/admissions/${id}`);
      fetchInquiries();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error deleting inquiry', 'error');
    }
  };

  const handleConvertToAdmission = (inquiry) => {
    setSelectedInquiry(inquiry);
    setFormData(inquiry);
    setModalMode('convert');
    setShowModal(true);
  };

  const handleCloseInquiry = async (id) => {
    try {
      await api.put(`/admissions/${id}`, { 'inquiry.status': 'closed' });
      fetchInquiries();
    } catch (error) {
      showToast('Error closing inquiry', 'error');
    }
  };

  const handleSubmitForApproval = async (id) => {
    if (!window.confirm('Submit this application for Principal approval?')) return;
    try {
      setApprovalLoading(true);
      await api.post(`/admissions/${id}/submit-approval`);
      showToast('Submitted for approval successfully', 'success');
      fetchInquiries();
      setShowModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error submitting for approval', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handlePrincipalApprove = async (id) => {
    try {
      setApprovalLoading(true);
      await api.post(`/admissions/${id}/principal-approve`);
      showToast('Approved by Principal. Sent to Accounts.', 'success');
      fetchInquiries();
      setShowModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error approving', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handlePrincipalReject = async (id) => {
    const remarks = window.prompt('Enter rejection reason:');
    if (!remarks) return;
    try {
      setApprovalLoading(true);
      await api.post(`/admissions/${id}/principal-reject`, { remarks });
      showToast('Application rejected', 'warning');
      fetchInquiries();
      setShowModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error rejecting', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleAccountsApprove = async (id) => {
    const admissionFee = window.prompt('Enter Admission Fee (PKR):', '5000');
    const tuitionFee = window.prompt('Enter Monthly Tuition Fee (PKR):', '3000');
    const securityFee = window.prompt('Enter Security Fee (PKR):', '2000');
    
    if (!admissionFee || !tuitionFee || !securityFee) return;
    
    try {
      setApprovalLoading(true);
      const response = await api.post(`/admissions/${id}/accounts-approve`, {
        feeAmounts: {
          admissionFee: parseInt(admissionFee),
          monthlyTuitionFee: parseInt(tuitionFee),
          securityFee: parseInt(securityFee)
        }
      });
      showToast(`Student enrolled successfully! Student ID: ${response.data.student?.studentId}, Fees Created: ${response.data.fees?.length}`, 'success');
      fetchInquiries();
      setShowModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error approving', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleAccountsReject = async (id) => {
    const remarks = window.prompt('Enter rejection reason:');
    if (!remarks) return;
    try {
      setApprovalLoading(false);
      await api.post(`/admissions/${id}/accounts-reject`, { remarks });
      showToast('Application rejected', 'warning');
      fetchInquiries();
      setShowModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error rejecting', 'error');
    } finally {
      setApprovalLoading(true);
    }
  };

  const handleConvert = async (feeData) => {
    try {
      setConverting(true);
      const response = await api.post(`/admissions/${selectedInquiry._id}/convert`, { fee: feeData });
      
      showToast(`Success! Student "${response.data.student?.firstName} ${response.data.student?.lastName}" has been created. Student ID: ${response.data.student?.studentId}`, 'success');
      
      setShowModal(false);
      fetchInquiries();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error converting to admission', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadAdmissionPDF = (inquiry) => {
    try {
      generateAdmissionPDF(inquiry);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error generating admission form PDF', 'error');
    }
  };

  const handleDownloadFeeVoucher = async (inquiry) => {
    try {
      const admissionFee = prompt('Enter Admission Fee (PKR):', '5000');
      const tuitionFee = prompt('Enter Monthly Tuition Fee (PKR):', '3000');
      const securityFee = prompt('Enter Security Fee (PKR):', '2000');
      
      if (admissionFee && tuitionFee && securityFee) {
        generateFeeVoucherPDF(inquiry, [], {
          admissionFee: parseInt(admissionFee),
          tuitionFee: parseInt(tuitionFee),
          securityFee: parseInt(securityFee)
        });
      }
    } catch (error) {
      console.error('Error generating voucher:', error);
      showToast('Error generating fee voucher', 'error');
    }
  };

  const getInitialFormData = () => ({
    inquiry: {
      inquiryNo: `INQ-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      sessionAppliedFor: '',
      classAppliedFor: '',
      status: 'new',
      followUpDate: '',
      followUpRemarks: '',
      inquiryTakenBy: user?.firstName || '',
      counselorName: '',
      admissionTestDate: '',
      interviewDate: '',
      finalStatus: 'pending',
      remarks: ''
    },
    student: {
      fullName: '',
      gender: 'male',
      dateOfBirth: '',
      age: '',
      birthCertNo: '',
      nationality: 'Pakistani',
      religion: '',
      previousSchool: '',
      currentClass: '',
      lastExamPercentage: '',
      specialNeeds: ''
    },
    father: {
      fullName: '',
      cnic: '',
      occupation: '',
      organization: '',
      mobile: '',
      whatsapp: '',
      email: ''
    },
    mother: {
      fullName: '',
      cnic: '',
      occupation: '',
      organization: '',
      mobile: '',
      whatsapp: '',
      email: ''
    },
    primaryContact: {
      name: '',
      relation: '',
      preferredNo: '',
      preferredMethod: 'call'
    },
    address: {
      city: '',
      area: '',
      postalCode: ''
    },
    source: {
      type: '',
      referrerName: '',
      referrerContact: ''
    },
    academic: {
      desiredClass: '',
      desiredStartDate: '',
      campus: '',
      shift: 'morning',
      transportRequired: false,
      hostelRequired: false,
      booksUniformInfo: false
    },
    siblings: {
      hasSibling: false,
      siblings: [{ name: '', classGrade: '' }]
    },
    discussion: {
      parentQuery: '',
      infoProvided: {
        feeStructure: false,
        admissionProcess: false,
        testInterviewDetails: false,
        prospectus: false,
        campusTour: false,
        transportDetails: false,
        other: ''
      }
    },
    documents: {
      birthCertificate: false,
      parentCnic: false,
      previousResult: false,
      leavingCertificate: false,
      photographs: false,
      other: ''
    },
    declaration: {
      parentSignature: false,
      date: new Date().toISOString().split('T')[0]
    }
  });

  const handleFormChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const formatBForm = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  };

  const handleBirthCertChange = (value) => {
    const formatted = formatBForm(value);
    handleFormChange('student', 'birthCertNo', formatted);
  };

  const handleNestedChange = (section, subSection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: value
        }
      }
    }));
  };

  const handleCheckboxChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const data = { ...formData, school: schoolId };
      if (modalMode === 'create') {
        await api.post('/admissions/inquiry', data);
      } else {
        await api.put(`/admissions/${selectedInquiry._id}`, data);
      }
      setShowModal(false);
      fetchInquiries();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving inquiry', 'error');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inquiries</h1>
          <p className="text-gray-500">Manage student admission inquiries</p>
        </div>
        <button
          onClick={handleNewInquiry}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus size={18} /> New Inquiry
        </button>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'new', label: 'New' },
          { key: 'principal-pending', label: 'Principal Approval' },
          { key: 'accounts-pending', label: 'Accounts Approval' },
          { key: 'enrolled', label: 'Enrolled' },
          { key: 'closed', label: 'Closed' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key === 'all' ? '' : tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              (tab.key === 'all' && !statusFilter) || statusFilter === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, inquiry no..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Clock className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Search size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No inquiries found</h3>
          <p className="text-gray-500 mb-4">Click "New Inquiry" to add your first inquiry</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((inquiry) => {
            const status = inquiryStatuses[inquiry.inquiry?.status] || inquiryStatuses.new;
            const StatusIcon = status.icon;
            const studentName = inquiry.student?.fullName || `${inquiry.applicant?.firstName || ''} ${inquiry.applicant?.lastName || ''}`.trim() || 'N/A';
            const fatherName = inquiry.father?.fullName || 'N/A';
            const fatherPhone = inquiry.father?.mobile || inquiry.applicant?.contact?.phone || 'N/A';
            const fatherEmail = inquiry.father?.email || inquiry.applicant?.contact?.email || '';
            
            const studentPhoto = inquiry.applicant?.photo || inquiry.student?.photo;
            const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            
            return (
              <div key={inquiry._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        {studentPhoto ? (
                          <img 
                            src={studentPhoto} 
                            alt={studentName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">{initials}</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{studentName}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span>{inquiry.inquiryId || inquiry.inquiry?.inquiryNo}</span>
                            {inquiry.registrationNumber && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">Adm: {inquiry.registrationNumber}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(inquiry.inquiry?.date || inquiry.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.color} border`}>
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Class Applied</p>
                        <p className="font-medium text-sm">{inquiry.inquiry?.classAppliedFor || inquiry.academic?.desiredClass || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Father / Guardian</p>
                        <p className="font-medium text-sm">{fatherName}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="font-medium text-sm">{fatherPhone}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Source</p>
                        <p className="font-medium text-sm capitalize">{inquiry.source?.type?.replace('-', ' ') || inquiry.inquiry?.source || 'Direct'}</p>
                      </div>
                    </div>

                    {(inquiry.inquiry?.followUpDate || inquiry.inquiry?.remarks) && (
                      <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        {inquiry.inquiry?.followUpDate && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock size={14} />
                            <span>Follow-up: {new Date(inquiry.inquiry.followUpDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {inquiry.inquiry?.finalStatus && inquiry.inquiry.finalStatus !== 'pending' && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <ClipboardList size={14} />
                            <span className="capitalize">Status: {inquiry.inquiry.finalStatus.replace('-', ' ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lg:w-80 border-t lg:border-t-0 lg:border-l bg-gray-50 p-5 flex flex-col justify-center">
                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => handleViewInquiry(inquiry)}
                        className="flex-1 lg:flex-none px-4 py-2 bg-white border rounded-lg hover:bg-blue-50 text-blue-600 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        onClick={() => handleDownloadAdmissionPDF(inquiry)}
                        className="flex-1 lg:flex-none px-4 py-2 bg-white border rounded-lg hover:bg-purple-50 text-purple-600 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText size={16} /> Download Form
                      </button>
                      {(hasPermission('admission:write') || hasPermission('*')) && (
                        <>
                          {inquiry.applicationStatus !== 'enrolled' && inquiry.applicationStatus !== 'cancelled' && inquiry.applicationStatus !== 'rejected' && (
                            <button
                              onClick={() => handleEditInquiry(inquiry)}
                              className="flex-1 lg:flex-none px-4 py-2 bg-white border rounded-lg hover:bg-green-50 text-green-600 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <Edit size={16} /> Edit
                            </button>
                          )}
                          {inquiry.applicationStatus === 'inquiry' && (
                            <button
                              onClick={() => handleSubmitForApproval(inquiry._id)}
                              className="flex-1 lg:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <Send size={16} /> Submit for Approval
                            </button>
                          )}
                          {inquiry.applicationStatus === 'principal-pending' && hasPermission('admission:approve') && (
                            <>
                              <button
                                onClick={() => handlePrincipalApprove(inquiry._id)}
                                className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={16} /> Approve
                              </button>
                              <button
                                onClick={() => handlePrincipalReject(inquiry._id)}
                                className="flex-1 lg:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </>
                          )}
                          {inquiry.applicationStatus === 'accounts-pending' && (
                            <>
                              <button
                                onClick={() => handleAccountsApprove(inquiry._id)}
                                className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={16} /> Approve & Create Student
                              </button>
                              <button
                                onClick={() => handleAccountsReject(inquiry._id)}
                                className="flex-1 lg:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </>
                          )}
                          {inquiry.applicationStatus === 'enrolled' && (
                            <>
                              <div className="flex-1 lg:flex-none px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium text-sm text-center">
                                <CheckCircle size={16} className="inline mr-1" /> Enrolled
                              </div>
                              <button
                                onClick={() => handleDownloadFeeVoucher(inquiry)}
                                className="flex-1 lg:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <Receipt size={16} /> Download Fee Voucher
                              </button>
                            </>
                          )}
                          {(inquiry.applicationStatus === 'principal-rejected' || inquiry.applicationStatus === 'accounts-rejected') && (
                            <div className="flex-1 lg:flex-none px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-sm text-center">
                              <XCircle size={16} className="inline mr-1" /> Rejected
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {inquiry.applicationStatus !== 'enrolled' && inquiry.applicationStatus !== 'principal-rejected' && inquiry.applicationStatus !== 'accounts-rejected' && (
                      <div className="flex gap-2 mt-2">
                        {(inquiry.applicationStatus === 'inquiry') && (
                          <button
                            onClick={() => handleCloseInquiry(inquiry._id)}
                            className="flex-1 px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInquiry(inquiry._id)}
                          className="flex-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => fetchInquiries(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchInquiries(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}

      {showModal && formData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-5xl my-8 shadow-2xl">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClipboardList className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {modalMode === 'create' && 'New Admission Inquiry'}
                    {modalMode === 'view' && 'Inquiry Details'}
                    {modalMode === 'edit' && 'Edit Inquiry'}
                    {modalMode === 'convert' && 'Convert to Admission'}
                  </h2>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Inquiry #: {formData.inquiry?.inquiryNo || 'New'}</span>
                    {formData.registrationNumber ? (
                      <span className="font-semibold text-green-600">Admission #: {formData.registrationNumber}</span>
                    ) : (
                      <span className="text-gray-400 italic">Admission #: Not assigned yet</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  inquiryStatuses[formData.inquiry?.status]?.color || inquiryStatuses.new.color
                }`}>
                  {inquiryStatuses[formData.inquiry?.status]?.label || 'New'}
                </span>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <InquirySection title="1. Inquiry Information" icon={FileText}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField label="Inquiry No" value={formData.inquiry?.inquiryNo} readonly />
                        <FormField label="Admission No" value={formData.registrationNumber || 'Not assigned yet'} readonly />
                        <FormField 
                          label="Inquiry Date" 
                          type="date"
                          value={formData.inquiry?.date}
                          onChange={(v) => handleFormChange('inquiry', 'date', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Session Applied For" 
                          value={formData.inquiry?.sessionAppliedFor}
                          onChange={(v) => handleFormChange('inquiry', 'sessionAppliedFor', v)}
                          disabled={modalMode === 'view'}
                          placeholder="2024-2025"
                        />
                        <FormField 
                          label="Class Applied For" 
                          value={formData.inquiry?.classAppliedFor}
                          onChange={(v) => handleFormChange('inquiry', 'classAppliedFor', v)}
                          disabled={modalMode === 'view'}
                          placeholder="Class 1"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Inquiry Status</label>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(inquiryStatuses).map(([key, { label, icon: Icon }]) => (
                            <label key={key} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                              formData.inquiry?.status === key 
                                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}>
                              <input
                                type="radio"
                                name="inquiryStatus"
                                value={key}
                                checked={formData.inquiry?.status === key}
                                onChange={(e) => handleFormChange('inquiry', 'status', e.target.value)}
                                disabled={modalMode === 'view'}
                                className="sr-only"
                              />
                              <Icon size={14} />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </InquirySection>

                    <InquirySection title="2. Student Information" icon={GraduationCap}>
                      <div className="space-y-4">
                        <FormField 
                          label="Student Full Name" 
                          value={formData.student?.fullName}
                          onChange={(v) => handleFormChange('student', 'fullName', v)}
                          disabled={modalMode === 'view'}
                          placeholder="Enter student full name"
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                            <div className="flex gap-3">
                              {['male', 'female', 'other'].map(g => (
                                <label key={g} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                                  formData.student?.gender === g ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                                }`}>
                                  <input
                                    type="radio"
                                    name="gender"
                                    value={g}
                                    checked={formData.student?.gender === g}
                                    onChange={(e) => handleFormChange('student', 'gender', e.target.value)}
                                    disabled={modalMode === 'view'}
                                    className="sr-only"
                                  />
                                  {g.charAt(0).toUpperCase() + g.slice(1)}
                                </label>
                              ))}
                            </div>
                          </div>
                          <FormField 
                            label="Date of Birth" 
                            type="date"
                            value={formData.student?.dateOfBirth}
                            onChange={(v) => {
                              handleFormChange('student', 'dateOfBirth', v);
                              handleFormChange('student', 'age', calculateAge(v));
                            }}
                            disabled={modalMode === 'view'}
                          />
                          <FormField 
                            label="Age" 
                            value={formData.student?.age}
                            onChange={(v) => handleFormChange('student', 'age', v)}
                            disabled={modalMode === 'view'}
                            placeholder="Years"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">B-Form / Birth Certificate No</label>
                            <input
                              type="text"
                              value={formData.student?.birthCertNo || ''}
                              onChange={(e) => handleBirthCertChange(e.target.value)}
                              maxLength={15}
                              disabled={modalMode === 'view'}
                              className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                              placeholder="XXXXX-XXXXXXX-X"
                            />
                            <p className="text-xs text-gray-500 mt-1">13 digits (e.g., 12345-1234567-1)</p>
                          </div>
                          <FormField 
                            label="Nationality" 
                            value={formData.student?.nationality}
                            onChange={(v) => handleFormChange('student', 'nationality', v)}
                            disabled={modalMode === 'view'}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField 
                            label="Religion" 
                            value={formData.student?.religion}
                            onChange={(v) => handleFormChange('student', 'religion', v)}
                            disabled={modalMode === 'view'}
                          />
                          <FormField 
                            label="Special Needs / Medical Condition" 
                            value={formData.student?.specialNeeds}
                            onChange={(v) => handleFormChange('student', 'specialNeeds', v)}
                            disabled={modalMode === 'view'}
                            placeholder="If any"
                          />
                        </div>
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Previous School Information</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <FormField 
                              label="Previous School Name" 
                              value={formData.student?.previousSchool}
                              onChange={(v) => handleFormChange('student', 'previousSchool', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Current Class" 
                              value={formData.student?.currentClass}
                              onChange={(v) => handleFormChange('student', 'currentClass', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Last Exam % / Grade" 
                              value={formData.student?.lastExamPercentage}
                              onChange={(v) => handleFormChange('student', 'lastExamPercentage', v)}
                              disabled={modalMode === 'view'}
                            />
                          </div>
                        </div>
                      </div>
                    </InquirySection>

                    <InquirySection title="3. Parent / Guardian Information" icon={Users}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50/50 p-4 rounded-xl">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <User size={16} /> Father / Guardian 1
                          </h4>
                          <div className="space-y-3">
                            <FormField 
                              label="Full Name" 
                              value={formData.father?.fullName}
                              onChange={(v) => handleFormChange('father', 'fullName', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="CNIC / ID No" 
                              value={formData.father?.cnic}
                              onChange={(v) => handleFormChange('father', 'cnic', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Occupation" 
                              value={formData.father?.occupation}
                              onChange={(v) => handleFormChange('father', 'occupation', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Organization" 
                              value={formData.father?.organization}
                              onChange={(v) => handleFormChange('father', 'organization', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Mobile No" 
                              value={formData.father?.mobile}
                              onChange={(v) => handleFormChange('father', 'mobile', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="WhatsApp No" 
                              value={formData.father?.whatsapp}
                              onChange={(v) => handleFormChange('father', 'whatsapp', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Email" 
                              type="email"
                              value={formData.father?.email}
                              onChange={(v) => handleFormChange('father', 'email', v)}
                              disabled={modalMode === 'view'}
                            />
                          </div>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-xl">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <User size={16} /> Mother / Guardian 2
                          </h4>
                          <div className="space-y-3">
                            <FormField 
                              label="Full Name" 
                              value={formData.mother?.fullName}
                              onChange={(v) => handleFormChange('mother', 'fullName', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="CNIC / ID No" 
                              value={formData.mother?.cnic}
                              onChange={(v) => handleFormChange('mother', 'cnic', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Occupation" 
                              value={formData.mother?.occupation}
                              onChange={(v) => handleFormChange('mother', 'occupation', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Organization" 
                              value={formData.mother?.organization}
                              onChange={(v) => handleFormChange('mother', 'organization', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Mobile No" 
                              value={formData.mother?.mobile}
                              onChange={(v) => handleFormChange('mother', 'mobile', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="WhatsApp No" 
                              value={formData.mother?.whatsapp}
                              onChange={(v) => handleFormChange('mother', 'whatsapp', v)}
                              disabled={modalMode === 'view'}
                            />
                            <FormField 
                              label="Email" 
                              type="email"
                              value={formData.mother?.email}
                              onChange={(v) => handleFormChange('mother', 'email', v)}
                              disabled={modalMode === 'view'}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <h4 className="font-medium text-gray-800 mb-3">Primary Contact Person</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <FormField 
                            label="Name" 
                            value={formData.primaryContact?.name}
                            onChange={(v) => handleFormChange('primaryContact', 'name', v)}
                            disabled={modalMode === 'view'}
                          />
                          <FormField 
                            label="Relation" 
                            value={formData.primaryContact?.relation}
                            onChange={(v) => handleFormChange('primaryContact', 'relation', v)}
                            disabled={modalMode === 'view'}
                          />
                          <FormField 
                            label="Preferred No" 
                            value={formData.primaryContact?.preferredNo}
                            onChange={(v) => handleFormChange('primaryContact', 'preferredNo', v)}
                            disabled={modalMode === 'view'}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Method</label>
                            <select
                              className="w-full px-3 py-2 border rounded-lg bg-white"
                              value={formData.primaryContact?.preferredMethod || 'call'}
                              onChange={(e) => handleFormChange('primaryContact', 'preferredMethod', e.target.value)}
                              disabled={modalMode === 'view'}
                            >
                              <option value="call">Call</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="email">Email</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </InquirySection>

                    <InquirySection title="4. Address Details" icon={Home}>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField 
                          label="City" 
                          value={formData.address?.city}
                          onChange={(v) => handleFormChange('address', 'city', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Area" 
                          value={formData.address?.area}
                          onChange={(v) => handleFormChange('address', 'area', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Postal Code" 
                          value={formData.address?.postalCode}
                          onChange={(v) => handleFormChange('address', 'postalCode', v)}
                          disabled={modalMode === 'view'}
                        />
                      </div>
                    </InquirySection>

                    <InquirySection title="5. Inquiry Source" icon={Share2}>
                      <div className="grid grid-cols-3 gap-3">
                        {sourceOptions.map(({ value, label, icon: Icon }) => (
                          <label key={value} className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.source?.type === value 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                            <input
                              type="radio"
                              name="source"
                              value={value}
                              checked={formData.source?.type === value}
                              onChange={(e) => handleFormChange('source', 'type', e.target.value)}
                              disabled={modalMode === 'view'}
                              className="sr-only"
                            />
                            <Icon size={16} className="text-gray-400" />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                      {(formData.source?.type === 'referral' || formData.source?.type === 'parent') && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <FormField 
                            label="Referrer Name" 
                            value={formData.source?.referrerName}
                            onChange={(v) => handleFormChange('source', 'referrerName', v)}
                            disabled={modalMode === 'view'}
                          />
                          <FormField 
                            label="Referrer Contact" 
                            value={formData.source?.referrerContact}
                            onChange={(v) => handleFormChange('source', 'referrerContact', v)}
                            disabled={modalMode === 'view'}
                          />
                        </div>
                      )}
                    </InquirySection>

                    <InquirySection title="6. Academic Interest" icon={Book}>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField 
                          label="Desired Class / Grade" 
                          value={formData.academic?.desiredClass}
                          onChange={(v) => handleFormChange('academic', 'desiredClass', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Desired Start Date" 
                          type="date"
                          value={formData.academic?.desiredStartDate}
                          onChange={(v) => handleFormChange('academic', 'desiredStartDate', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Campus / Branch" 
                          value={formData.academic?.campus}
                          onChange={(v) => handleFormChange('academic', 'campus', v)}
                          disabled={modalMode === 'view'}
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Shift</label>
                          <div className="flex gap-3">
                            {['morning', 'evening'].map(shift => (
                              <label key={shift} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border cursor-pointer text-sm ${
                                formData.academic?.shift === shift ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                              }`}>
                                <input
                                  type="radio"
                                  name="shift"
                                  value={shift}
                                  checked={formData.academic?.shift === shift}
                                  onChange={(e) => handleFormChange('academic', 'shift', e.target.value)}
                                  disabled={modalMode === 'view'}
                                  className="sr-only"
                                />
                                {shift.charAt(0).toUpperCase() + shift.slice(1)}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.academic?.transportRequired}
                            onChange={(e) => handleFormChange('academic', 'transportRequired', e.target.checked)}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">Transport Required</span>
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.academic?.hostelRequired}
                            onChange={(e) => handleFormChange('academic', 'hostelRequired', e.target.checked)}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">Hostel Required</span>
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.academic?.booksUniformInfo}
                            onChange={(e) => handleFormChange('academic', 'booksUniformInfo', e.target.checked)}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">Books / Uniform Info Required</span>
                        </label>
                      </div>
                    </InquirySection>

                    <InquirySection title="7. Sibling Information" icon={Users}>
                      <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="hasSibling"
                            checked={!formData.siblings?.hasSibling}
                            onChange={() => handleFormChange('siblings', 'hasSibling', false)}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">No</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="hasSibling"
                            checked={formData.siblings?.hasSibling}
                            onChange={() => handleFormChange('siblings', 'hasSibling', true)}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <span className="text-sm text-gray-600">Any sibling currently studying in school?</span>
                      </div>
                      {formData.siblings?.hasSibling && (
                        <div className="space-y-3">
                          {[0, 1, 2].map(idx => (
                            <div key={idx} className="grid grid-cols-2 gap-4">
                              <FormField 
                                label="Sibling Name"
                                value={formData.siblings?.siblings?.[idx]?.name || ''}
                                onChange={(v) => {
                                  const siblings = [...(formData.siblings?.siblings || [{name:'',classGrade:''}])];
                                  siblings[idx] = { ...siblings[idx], name: v };
                                  handleFormChange('siblings', 'siblings', siblings);
                                }}
                                disabled={modalMode === 'view'}
                              />
                              <FormField 
                                label="Class"
                                value={formData.siblings?.siblings?.[idx]?.classGrade || ''}
                                onChange={(v) => {
                                  const siblings = [...(formData.siblings?.siblings || [{name:'',classGrade:''}])];
                                  siblings[idx] = { ...siblings[idx], classGrade: v };
                                  handleFormChange('siblings', 'siblings', siblings);
                                }}
                                disabled={modalMode === 'view'}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </InquirySection>

                    <InquirySection title="8. Discussion / Requirements" icon={MessageSquare}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Query / Notes</label>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                            value={formData.discussion?.parentQuery || ''}
                            onChange={(e) => handleFormChange('discussion', 'parentQuery', e.target.value)}
                            disabled={modalMode === 'view'}
                            placeholder="Enter parent questions or special requirements..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Information Provided</label>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { key: 'feeStructure', label: 'Fee Structure' },
                              { key: 'admissionProcess', label: 'Admission Process' },
                              { key: 'testInterviewDetails', label: 'Test / Interview Details' },
                              { key: 'prospectus', label: 'Prospectus' },
                              { key: 'campusTour', label: 'Campus Tour' },
                              { key: 'transportDetails', label: 'Transport Details' }
                            ].map(item => (
                              <label key={item.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                formData.discussion?.infoProvided?.[item.key] 
                                  ? 'bg-green-50 border-green-300 text-green-700' 
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={formData.discussion?.infoProvided?.[item.key] || false}
                                  onChange={(e) => handleNestedChange('discussion', 'infoProvided', item.key, e.target.checked)}
                                  disabled={modalMode === 'view'}
                                  className="w-4 h-4 text-green-600 rounded"
                                />
                                <span className="text-sm">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </InquirySection>

                    <InquirySection title="9. Follow-up Details" icon={Clock3}>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField 
                          label="Follow-up Date" 
                          type="date"
                          value={formData.inquiry?.followUpDate}
                          onChange={(v) => handleFormChange('inquiry', 'followUpDate', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Follow-up Time" 
                          value={formData.inquiry?.followUpTime}
                          onChange={(v) => handleFormChange('inquiry', 'followUpTime', v)}
                          disabled={modalMode === 'view'}
                          placeholder="e.g., 10:00 AM"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Follow-up Remarks</label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                          value={formData.inquiry?.followUpRemarks || ''}
                          onChange={(e) => handleFormChange('inquiry', 'followUpRemarks', e.target.value)}
                          disabled={modalMode === 'view'}
                        />
                      </div>
                    </InquirySection>

                    <InquirySection title="10. Admission Office Use" icon={Stethoscope}>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField 
                          label="Inquiry Taken By" 
                          value={formData.inquiry?.inquiryTakenBy}
                          onChange={(v) => handleFormChange('inquiry', 'inquiryTakenBy', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Counselor Name" 
                          value={formData.inquiry?.counselorName}
                          onChange={(v) => handleFormChange('inquiry', 'counselorName', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Admission Test Date" 
                          type="date"
                          value={formData.inquiry?.admissionTestDate}
                          onChange={(v) => handleFormChange('inquiry', 'admissionTestDate', v)}
                          disabled={modalMode === 'view'}
                        />
                        <FormField 
                          label="Interview Date" 
                          type="date"
                          value={formData.inquiry?.interviewDate}
                          onChange={(v) => handleFormChange('inquiry', 'interviewDate', v)}
                          disabled={modalMode === 'view'}
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Documents Received</label>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { key: 'birthCertificate', label: 'Birth Certificate' },
                            { key: 'parentCnic', label: 'Parent CNIC Copy' },
                            { key: 'previousResult', label: 'Previous Result' },
                            { key: 'leavingCertificate', label: 'Leaving Certificate' },
                            { key: 'photographs', label: 'Photographs' }
                          ].map(item => (
                            <label key={item.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                              formData.documents?.[item.key] 
                                ? 'bg-green-50 border-green-300' 
                                : 'border-gray-200'
                            }`}>
                              <input
                                type="checkbox"
                                checked={formData.documents?.[item.key] || false}
                                onChange={(e) => handleCheckboxChange('documents', item.key, e.target.checked)}
                                disabled={modalMode === 'view'}
                                className="w-4 h-4 text-green-600 rounded"
                              />
                              <span className="text-sm">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Final Status</label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                          value={formData.inquiry?.finalStatus || 'pending'}
                          onChange={(e) => handleFormChange('inquiry', 'finalStatus', e.target.value)}
                          disabled={modalMode === 'view'}
                        >
                          <option value="pending">Pending</option>
                          <option value="interested">Interested</option>
                          <option value="not-interested">Not Interested</option>
                          <option value="in-process">Admission in Process</option>
                          <option value="admitted">Admitted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                          value={formData.inquiry?.remarks || ''}
                          onChange={(e) => handleFormChange('inquiry', 'remarks', e.target.value)}
                          disabled={modalMode === 'view'}
                        />
                      </div>
                    </InquirySection>

                    <InquirySection title="11. Declaration" icon={FileText}>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-700 mb-3">
                          I/We confirm that the information provided above is correct to the best of my/our knowledge.
                        </p>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.declaration?.parentSignature}
                              onChange={(e) => handleCheckboxChange('declaration', 'parentSignature', e.target.checked)}
                              disabled={modalMode === 'view'}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm">Parent / Guardian Signature</span>
                          </label>
                          <FormField 
                            label="Date" 
                            type="date"
                            value={formData.declaration?.date}
                            onChange={(v) => handleCheckboxChange('declaration', 'date', v)}
                            disabled={modalMode === 'view'}
                          />
                        </div>
                      </div>
                    </InquirySection>
                  </div>

                  <div className="space-y-6">
                    {modalMode === 'convert' && (
                      <ConversionPanel inquiry={formData} onConvert={handleConvert} loading={converting} />
                    )}
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:bg-blue-50 transition-colors">
                          <Phone size={16} className="text-blue-600" />
                          <span className="text-sm">Call Parent</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:bg-green-50 transition-colors">
                          <MessageSquare size={16} className="text-green-600" />
                          <span className="text-sm">Send WhatsApp</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:bg-purple-50 transition-colors">
                          <Mail size={16} className="text-purple-600" />
                          <span className="text-sm">Send Email</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:bg-orange-50 transition-colors">
                          <Calendar size={16} className="text-orange-600" />
                          <span className="text-sm">Schedule Visit</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Activity Log</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <Clock size={14} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-gray-600">Inquiry created</p>
                            <p className="text-xs text-gray-400">
                              {new Date(formData.createdAt || Date.now()).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {formData.inquiry?.followUpDate && (
                          <div className="flex items-start gap-2">
                            <Calendar size={14} className="text-yellow-500 mt-0.5" />
                            <div>
                              <p className="text-gray-600">Follow-up scheduled</p>
                              <p className="text-xs text-gray-400">
                                {new Date(formData.inquiry.followUpDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white rounded-b-2xl border-t px-6 py-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(formData.updatedAt || Date.now()).toLocaleString()}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={16} />
                      {modalMode === 'create' ? 'Create Inquiry' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversionPanel({ inquiry, onConvert, loading }) {
  const [feeStructure, setFeeStructure] = useState({
    admissionFee: 5000,
    monthlyTuitionFee: 3000,
    securityFee: 2000,
  });

  const totalFee = Object.values(feeStructure).reduce((a, b) => a + b, 0);

  const handleCompleteAdmission = async () => {
    try {
      await onConvert(feeStructure);
    } catch (error) {
      console.error('Conversion error:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <ArrowRight className="text-purple-600" size={16} />
        </div>
        <h3 className="font-semibold text-gray-800">Convert to Admission</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Fee Structure</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Admission Fee</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Rs.</span>
                <input
                  type="number"
                  className="w-28 px-2 py-1 text-right border rounded text-sm"
                  value={feeStructure.admissionFee}
                  onChange={(e) => setFeeStructure(prev => ({ ...prev, admissionFee: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Tuition Fee</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Rs.</span>
                <input
                  type="number"
                  className="w-28 px-2 py-1 text-right border rounded text-sm"
                  value={feeStructure.monthlyTuitionFee}
                  onChange={(e) => setFeeStructure(prev => ({ ...prev, monthlyTuitionFee: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Security Fee</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Rs.</span>
                <input
                  type="number"
                  className="w-28 px-2 py-1 text-right border rounded text-sm"
                  value={feeStructure.securityFee}
                  onChange={(e) => setFeeStructure(prev => ({ ...prev, securityFee: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-indigo-600">Rs. {totalFee.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCompleteAdmission}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Complete Admission
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function InquirySection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', disabled, placeholder, readonly }) {
  if (readonly) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">
          {value || '-'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

export default Admissions;
