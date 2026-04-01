import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Save, X, User, Users, Home, GraduationCap, Stethoscope, Bus, Building,
  FileText, DollarSign, Upload, Check, Calendar, Phone, Mail,
  Plus, Trash2, ChevronLeft, ChevronRight, UserPlus, FileDown,
  Heart, Shield, BookOpen, ClipboardCheck, UserCheck, CreditCard,
  AlertCircle
} from 'lucide-react';
import { generateAdmissionPDF, generateFeeVoucherPDF } from '../utils/pdfGenerator';

const TOTAL_PAGES = 5;

function StudentAdmission() {
  const { user, hasPermission, currentSchool } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [savedStudent, setSavedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageErrors, setPageErrors] = useState({});

  const [formData, setFormData] = useState({
    admission: {
      admissionDate: new Date().toISOString().split('T')[0],
      session: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      classGrade: ''
    },
    student: {
      fullName: '',
      fullNameUrdu: '',
      gender: 'male',
      dateOfBirth: '',
      age: '',
      placeOfBirth: '',
      nationality: 'Pakistani',
      religion: '',
      bloodGroup: '',
      birthCertNo: '',
      photo: null,
      familyNumber: ''
    },
    father: {
      fullName: '',
      cnic: '',
      qualification: '',
      occupation: '',
      organization: '',
      monthlyIncome: '',
      mobile: '',
      whatsapp: '',
      email: ''
    },
    mother: {
      fullName: '',
      cnic: '',
      qualification: '',
      occupation: '',
      organization: '',
      monthlyIncome: '',
      mobile: '',
      whatsapp: '',
      email: ''
    },
    guardian: {
      fullName: '',
      relation: '',
      cnic: '',
      mobile: '',
      address: ''
    },
    currentAddress: {
      houseNo: '',
      area: '',
      city: '',
      postalCode: ''
    },
    permanentAddress: {
      houseNo: '',
      area: '',
      city: '',
      postalCode: ''
    },
    sameAddress: true,
    academic: {
      previousSchool: '',
      previousClass: '',
      lastResult: '',
      leavingCertificate: false,
      reasonForLeaving: ''
    },
    medical: {
      diseaseAllergy: '',
      physicalDisability: '',
      emergencyNotes: '',
      doctorName: '',
      emergencyContact: ''
    },
    transport: {
      required: false,
      pickUpAddress: '',
      dropOffAddress: '',
      routeArea: ''
    },
    hostel: {
      required: false,
      guardianName: '',
      guardianContact: ''
    },
    sibling: {
      hasSibling: false,
      siblings: [{ name: '', classGrade: '' }]
    },
    fee: {
      admissionFee: '',
      securityFee: '',
      monthlyTuitionFee: '',
      transportFee: '',
      hostelFee: '',
      otherFee: '',
      discount: '',
      remarks: ''
    },
    documents: {
      birthCertificate: false,
      fatherCnic: false,
      motherCnic: false,
      guardianCnic: false,
      photos: false,
      previousResult: false,
      leavingCertificate: false,
      medicalCertificate: false,
      other: ''
    },
    declaration: {
      parentName: '',
      signature: false,
      date: new Date().toISOString().split('T')[0]
    },
    officeUse: {
      approvedBy: '',
      principalSignature: '',
      accountantSignature: '',
      remarks: ''
    }
  });

  const [classGrades, setClassGrades] = useState([]);
  const [schoolSettings, setSchoolSettings] = useState(null);

  useEffect(() => {
    fetchClassGrades();
    fetchSchoolSettings();
  }, []);

  const fetchClassGrades = async () => {
    try {
      const response = await api.get('/class-grades');
      setClassGrades(response.data || []);
    } catch (error) {
      console.error('Error fetching class grades:', error);
    }
  };

  const fetchSchoolSettings = async () => {
    try {
      const response = await api.get('/settings/school');
      setSchoolSettings(response.data);
      
      if (response.data?.feeStructure) {
        setFormData(prev => ({
          ...prev,
          fee: {
            ...prev.fee,
            admissionFee: response.data.feeStructure.admissionFee || 0,
            securityFee: response.data.feeStructure.securityFee || 0,
            monthlyTuitionFee: response.data.feeStructure.monthlyTuitionFee || 0,
            transportFee: response.data.feeStructure.transportFee || 0,
            hostelFee: response.data.feeStructure.hostelFee || 0,
            otherFee: response.data.feeStructure.otherFee || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching school settings:', error);
    }
  };

  const pageConfig = [
    { id: 1, title: 'Admission Details', icon: FileText },
    { id: 2, title: 'Student Information', icon: User },
    { id: 3, title: 'Parent / Guardian', icon: Users },
    { id: 4, title: 'Address & Academic', icon: Home },
    { id: 5, title: 'Fee & Submit', icon: DollarSign }
  ];

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

  const formatBForm = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  };

  const handleBirthCertChange = (value) => {
    const formatted = formatBForm(value);
    handleChange('student', 'birthCertNo', formatted);
  };

  const validatePage = (page) => {
    const errors = {};
    
    if (page === 1) {
      if (!formData.admission.classGrade) {
        errors.classGrade = 'Please select a class';
      }
    }
    
    if (page === 2) {
      if (!formData.student.fullName?.trim()) {
        errors.fullName = 'Student name is required';
      }
      if (!formData.student.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      }
      if (!formData.student.gender) {
        errors.gender = 'Gender is required';
      }
      if (!formData.student.nationality?.trim()) {
        errors.nationality = 'Nationality is required';
      }
    }
    
    if (page === 3) {
      if (!formData.father.fullName?.trim()) {
        errors.fatherName = "Father's name is required";
      }
      if (!formData.father.mobile?.trim()) {
        errors.fatherMobile = "Father's mobile number is required";
      }
    }
    
    if (page === 4) {
      if (!formData.currentAddress.city?.trim()) {
        errors.city = 'City is required';
      }
    }
    
    return errors;
  };

  const clearFieldError = (field) => {
    setPageErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleChange = (section, field, value) => {
    clearFieldError(field);
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
    
    const errors = validatePage(1);
    if (Object.keys(errors).length > 0) {
      setPageErrors(errors);
      setCurrentPage(1);
      return;
    }
    
    try {
      setLoading(true);
      
      const studentName = formData.student.fullName?.split(' ') || [];
      const firstName = studentName[0] || '';
      const lastName = studentName.slice(1).join(' ') || '';
      
      const genderMap = { male: 'Male', female: 'Female', other: 'Other' };
      const gender = genderMap[formData.student.gender?.toLowerCase()] || 'Male';
      
      const submitData = {
        firstName,
        lastName,
        dateOfBirth: formData.student.dateOfBirth || undefined,
        gender,
        email: formData.student.email || formData.father.email || '',
        phone: formData.father.mobile || '',
        parentName: formData.father.fullName || '',
        parentPhone: formData.father.mobile || '',
        parentEmail: formData.father.email || '',
        familyNumber: formData.student.familyNumber || '',
        address: {
          street: formData.currentAddress?.houseNo || '',
          city: formData.currentAddress?.city || '',
          state: formData.currentAddress?.area || '',
          zipCode: formData.currentAddress?.postalCode || ''
        },
        school: currentSchool?._id || localStorage.getItem('currentSchoolId'),
        admissionForm: {
          fullNameUrdu: formData.student.fullNameUrdu,
          placeOfBirth: formData.student.placeOfBirth,
          nationality: formData.student.nationality,
          religion: formData.student.religion,
          bloodGroup: formData.student.bloodGroup,
          birthCertNo: formData.student.birthCertNo,
          photo: formData.student.photo || null,
          father: formData.father,
          mother: formData.mother,
          guardian: formData.guardian,
          currentAddress: formData.currentAddress,
          permanentAddress: formData.permanentAddress,
          sameAddress: formData.sameAddress,
          academic: formData.academic,
          medical: formData.medical,
          transport: formData.transport,
          hostel: formData.hostel,
          sibling: formData.sibling,
          fee: formData.fee,
          documents: formData.documents,
          declaration: formData.declaration,
          session: formData.admission.session,
          classGrade: formData.admission.classGrade
        }
      };
      
      submitData.classGrade = formData.admission.classGrade;
      
      const response = await api.post('/students', submitData);
      setSavedStudent(response.data);
      setSuccess(true);
    } catch (error) {
      console.error('Student creation error:', error.response?.data);
      showToast(error.response?.data?.message || 'Failed to create student', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addSibling = () => {
    setFormData(prev => ({
      ...prev,
      sibling: {
        ...prev.sibling,
        siblings: [...prev.sibling.siblings, { name: '', classGrade: '' }]
      }
    }));
  };

  const removeSibling = (index) => {
    setFormData(prev => ({
      ...prev,
      sibling: {
        ...prev.sibling,
        siblings: prev.sibling.siblings.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSibling = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sibling: {
        ...prev.sibling,
        siblings: prev.sibling.siblings.map((s, i) => i === index ? { ...s, [field]: value } : s)
      }
    }));
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= TOTAL_PAGES) {
      const errors = validatePage(currentPage);
      if (Object.keys(errors).length > 0) {
        setPageErrors(errors);
        return;
      }
      setPageErrors({});
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextPage = () => {
    const errors = validatePage(currentPage);
    if (Object.keys(errors).length > 0) {
      setPageErrors(errors);
      return;
    }
    setPageErrors({});
    if (currentPage < TOTAL_PAGES) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (success && savedStudent) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-emerald-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Student Admitted Successfully!</h2>
          <p className="text-slate-500 mb-2">Student ID: <strong className="text-indigo-600">{savedStudent.studentId}</strong></p>
          <p className="text-slate-500 mb-2">Name: <strong>{formData.student.fullName}</strong></p>
          {formData.student.photo && (
            <div className="w-24 h-24 mx-auto mb-6 rounded-xl overflow-hidden border-2 border-indigo-200 shadow-lg">
              <img src={formData.student.photo} alt="Student" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button
              onClick={() => generateAdmissionPDF(formData)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-colors"
            >
              <FileDown size={18} />
              Download Admission Form
            </button>
            <button
              onClick={() => {
                const fees = [
                  { description: 'Admission Fee', amount: parseInt(formData.fee.admissionFee) || 5000, paidAmount: 0 },
                  { description: 'Monthly Tuition Fee', amount: parseInt(formData.fee.monthlyTuitionFee) || 3000, paidAmount: 0 },
                  { description: 'Security Fee', amount: parseInt(formData.fee.securityFee) || 2000, paidAmount: 0 },
                ].filter(f => f.amount > 0);
                generateFeeVoucherPDF({
                  student: { fullName: formData.student.fullName },
                  father: { fullName: formData.father.fullName },
                  studentId: savedStudent.studentId,
                  classGrade: formData.admission.classGrade
                }, fees);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 shadow-md transition-colors"
            >
              <FileDown size={18} />
              Download Fee Voucher
            </button>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setSavedStudent(null);
                setCurrentPage(1);
              }}
              className="px-6 py-2.5 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-medium"
            >
              Add Another Student
            </button>
            <button
              onClick={() => navigate('/students')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-md"
            >
              View Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Student Admission Form</h1>
          <p className="text-slate-500 mt-1">Complete all sections to register a new student</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-6">
          <div className="bg-slate-100 p-4">
            <div className="flex items-center justify-between">
              {pageConfig.map((page, index) => {
                const Icon = page.icon;
                const isActive = currentPage === page.id;
                const isCompleted = currentPage > page.id;
                return (
                  <div key={page.id} className="flex items-center">
                    <button
                      onClick={() => goToPage(page.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : isCompleted 
                            ? 'bg-indigo-500 text-white hover:bg-indigo-400' 
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive ? 'bg-white/20 text-white' : isCompleted ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                      }`}>
                        {isCompleted ? <Check size={14} /> : page.id}
                      </div>
                      <span className="font-medium hidden sm:inline text-sm">{page.title}</span>
                    </button>
                    {index < pageConfig.length - 1 && (
                      <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 rounded ${isCompleted ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-slate-700 text-sm">
              <span>Step {currentPage} of {TOTAL_PAGES}: {pageConfig[currentPage - 1]?.title}</span>
              <span>{Math.round((currentPage / TOTAL_PAGES) * 100)}% Complete</span>
            </div>
            <div className="mt-2 h-2 bg-slate-300 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(currentPage / TOTAL_PAGES) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 min-h-[500px]">
              {currentPage === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <FileText className="text-indigo-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Admission Details</h2>
                      <p className="text-slate-500 text-sm">Basic admission information for the student</p>
                    </div>
                  </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <CreditCard size={18} className="text-indigo-600" /> Admission Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Admission Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          required
                          value={formData.admission.admissionDate}
                          onChange={(e) => handleChange('admission', 'admissionDate', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Academic Session <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.admission.session}
                          onChange={(e) => handleChange('admission', 'session', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="2024-2025"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Class / Grade <span className="text-red-500">*</span></label>
                        <select
                          value={formData.admission.classGrade}
                          onChange={(e) => {
                            handleChange('admission', 'classGrade', e.target.value);
                            clearFieldError('classGrade');
                          }}
                          className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${pageErrors.classGrade ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                        >
                          <option value="">Select Class</option>
                          {classGrades.map(grade => (
                            <option key={grade._id} value={grade._id}>
                              {grade.name}
                            </option>
                          ))}
                        </select>
                        {pageErrors.classGrade && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} /> {pageErrors.classGrade}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">
                      <span className="font-medium text-amber-600">Note:</span> Section and Roll Number will be assigned after fee payment is verified.
                    </p>
                  </div>
                </div>
              )}

              {currentPage === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <User className="text-indigo-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Student Information</h2>
                      <p className="text-slate-500 text-sm">Personal details of the student</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <UserCheck size={18} className="text-indigo-600" /> Personal Details
                    </h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Student Full Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={formData.student.fullName}
                            onChange={(e) => handleChange('student', 'fullName', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${pageErrors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            placeholder="Enter full name as per B-Form"
                          />
                          {pageErrors.fullName && <p className="text-red-500 text-xs mt-1">{pageErrors.fullName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Name in Urdu</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={formData.student.fullNameUrdu}
                            onChange={(e) => handleChange('student', 'fullNameUrdu', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-right"
                            placeholder="اردو میں نام"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Family Number</label>
                          <input
                            type="text"
                            value={formData.student.familyNumber}
                            onChange={(e) => handleChange('student', 'familyNumber', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="e.g., FAM-001"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            required
                            value={formData.student.dateOfBirth}
                            onChange={(e) => {
                              handleChange('student', 'dateOfBirth', e.target.value);
                              handleChange('student', 'age', calculateAge(e.target.value));
                            }}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${pageErrors.dateOfBirth ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                          />
                          {pageErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{pageErrors.dateOfBirth}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
                          <input
                            type="text"
                            value={formData.student.age}
                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl"
                            placeholder="Auto"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Place of Birth</label>
                          <input
                            type="text"
                            value={formData.student.placeOfBirth}
                            onChange={(e) => handleChange('student', 'placeOfBirth', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Blood Group</label>
                          <select
                            value={formData.student.bloodGroup}
                            onChange={(e) => handleChange('student', 'bloodGroup', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                          <div className="flex gap-3 pt-1">
                            {[
                              { value: 'male', label: 'Male' },
                              { value: 'female', label: 'Female' },
                              { value: 'other', label: 'Other' }
                            ].map(g => (
                              <label key={g.value} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                formData.student.gender === g.value 
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                                  : pageErrors.gender
                                    ? 'bg-white border-red-300 hover:bg-red-50'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}>
                                <input
                                  type="radio"
                                  name="gender"
                                  value={g.value}
                                  checked={formData.student.gender === g.value}
                                  onChange={(e) => {
                                    clearFieldError('gender');
                                    handleChange('student', 'gender', e.target.value);
                                  }}
                                  className="sr-only"
                                />
                                <span className="text-sm font-medium">{g.label}</span>
                              </label>
                            ))}
                          </div>
                          {pageErrors.gender && <p className="text-red-500 text-xs mt-1">{pageErrors.gender}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nationality <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={formData.student.nationality}
                            onChange={(e) => handleChange('student', 'nationality', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${pageErrors.nationality ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                          />
                          {pageErrors.nationality && <p className="text-red-500 text-xs mt-1">{pageErrors.nationality}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Religion</label>
                          <input
                            type="text"
                            value={formData.student.religion}
                            onChange={(e) => handleChange('student', 'religion', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">B-Form / Birth Certificate No</label>
                          <input
                            type="text"
                            value={formData.student.birthCertNo}
                            onChange={(e) => handleBirthCertChange(e.target.value)}
                            maxLength={15}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="XXXXX-XXXXXXX-X"
                          />
                          <p className="text-xs text-slate-500 mt-1">13 digits (e.g., 12345-1234567-1)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Student Photo</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    handleChange('student', 'photo', reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            {formData.student.photo && (
                              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-indigo-200">
                                <img src={formData.student.photo} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Users className="text-indigo-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Parent / Guardian Information</h2>
                      <p className="text-slate-500 text-sm">Contact and professional details</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-5">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <User size={18} className="text-indigo-600" /> Father Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Father Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.father.fullName}
                          onChange={(e) => handleChange('father', 'fullName', e.target.value)}
                          className={`w-full px-3 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${pageErrors.fatherName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                        />
                        {pageErrors.fatherName && <p className="text-red-500 text-xs mt-1">{pageErrors.fatherName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CNIC No</label>
                        <input
                          type="text"
                          value={formData.father.cnic}
                          onChange={(e) => handleChange('father', 'cnic', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="XXXXX-XXXXXXX-X"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                        <input
                          type="text"
                          value={formData.father.qualification}
                          onChange={(e) => handleChange('father', 'qualification', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                        <input
                          type="text"
                          value={formData.father.occupation}
                          onChange={(e) => handleChange('father', 'occupation', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                        <input
                          type="text"
                          value={formData.father.organization}
                          onChange={(e) => handleChange('father', 'organization', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Income (PKR)</label>
                        <input
                          type="number"
                          value={formData.father.monthlyIncome}
                          onChange={(e) => handleChange('father', 'monthlyIncome', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile No <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          value={formData.father.mobile}
                          onChange={(e) => handleChange('father', 'mobile', e.target.value)}
                          className={`w-full px-3 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${pageErrors.fatherMobile ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                          placeholder="03XX-XXXXXXX"
                        />
                        {pageErrors.fatherMobile && <p className="text-red-500 text-xs mt-1">{pageErrors.fatherMobile}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp No</label>
                        <input
                          type="tel"
                          value={formData.father.whatsapp}
                          onChange={(e) => handleChange('father', 'whatsapp', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="03XX-XXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.father.email}
                          onChange={(e) => handleChange('father', 'email', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-5">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <User size={18} className="text-indigo-600" /> Mother Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mother Name</label>
                        <input
                          type="text"
                          value={formData.mother.fullName}
                          onChange={(e) => handleChange('mother', 'fullName', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CNIC No</label>
                        <input
                          type="text"
                          value={formData.mother.cnic}
                          onChange={(e) => handleChange('mother', 'cnic', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="XXXXX-XXXXXXX-X"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                        <input
                          type="text"
                          value={formData.mother.occupation}
                          onChange={(e) => handleChange('mother', 'occupation', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile No</label>
                        <input
                          type="tel"
                          value={formData.mother.mobile}
                          onChange={(e) => handleChange('mother', 'mobile', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="03XX-XXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.mother.email}
                          onChange={(e) => handleChange('mother', 'email', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-indigo-600" /> Guardian Details (if different)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Name</label>
                        <input
                          type="text"
                          value={formData.guardian.fullName}
                          onChange={(e) => handleChange('guardian', 'fullName', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Relation</label>
                        <input
                          type="text"
                          value={formData.guardian.relation}
                          onChange={(e) => handleChange('guardian', 'relation', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="e.g. Uncle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CNIC No</label>
                        <input
                          type="text"
                          value={formData.guardian.cnic}
                          onChange={(e) => handleChange('guardian', 'cnic', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile No</label>
                        <input
                          type="tel"
                          value={formData.guardian.mobile}
                          onChange={(e) => handleChange('guardian', 'mobile', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="03XX-XXXXXXX"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={formData.guardian.address}
                          onChange={(e) => handleChange('guardian', 'address', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Home className="text-indigo-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Address & Academic Details</h2>
                      <p className="text-slate-500 text-sm">Residential and previous academic information</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-5">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Home size={18} className="text-indigo-600" /> Current Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">House No / Street</label>
                        <input
                          type="text"
                          value={formData.currentAddress.houseNo}
                          onChange={(e) => handleChange('currentAddress', 'houseNo', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                        <input
                          type="text"
                          value={formData.currentAddress.area}
                          onChange={(e) => handleChange('currentAddress', 'area', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={formData.currentAddress.postalCode}
                          onChange={(e) => handleChange('currentAddress', 'postalCode', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.currentAddress.city}
                          onChange={(e) => handleChange('currentAddress', 'city', e.target.value)}
                          className={`w-full px-3 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${pageErrors.city ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                        />
                        {pageErrors.city && <p className="text-red-500 text-xs mt-1">{pageErrors.city}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Home size={18} className="text-indigo-600" /> Permanent Address
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sameAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, sameAddress: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-600">Same as current</span>
                      </label>
                    </div>
                    {!formData.sameAddress && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">House No / Street</label>
                          <input
                            type="text"
                            value={formData.permanentAddress.houseNo}
                            onChange={(e) => handleChange('permanentAddress', 'houseNo', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                          <input
                            type="text"
                            value={formData.permanentAddress.area}
                            onChange={(e) => handleChange('permanentAddress', 'area', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            value={formData.permanentAddress.city}
                            onChange={(e) => handleChange('permanentAddress', 'city', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <GraduationCap size={18} className="text-indigo-600" /> Academic Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Previous School Name</label>
                          <input
                            type="text"
                            value={formData.academic.previousSchool}
                            onChange={(e) => handleChange('academic', 'previousSchool', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Previous Class</label>
                            <input
                              type="text"
                              value={formData.academic.previousClass}
                              onChange={(e) => handleChange('academic', 'previousClass', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Result</label>
                            <input
                              type="text"
                              value={formData.academic.lastResult}
                              onChange={(e) => handleChange('academic', 'lastResult', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Leaving</label>
                          <input
                            type="text"
                            value={formData.academic.reasonForLeaving}
                            onChange={(e) => handleChange('academic', 'reasonForLeaving', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border">
                          <input
                            type="checkbox"
                            checked={formData.academic.leavingCertificate}
                            onChange={(e) => handleChange('academic', 'leavingCertificate', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700">Leaving Certificate Attached</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Stethoscope size={18} className="text-indigo-600" /> Medical Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Disease / Allergy</label>
                          <input
                            type="text"
                            value={formData.medical.diseaseAllergy}
                            onChange={(e) => handleChange('medical', 'diseaseAllergy', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="If any"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Physical Disability</label>
                          <input
                            type="text"
                            value={formData.medical.physicalDisability}
                            onChange={(e) => handleChange('medical', 'physicalDisability', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
                          <input
                            type="text"
                            value={formData.medical.doctorName}
                            onChange={(e) => handleChange('medical', 'doctorName', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                          <input
                            type="tel"
                            value={formData.medical.emergencyContact}
                            onChange={(e) => handleChange('medical', 'emergencyContact', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Bus size={18} className="text-indigo-600" /> Transport Details
                      </h3>
                      <label className="flex items-center gap-2 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.transport.required}
                          onChange={(e) => handleChange('transport', 'required', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Transport Required</span>
                      </label>
                      {formData.transport.required && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Pick-up Address</label>
                            <input
                              type="text"
                              value={formData.transport.pickUpAddress}
                              onChange={(e) => handleChange('transport', 'pickUpAddress', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Drop-off Address</label>
                            <input
                              type="text"
                              value={formData.transport.dropOffAddress}
                              onChange={(e) => handleChange('transport', 'dropOffAddress', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Building size={18} className="text-indigo-600" /> Hostel Details
                      </h3>
                      <label className="flex items-center gap-2 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hostel.required}
                          onChange={(e) => handleChange('hostel', 'required', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Hostel Required</span>
                      </label>
                      {formData.hostel.required && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Name</label>
                            <input
                              type="text"
                              value={formData.hostel.guardianName}
                              onChange={(e) => handleChange('hostel', 'guardianName', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Contact</label>
                            <input
                              type="tel"
                              value={formData.hostel.guardianContact}
                              onChange={(e) => handleChange('hostel', 'guardianContact', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 5 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <DollarSign className="text-indigo-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Fee Structure & Declaration</h2>
                      <p className="text-slate-500 text-sm">Fee details and final declaration</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-5">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <DollarSign size={18} className="text-indigo-600" /> Fee Structure
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Admission Fee (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fee.admissionFee}
                          onChange={(e) => handleChange('fee', 'admissionFee', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Security Fee (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fee.securityFee}
                          onChange={(e) => handleChange('fee', 'securityFee', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Tuition (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fee.monthlyTuitionFee}
                          onChange={(e) => handleChange('fee', 'monthlyTuitionFee', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Transport Fee (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fee.transportFee}
                          onChange={(e) => handleChange('fee', 'transportFee', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hostel Fee (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fee.hostelFee}
                          onChange={(e) => handleChange('fee', 'hostelFee', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                        <input
                          type="text"
                          value={formData.fee.discount}
                          onChange={(e) => handleChange('fee', 'discount', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="e.g. 10%"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-5">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Upload size={18} className="text-indigo-600" /> Documents Checklist
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'birthCertificate', label: 'Birth Certificate' },
                        { key: 'fatherCnic', label: "Father's CNIC" },
                        { key: 'motherCnic', label: "Mother's CNIC" },
                        { key: 'guardianCnic', label: "Guardian's CNIC" },
                        { key: 'photos', label: 'Passport Photos' },
                        { key: 'previousResult', label: 'Previous Result' },
                        { key: 'leavingCertificate', label: 'Leaving Certificate' },
                        { key: 'medicalCertificate', label: 'Medical Certificate' }
                      ].map(doc => (
                        <label key={doc.key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.documents[doc.key] ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.documents[doc.key]}
                            onChange={(e) => handleChange('documents', doc.key, e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-slate-700">{doc.label}</span>
                          {formData.documents[doc.key] && <Check size={14} className="text-indigo-600 ml-auto" />}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-5">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Users size={18} className="text-indigo-600" /> Sibling Information
                    </h3>
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sibling.hasSibling}
                        onChange={(e) => setFormData(prev => ({ ...prev, sibling: { ...prev.sibling, hasSibling: e.target.checked } }))}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Sibling in this school?</span>
                    </label>
                    {formData.sibling.hasSibling && (
                      <div className="space-y-3">
                        {formData.sibling.siblings.map((sibling, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              value={sibling.name}
                              onChange={(e) => updateSibling(index, 'name', e.target.value)}
                              className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl"
                              placeholder="Sibling Name"
                            />
                            <input
                              type="text"
                              value={sibling.classGrade}
                              onChange={(e) => updateSibling(index, 'classGrade', e.target.value)}
                              className="w-32 px-3 py-2.5 bg-white border border-slate-200 rounded-xl"
                              placeholder="Class"
                            />
                            {formData.sibling.siblings.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSibling(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addSibling}
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          <Plus size={16} /> Add Sibling
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <ClipboardCheck size={18} className="text-indigo-600" /> Declaration
                    </h3>
                    <div className="bg-indigo-50 p-4 rounded-xl mb-4">
                      <p className="text-sm text-slate-700">
                        I declare that all information provided is correct. I agree to follow school rules and understand that false information may result in admission cancellation.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Parent / Guardian Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.declaration.parentName}
                          onChange={(e) => handleChange('declaration', 'parentName', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={formData.declaration.date}
                          onChange={(e) => handleChange('declaration', 'date', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-xl border-2 border-dashed border-slate-300">
                        <input
                          type="checkbox"
                          required
                          checked={formData.declaration.signature}
                          onChange={(e) => handleChange('declaration', 'signature', e.target.checked)}
                          className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">I confirm all information is correct and accept the terms</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={prevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              {currentPage < TOTAL_PAGES ? (
                <button
                  type="button"
                  onClick={nextPage}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-md"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !formData.declaration.signature}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Submit Admission
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default StudentAdmission;
