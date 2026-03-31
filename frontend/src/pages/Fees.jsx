import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, DollarSign, Check, AlertCircle, FileDown, Download, Search, Filter, BookOpen, Calculator, Calendar, UsersRound, FileText } from 'lucide-react';
import api, { feeService, studentService, classGradeService } from '../services/api';
import { generateFeeVoucherPDF, generateFamilyChallanPDF, generateBulkFeeVouchersPDF } from '../utils/pdfGenerator';
import useToast from '../hooks/useToast';

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .soa-print-area, .soa-print-area * {
      visibility: visible;
    }
    .soa-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px;
      background: white;
    }
    .soa-table-container {
      overflow-x: auto !important;
      max-width: 100% !important;
      page-break-inside: avoid;
    }
    .soa-table {
      font-size: 11px !important;
      width: 100% !important;
      table-layout: fixed !important;
    }
    .soa-table th, .soa-table td {
      padding: 5px 6px !important;
      font-size: 10px !important;
    }
    .soa-table th {
      background-color: #f3e8ff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .soa-tfoot {
      background-color: #f3e8ff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

function Fees() {
  const [fees, setFees] = useState([]);
  const [allFees, setAllFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [editingFee, setEditingFee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const [calculateData, setCalculateData] = useState({
    month: new Date().toISOString().slice(0, 7),
    selectedFeeTypes: ['Monthly Tuition'],
    feeAmounts: { 'Monthly Tuition': 5000 },
    dueDay: 10
  });
  
  const [showFamilyVoucherModal, setShowFamilyVoucherModal] = useState(false);
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [familyStudents, setFamilyStudents] = useState([]);
  const [loadingFamilyStudents, setLoadingFamilyStudents] = useState(false);
  const [selectedFamilyStudents, setSelectedFamilyStudents] = useState([]);
  const [commonFeeAmount, setCommonFeeAmount] = useState('');
  const [familyVoucherData, setFamilyVoucherData] = useState({
    feeType: 'Monthly Tuition',
    amount: '',
    dueDate: '',
    description: ''
  });
  
  const [selectedFees, setSelectedFees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const availableFeeTypes = [
    { id: 'Monthly Tuition', label: 'Monthly Tuition', defaultAmount: 5000 },
    { id: 'Admission Fee', label: 'Admission Fee', defaultAmount: 10000 },
    { id: 'Exam Fee', label: 'Exam Fee', defaultAmount: 2000 },
    { id: 'Transport Fee', label: 'Transport Fee', defaultAmount: 3000 },
    { id: 'Library Fee', label: 'Library Fee', defaultAmount: 500 },
    { id: 'Sports Fee', label: 'Sports Fee', defaultAmount: 1000 },
    { id: 'Lab Fee', label: 'Lab Fee', defaultAmount: 2000 },
    { id: 'Annual Charges', label: 'Annual Charges', defaultAmount: 5000 },
    { id: 'Development Fund', label: 'Development Fund', defaultAmount: 2000 },
    { id: 'Other', label: 'Other', defaultAmount: 1000 }
  ];
  const [formData, setFormData] = useState({
    student: '',
    feeType: 'Tuition',
    amount: '',
    dueDate: '',
    academicYear: '',
    term: '',
    description: ''
  });
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', reference: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = printStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    if (showCalculateModal) {
      const initialAmounts = {};
      availableFeeTypes.forEach(t => {
        initialAmounts[t.id] = t.defaultAmount;
      });
      setCalculateData(prev => ({
        ...prev,
        selectedFeeTypes: availableFeeTypes.map(t => t.id),
        feeAmounts: initialAmounts
      }));
    }
  }, [showCalculateModal]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.student-input') && !e.target.closest('.student-list')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [feesRes, studentsRes, classesRes] = await Promise.all([
        feeService.getAll(),
        studentService.getAll(),
        classGradeService.getAll()
      ]);
      setAllFees(feesRes.data || []);
      setFees(feesRes.data || []);
      setStudents(studentsRes.data?.students || studentsRes.data || []);
      setClassGrades(classesRes.data || []);
      try {
        const summaryRes = await feeService.getSummary({
          dateFrom: dateRange.startDate,
          dateTo: dateRange.endDate
        });
        setSummary(summaryRes.data);
      } catch (e) {
        console.log('Summary not available');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || 'Failed to load data. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const filterFees = () => {
    let filtered = [...allFees];
    
    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(fee => {
        const feeDate = new Date(fee.dueDate);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return feeDate >= start && feeDate <= end;
      });
    }
    
    if (selectedClass) {
      const classStudents = students.filter(s => s.classGrade?._id === selectedClass || s.classGrade === selectedClass);
      const studentIds = classStudents.map(s => s._id);
      filtered = filtered.filter(fee => {
        const feeStudentId = fee.student?._id || fee.student;
        return studentIds.includes(feeStudentId);
      });
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(fee => fee.status === selectedStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fee => {
        const studentName = fee.student ? 
          `${fee.student.firstName || ''} ${fee.student.lastName || ''}`.toLowerCase() : '';
        const studentId = fee.student?.studentId?.toLowerCase() || '';
        const feeType = fee.feeType?.toLowerCase() || '';
        const voucherNumber = fee.voucherNumber?.toLowerCase() || '';
        const familyNumber = fee.familyNumber?.toLowerCase() || '';
        
        return studentName.includes(query) || 
               studentId.includes(query) ||
               feeType.includes(query) ||
               voucherNumber.includes(query) ||
               familyNumber.includes(query);
      });
    }
    
    setFees(filtered);
  };

  useEffect(() => {
    filterFees();
    setCurrentPage(1);
  }, [selectedClass, selectedStatus, searchQuery, dateRange, allFees, students]);

  const totalPages = Math.ceil(fees.length / recordsPerPage);
  const paginatedFees = fees.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const handleCalculateMonthlyFees = async () => {
    if (!calculateData.selectedFeeTypes || calculateData.selectedFeeTypes.length === 0) {
      showToast('Please select at least one fee type', 'warning');
      return;
    }

    const totalAmount = Object.values(calculateData.feeAmounts).reduce((sum, amt) => sum + (amt || 0), 0);
    
    const feeTypesList = calculateData.selectedFeeTypes.map(type => 
      `${type}: PKR ${(calculateData.feeAmounts[type] || 0).toLocaleString()}`
    ).join('\n');
    
    if (!confirm(`Generate monthly fees for ${calculateData.month}?\n\nThis will create fees for all students with:\n${feeTypesList}\n\nTotal per student: PKR ${totalAmount.toLocaleString()}\nDue Day: ${calculateData.dueDay}`)) {
      return;
    }
    
    setCalculating(true);
    
    try {
      const response = await api.post('/fees/calculate-monthly', {
        month: calculateData.month,
        selectedFeeTypes: calculateData.selectedFeeTypes,
        feeAmounts: calculateData.feeAmounts,
        dueDay: calculateData.dueDay
      });
      
      if (response.status === 200 || response.status === 201) {
        setShowCalculateModal(false);
        loadData();
        showToast(`Successfully created ${response.data.created} fee records for ${calculateData.month}`, 'success');
      } else {
        showToast(response.data.message || 'Failed to calculate fees', 'error');
      }
    } catch (err) {
      console.error('Calculate fees error:', err);
      showToast('Failed to calculate fees', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleOpenFamilyVoucher = () => {
    setShowFamilyVoucherModal(true);
    setFamilySearchQuery('');
    setFamilyStudents([]);
    setSelectedFamilyStudents([]);
    setCommonFeeAmount('');
    setFamilyVoucherData({
      feeType: 'Monthly Tuition',
      amount: '',
      dueDate: '',
      description: ''
    });
  };

  const handleSearchFamily = async () => {
    if (!familySearchQuery.trim()) {
      showToast('Please enter a family number to search', 'warning');
      return;
    }
    
    setLoadingFamilyStudents(true);
    try {
      const response = await studentService.searchAll(familySearchQuery);
      const studentsList = response.data?.students || response.data || [];
      const withFamily = studentsList.filter(s => s.familyNumber);
      
      const uniqueFamilies = {};
      withFamily.forEach(s => {
        if (s.familyNumber && !uniqueFamilies[s.familyNumber]) {
          uniqueFamilies[s.familyNumber] = {
            familyNumber: s.familyNumber,
            students: []
          };
        }
        if (s.familyNumber) {
          uniqueFamilies[s.familyNumber].students.push(s);
        }
      });
      
      const families = Object.values(uniqueFamilies);
      if (families.length === 0) {
        showToast('No families found with this search', 'warning');
      }
      setFamilyStudents(families);
    } catch (err) {
      console.error('Error searching families:', err);
      showToast('Error searching families', 'error');
    } finally {
      setLoadingFamilyStudents(false);
    }
  };

  const handleSelectFamily = async (family) => {
    setFamilySearchQuery(family.familyNumber);
    setFamilyStudents([]);
    setCommonFeeAmount('');
    
    try {
      const studentIds = family.students.map(s => s._id);
      const suggestedResponse = await feeService.getSuggestedFees(studentIds, familyVoucherData.feeType);
      const suggestedFees = suggestedResponse.data || {};
      
      const studentsWithFees = family.students.map(s => ({
        ...s,
        selected: true,
        feeAmount: suggestedFees[s._id]?.amount || suggestedFees[s._id?.toString()]?.amount || 5000
      }));
      
      setSelectedFamilyStudents(studentsWithFees);
      
      const suggestedAmount = suggestedFees[studentIds[0]]?.amount || suggestedFees[studentIds[0]?.toString()]?.amount || 5000;
      setCommonFeeAmount(suggestedAmount.toString());
      
    } catch (err) {
      console.error('Error fetching suggested fees:', err);
      setSelectedFamilyStudents(family.students.map(s => ({ ...s, selected: true, feeAmount: 5000 })));
      setCommonFeeAmount('5000');
    }
  };

  const handleCreateFamilyVouchers = async () => {
    const selectedStudents = selectedFamilyStudents.filter(s => s.selected !== false);
    
    if (selectedStudents.length === 0) {
      showToast('Please select at least one student', 'warning');
      return;
    }
    
    const totalAmount = selectedStudents.reduce((sum, s) => sum + (parseFloat(s.feeAmount) || 0), 0);
    if (totalAmount === 0) {
      showToast('Please enter fee amounts for selected students', 'warning');
      return;
    }
    
    if (!familyVoucherData.dueDate) {
      showToast('Please select a due date', 'warning');
      return;
    }
    
    setCalculating(true);
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      
      const voucherData = {
        school: schoolId,
        feeType: 'Family',
        amount: totalAmount,
        paidAmount: 0,
        dueDate: new Date(familyVoucherData.dueDate),
        status: 'Pending',
        description: familyVoucherData.description || `${familyVoucherData.feeType} for Family ${familySearchQuery} (${selectedStudents.length} students)`,
        familyNumber: familySearchQuery,
        familyMembers: selectedStudents.map(s => ({
          studentId: s._id,
          studentName: `${s.firstName} ${s.lastName}`,
          studentCode: s.studentId,
          className: s.classGrade?.name || s.class?.name || '-',
          feeAmount: parseFloat(s.feeAmount) || 0
        }))
      };
      
      const response = await feeService.create(voucherData);
      
      showToast(`Created family voucher for ${selectedStudents.length} students in family ${familySearchQuery}`, 'success');
      setShowFamilyVoucherModal(false);
      loadData();
      
      generateFamilyChallanPDF({
        familyNumber: familySearchQuery,
        voucher: response.data,
        totalAmount
      });
      
    } catch (err) {
      console.error('Error creating family voucher:', err);
      showToast('Error creating voucher: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setCalculating(false);
    }
  };

  const toggleFeeType = (feeType) => {
    setCalculateData(prev => {
      const selected = prev.selectedFeeTypes.includes(feeType)
        ? prev.selectedFeeTypes.filter(t => t !== feeType)
        : [...prev.selectedFeeTypes, feeType];
      return { ...prev, selectedFeeTypes: selected };
    });
  };

  const updateFeeAmount = (feeType, amount) => {
    setCalculateData(prev => ({
      ...prev,
      feeAmounts: { ...prev.feeAmounts, [feeType]: parseFloat(amount) || 0 }
    }));
  };

  const selectAllFeeTypes = () => {
    setCalculateData(prev => ({
      ...prev,
      selectedFeeTypes: availableFeeTypes.map(t => t.id)
    }));
  };

  const deselectAllFeeTypes = () => {
    setCalculateData(prev => ({
      ...prev,
      selectedFeeTypes: []
    }));
  };

  const handleDownloadVoucher = (student) => {
    const studentFees = fees.filter(f => f.student?._id === student._id || f.student === student._id);
    generateFeeVoucherPDF({
      student: { fullName: `${student.firstName} ${student.lastName}` },
      father: { fullName: student.parentName },
      studentId: student.studentId,
      classGrade: student.class?.name || '-'
    }, studentFees);
  };

  const handleDownloadFamilyChallan = (fee) => {
    if (!fee.familyNumber || !fee.familyMembers) {
      showToast('This is not a family voucher', 'warning');
      return;
    }
    generateFamilyChallanPDF({
      familyNumber: fee.familyNumber,
      voucher: fee,
      totalAmount: fee.amount
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const schoolId = localStorage.getItem('currentSchoolId');
      const data = { ...formData, amount: parseFloat(formData.amount), school: schoolId };
      if (editingFee) {
        await feeService.update(editingFee._id, data);
      } else {
        await feeService.create(data);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Save failed:', error);
      showToast(error.response?.data?.message || 'Failed to save fee', 'error');
    }
  };

  const handlePayment = async () => {
    if (!selectedFee) return;
    try {
      await feeService.recordPayment(selectedFee._id, {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference
      });
      setShowPaymentModal(false);
      setSelectedFee(null);
      setPaymentData({ amount: '', method: 'Cash', reference: '' });
      loadData();
    } catch (error) {
      console.error('Payment failed:', error);
      showToast(error.response?.data?.message || 'Failed to record payment', 'error');
    }
  };

  const handleEdit = (fee) => {
    setEditingFee(fee);
    setFormData({
      student: fee.student?._id || '',
      feeType: fee.feeType,
      amount: fee.amount,
      dueDate: fee.dueDate?.split('T')[0] || '',
      academicYear: fee.academicYear || '',
      term: fee.term || '',
      description: fee.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await feeService.delete(id);
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const resetForm = () => {
    setEditingFee(null);
    setFormData({ student: '', feeType: 'Tuition', amount: '', dueDate: '', academicYear: '', term: '', description: '' });
    setStudentSearch('');
  };

  useEffect(() => {
    if (editingFee && students.length > 0) {
      const student = students.find(s => s._id === editingFee.student?._id || s._id === editingFee.student);
      if (student) {
        setStudentSearch(`${student.studentId || ''} - ${student.firstName || ''} ${student.lastName || ''}`);
        setFormData(prev => ({ ...prev, student: student._id }));
      }
    }
  }, [editingFee, students]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-gray-100 text-gray-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    return convert(Math.floor(Math.abs(num)));
  };

  const filteredStudents = studentSearch.length >= 2 ? searchResults : students.slice(0, 50);

  useEffect(() => {
    if (studentSearch.length >= 2) {
      const searchStudents = async () => {
        setSearching(true);
        try {
          const response = await studentService.searchAll(studentSearch);
          setSearchResults(response.data?.students || response.data || []);
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      };
      const debounce = setTimeout(searchStudents, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [studentSearch]);

  const handleStudentSelect = (student) => {
    setFormData({ ...formData, student: student._id });
    setStudentSearch(`${student.studentId || ''} - ${student.firstName || ''} ${student.lastName || ''}`);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const clearStudent = () => {
    setFormData({ ...formData, student: '' });
    setStudentSearch('');
    setSearchResults([]);
  };

  const handleSelectAllFees = () => {
    if (selectAll) {
      setSelectedFees([]);
      setSelectAll(false);
    } else {
      setSelectedFees(filteredFees.map(f => f._id));
      setSelectAll(true);
    }
  };

  const handleSelectFee = (feeId) => {
    if (selectedFees.includes(feeId)) {
      setSelectedFees(selectedFees.filter(id => id !== feeId));
    } else {
      setSelectedFees([...selectedFees, feeId]);
    }
  };

  const handleCleanupOrphanFees = async () => {
    if (!confirm('This will delete fee records with invalid student references. Continue?')) return;
    
    try {
      const response = await api.post('/fees/cleanup-orphans');
      if (response.status === 200 || response.status === 201) {
        showToast(`Cleaned up ${response.data.deleted} orphan fee records`, 'success');
        loadData();
      } else {
        showToast(response.data.message || 'Cleanup failed', 'error');
      }
    } catch (err) {
      showToast('Failed to cleanup orphan fees', 'error');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFees.length === 0) {
      showToast('Please select at least one fee record to download', 'warning');
      return;
    }
    
    try {
      const selectedFeeRecords = filteredFees.filter(f => selectedFees.includes(f._id));
      
      const feesData = selectedFeeRecords.map(fee => ({
        student: {
          fullName: fee.student?.firstName && fee.student?.lastName 
            ? `${fee.student.firstName} ${fee.student.lastName}` 
            : fee.student?.fullName || '-',
          studentId: fee.student?.studentId || fee.studentId || '-',
          classGrade: fee.student?.classGrade?.name || fee.classGrade?.name || '-',
          fatherName: fee.student?.parentName || '-',
          phone: fee.student?.phone || fee.student?.parentPhone || '-',
          familyNumber: fee.student?.familyNumber || ''
        },
        fees: [{
          voucherNumber: fee.voucherNumber,
          feeType: fee.feeType,
          amount: fee.amount,
          paidAmount: fee.paidAmount,
          dueDate: fee.dueDate,
          createdAt: fee.createdAt
        }]
      }));
      
      await generateBulkFeeVouchersPDF(feesData);
      showToast(`Downloaded ${selectedFees.length} fee vouchers`, 'success');
    } catch (err) {
      console.error('Error generating bulk vouchers:', err);
      showToast('Failed to generate bulk vouchers', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading fees...</p>
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
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Fees</h3>
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
          <h1 className="text-2xl font-bold text-gray-800">Fees</h1>
          <p className="text-gray-500">Manage student fees and payments</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedFees.length > 0 && (
            <button onClick={handleBulkDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm">
              <FileText size={18} /> Download Selected ({selectedFees.length})
            </button>
          )}
          <button onClick={() => setShowCalculateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm">
            <Calculator size={18} /> Calculate Monthly Fees
          </button>
          <button onClick={handleOpenFamilyVoucher}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm">
            <UsersRound size={18} /> Create Family Voucher
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus size={18} /> Add Fee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">From:</span>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">To:</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Class:</span>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">All Classes</option>
            {classGrades.map(cg => (
              <option key={cg._id} value={cg._id}>{cg.name} ({cg.code})</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, voucher #, or family #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <button
            onClick={() => {
              setSelectedClass('');
              setSelectedStatus('');
              setSearchQuery('');
              setDateRange({
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
              });
            }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
          >
            Clear Filters
          </button>
          <button
            onClick={handleCleanupOrphanFees}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
            title="Remove orphan fee records"
          >
            Cleanup Orphans
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing fees from <span className="font-medium">{dateRange.startDate}</span> to <span className="font-medium">{dateRange.endDate}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg"><DollarSign className="text-blue-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Total Fees</p>
              <p className="text-xl font-bold">PKR {fees.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg"><Check className="text-green-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-xl font-bold text-green-600">PKR {fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg"><DollarSign className="text-orange-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-orange-600">PKR {fees.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg"><DollarSign className="text-red-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Records</p>
              <p className="text-xl font-bold text-red-600">{fees.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {fees.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Fees Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding the first fee record</p>
            <button onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add First Fee</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAllFees}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Voucher #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Roll No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedFees.map((fee) => {
                  const student = students.find(s => s._id === (fee.student?._id || fee.student));
                  const classGrade = student?.classGrade ? classGrades.find(cg => cg._id === (student.classGrade._id || student.classGrade)) : null;
                  const isFamilyVoucher = fee.feeType === 'Family' && fee.familyNumber;
                  const isSelected = selectedFees.includes(fee._id);
                  
                  return (
                    <tr key={fee._id} className={`hover:bg-gray-50 ${isFamilyVoucher ? 'bg-amber-50' : ''} ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectFee(fee._id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {fee.voucherNumber || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {isFamilyVoucher ? (
                          <span className="font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded text-xs">
                            FAM
                          </span>
                        ) : (
                          <span className="font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">
                            {fee.student?.studentId || student?.studentId || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isFamilyVoucher ? (
                          <div>
                            <p className="font-medium text-amber-700">Family Voucher</p>
                            <p className="text-xs text-gray-500">Family #{fee.familyNumber} ({fee.familyMembers?.length || 0} members)</p>
                          </div>
                        ) : (
                          <p className="font-medium">{fee.student?.firstName} {fee.student?.lastName}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        {isFamilyVoucher ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                            Family
                          </span>
                        ) : classGrade ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {classGrade.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm hidden lg:table-cell">{fee.feeType}</td>
                      <td className="px-4 py-4 text-sm text-right font-medium">PKR {fee.amount?.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-right text-green-600 hidden sm:table-cell">PKR {fee.paidAmount?.toLocaleString()}</td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(fee.status)}`}>{fee.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {fee.status !== 'Paid' && (
                            <button onClick={() => { setSelectedFee(fee); setPaymentData({ amount: fee.amount - fee.paidAmount, method: 'Cash', reference: '' }); setShowPaymentModal(true); }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Record Payment">
                              <DollarSign size={14} />
                            </button>
                          )}
                          {isFamilyVoucher ? (
                            <button onClick={() => handleDownloadFamilyChallan(fee)} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg" title="Download Family Challan">
                              <FileDown size={14} />
                            </button>
                          ) : (
                            <button onClick={() => handleDownloadVoucher(fee.student)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Download Voucher">
                              <FileDown size={14} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(fee)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(fee._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {fees.length > recordsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, fees.length)} of {fees.length} records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingFee ? 'Edit Fee' : 'Add New Fee'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by Roll No or Name..."
                    className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.student && (
                    <button
                      type="button"
                      onClick={clearStudent}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                  {searching && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                {showDropdown && (
                  <div className="absolute z-[9999] w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {!studentSearch && filteredStudents.length > 0 && (
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                        Showing first 50 students
                      </div>
                    )}
                    {filteredStudents.length === 0 && !searching ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        {studentSearch.length >= 2 ? 'No students found' : 'Type to search...'}
                      </div>
                    ) : (
                      filteredStudents.map((s) => (
                        <div
                          key={s._id}
                          onClick={() => handleStudentSelect(s)}
                          className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">{s.studentId || '-'}</span>
                              <span className="text-gray-800">{s.firstName} {s.lastName}</span>
                            </div>
                            {s.classGrade?.name && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{s.classGrade.name}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {!formData.student && <p className="text-xs text-red-500 mt-1">Please select a student</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                  <select value={formData.feeType}
                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {['Tuition', 'Registration', 'Library', 'Laboratory', 'Activity', 'Transportation', 'Exam', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input type="number" required step="0.01" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" required value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <input type="text" value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2024-2025" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingFee ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Balance Due: PKR {(selectedFee.amount - (selectedFee.paidAmount || 0)).toLocaleString()}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input type="number" required step="0.01" value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  {['Cash', 'Card', 'Bank Transfer', 'Online'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handlePayment} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {showCalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator size={22} className="text-green-600" /> Calculate Monthly Fees
              </h3>
              <button onClick={() => setShowCalculateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                  <input
                    type="month"
                    value={calculateData.month}
                    onChange={(e) => setCalculateData({ ...calculateData, month: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={calculateData.dueDay}
                    onChange={(e) => setCalculateData({ ...calculateData, dueDay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Select Fee Types</span>
                    <div className="flex gap-4 text-xs">
                      <button
                        type="button"
                        onClick={selectAllFeeTypes}
                        className="text-green-600 hover:text-green-800 font-medium underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFeeTypes}
                        className="text-red-600 hover:text-red-800 font-medium underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {availableFeeTypes.map((feeType, index) => (
                    <div 
                      key={feeType.id} 
                      className={`grid grid-cols-12 gap-4 items-center px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${calculateData.selectedFeeTypes.includes(feeType.id) ? 'bg-green-50/30' : ''}`}
                    >
                      <div className="col-span-5 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${calculateData.selectedFeeTypes.includes(feeType.id) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700 font-medium">{feeType.label}</span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <input
                          type="checkbox"
                          id={`fee-${feeType.id}`}
                          checked={calculateData.selectedFeeTypes.includes(feeType.id)}
                          onChange={() => toggleFeeType(feeType.id)}
                          className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number"
                          value={calculateData.feeAmounts[feeType.id] || feeType.defaultAmount}
                          onChange={(e) => updateFeeAmount(feeType.id, e.target.value)}
                          disabled={!calculateData.selectedFeeTypes.includes(feeType.id)}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-right"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-4 border-t border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Calculator size={16} /> Fee Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-green-200/50">
                      <span className="text-green-700">Selected Month:</span>
                      <span className="font-semibold text-green-900">{calculateData.month}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-green-200/50">
                      <span className="text-green-700">Fee Types Selected:</span>
                      <span className="font-semibold text-green-900">{calculateData.selectedFeeTypes.length}</span>
                    </div>
                    {calculateData.selectedFeeTypes.length > 0 && (
                      <div className="pt-1 space-y-1.5">
                        {calculateData.selectedFeeTypes.map(type => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="text-green-600">• {type}</span>
                            <span className="text-green-800 font-medium">PKR {(calculateData.feeAmounts[type] || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-green-400">
                      <span className="text-green-800 font-bold">Total Per Student:</span>
                      <span className="text-green-900 font-bold text-lg">PKR {Object.entries(calculateData.feeAmounts)
                        .filter(([type]) => calculateData.selectedFeeTypes.includes(type))
                        .reduce((sum, [, amt]) => sum + (amt || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">Due Date:</span>
                      <span className="text-green-700">Day {calculateData.dueDay} of {calculateData.month}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCalculateModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCalculateMonthlyFees}
                disabled={calculating}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-colors"
              >
                {calculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Calculator size={18} /> Calculate & Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFamilyVoucherModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create Family Voucher</h3>
                <p className="text-sm text-slate-500">Create fee vouchers for family members with individual fee selection</p>
              </div>
              <button onClick={() => setShowFamilyVoucherModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Family Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={familySearchQuery}
                      onChange={(e) => {
                        setFamilySearchQuery(e.target.value);
                        setSelectedFamilyStudents([]);
                      }}
                      placeholder="Enter family number (e.g., 301)"
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 bg-gray-50"
                    />
                    <button 
                      onClick={handleSearchFamily} 
                      className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                      disabled={loadingFamilyStudents}
                    >
                      {loadingFamilyStudents ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
                
                {familyStudents.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Found Families:</p>
                    {familyStudents.map(family => (
                      <button
                        key={family.familyNumber}
                        onClick={() => handleSelectFamily(family)}
                        className="w-full text-left p-3 bg-white rounded-lg mb-2 hover:bg-amber-50 border border-slate-200"
                      >
                        <div className="font-semibold text-amber-600">{family.familyNumber}</div>
                        <div className="text-sm text-slate-500">
                          {family.students.length} student(s): {family.students.map(s => `${s.firstName} ${s.lastName}`).join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedFamilyStudents.length > 0 && (
                  <>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-amber-700">
                          Family: {familySearchQuery} ({selectedFamilyStudents.length} members)
                        </p>
                        <UsersRound size={20} className="text-amber-600" />
                      </div>
                      
                      <div className="mb-3 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFamilyStudents.every(s => s.selected !== false)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFamilyStudents(selectedFamilyStudents.map(s => ({ ...s, selected: true })));
                              } else {
                                setSelectedFamilyStudents(selectedFamilyStudents.map(s => ({ ...s, selected: false })));
                              }
                            }}
                            className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                          />
                          <span className="text-sm font-medium text-amber-700">Select All</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600">Set all:</span>
                          <input
                            type="number"
                            placeholder="PKR"
                            value={commonFeeAmount}
                            onChange={(e) => setCommonFeeAmount(e.target.value)}
                            className="w-24 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            onClick={() => {
                              if (commonFeeAmount) {
                                setSelectedFamilyStudents(selectedFamilyStudents.map(s => ({ ...s, feeAmount: commonFeeAmount })));
                              }
                            }}
                            className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 font-medium"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedFamilyStudents.map((student, index) => (
                          <div key={student._id} className="flex items-center gap-3 bg-white rounded-lg p-3">
                            <input
                              type="checkbox"
                              checked={student.selected !== false}
                              onChange={(e) => {
                                const updated = [...selectedFamilyStudents];
                                updated[index] = { ...student, selected: e.target.checked };
                                setSelectedFamilyStudents(updated);
                              }}
                              className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                            />
                            <UsersRound size={16} className="text-amber-600" />
                            <span className="flex-1 text-sm font-medium">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {student.studentId}
                            </span>
                            <span className="text-xs text-slate-500">
                              {student.classGrade?.name || student.class?.name || '-'}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">PKR</span>
                              <input
                                type="number"
                                value={student.feeAmount || ''}
                                onChange={(e) => {
                                  const updated = [...selectedFamilyStudents];
                                  updated[index] = { ...student, feeAmount: e.target.value };
                                  setSelectedFamilyStudents(updated);
                                }}
                                placeholder="0"
                                className="w-24 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-amber-500 text-right"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Voucher Details</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Fee Type</label>
                          <select
                            value={familyVoucherData.feeType}
                            onChange={(e) => setFamilyVoucherData({ ...familyVoucherData, feeType: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                          >
                            <option value="Monthly Tuition">Monthly Tuition</option>
                            <option value="Admission Fee">Admission Fee</option>
                            <option value="Exam Fee">Exam Fee</option>
                            <option value="Transport Fee">Transport Fee</option>
                            <option value="Annual Charges">Annual Charges</option>
                            <option value="Development Fund">Development Fund</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={familyVoucherData.dueDate}
                            onChange={(e) => setFamilyVoucherData({ ...familyVoucherData, dueDate: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                        <input
                          type="text"
                          value={familyVoucherData.description}
                          onChange={(e) => setFamilyVoucherData({ ...familyVoucherData, description: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                          placeholder="e.g., January 2024 Tuition Fee"
                        />
                      </div>
                      
                      <div className="bg-indigo-50 rounded-lg p-4 mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">
                            Selected: {selectedFamilyStudents.filter(s => s.selected !== false).length} students
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700">Total Amount:</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            PKR {selectedFamilyStudents
                              .filter(s => s.selected !== false)
                              .reduce((sum, s) => sum + (parseFloat(s.feeAmount) || 0), 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {(() => {
                            const selected = selectedFamilyStudents.filter(s => s.selected !== false);
                            const total = selected.reduce((sum, s) => sum + (parseFloat(s.feeAmount) || 0), 0);
                            const count = selected.length;
                            if (count > 0 && total > 0) {
                              return `Average: PKR ${Math.round(total / count).toLocaleString()} per student`;
                            }
                            return 'Enter fee amounts above to calculate total';
                          })()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t bg-slate-50">
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowFamilyVoucherModal(false)} className="px-5 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700">
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFamilyVouchers} 
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={selectedFamilyStudents.filter(s => s.selected !== false).length === 0 || !familyVoucherData.dueDate || calculating || selectedFamilyStudents.filter(s => s.selected !== false).reduce((sum, s) => sum + (parseFloat(s.feeAmount) || 0), 0) === 0}
                >
                  {calculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>Create Challan ({selectedFamilyStudents.filter(s => s.selected !== false).length} Students)</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fees;
