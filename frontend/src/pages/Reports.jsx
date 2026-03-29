import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, FileText, Download, Users, BookOpen, DollarSign, Calendar, TrendingUp, Filter, Printer, User, Briefcase, FileSpreadsheet } from 'lucide-react';
import { classGradeService, studentService, attendanceService, feeService, teacherService, expenseService } from '../services/api';
import { generateSOAPDF, generateTeacherSOAPDF, generateFamilyChallanPDF } from '../utils/pdfGenerator';
import LetterHeadPrint from '../components/LetterHeadPrint';
import useToast from '../hooks/useToast';

function Reports() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [reportType, setReportType] = useState('students');
  const [classGrades, setClassGrades] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // SOA State
  const [soaEntityType, setSoaEntityType] = useState('student');
  const [soaEntity, setSoaEntity] = useState('');
  const [soaDateRange, setSoaDateRange] = useState({ from: '', to: '' });
  const [soaRecordType, setSoaRecordType] = useState('all');
  const [soaRecords, setSoaRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [familyVouchers, setFamilyVouchers] = useState([]);
  const [loadingSOA, setLoadingSOA] = useState(false);

  useEffect(() => {
    loadClasses();
    loadTeachersAndStaff();
    loadAllStudentsForSOA();
    loadFamilyVouchers();
  }, []);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    const idParam = searchParams.get('id');
    if (typeParam === 'soa' && idParam) {
      const entityType = searchParams.get('entity') || 'student';
      setReportType('soa');
      setSoaEntityType(entityType);
      setSoaEntity(idParam);
      loadEntityForSOA(entityType, idParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedClass) {
      loadReportData();
    }
  }, [reportType, selectedClass, selectedSection]);

  const loadTeachersAndStaff = async () => {
    try {
      const [teachersRes, staffRes] = await Promise.all([
        teacherService.getAll(),
        expenseService.getStaff()
      ]);
      setTeachers(teachersRes.data || []);
      setStaffMembers(staffRes.data || []);
    } catch (err) {
      console.error('Failed to load teachers/staff');
    }
  };

  const loadAllStudentsForSOA = async () => {
    try {
      const response = await studentService.getAll();
      const data = response.data;
      const studentsList = data.students || data || [];
      setStudents(studentsList);
    } catch (err) {
      console.error('Failed to load students for SOA');
    }
  };

  const loadFamilyVouchers = async () => {
    try {
      const response = await feeService.getFamily();
      const data = response.data || [];
      setFamilyVouchers(data);
    } catch (err) {
      console.error('Failed to load family vouchers');
    }
  };

  const loadEntityForSOA = async (entityType, entityId) => {
    try {
      if (entityType === 'teacher') {
        const response = await teacherService.getById(entityId);
        if (response.data) {
          setTeachers(prev => {
            const exists = prev.find(t => t._id === entityId);
            if (!exists) {
              return [...prev, response.data];
            }
            return prev;
          });
        }
        setTimeout(() => loadSOARecords(), 300);
      } else if (entityType === 'staff') {
        const staffList = staffMembers.length > 0 ? staffMembers : [];
        const staffMember = staffList.find(s => s._id === entityId);
        if (!staffMember) {
          setStaffMembers(prev => [...prev, { _id: entityId, firstName: 'Loading...', lastName: '' }]);
        }
        setTimeout(() => loadSOARecords(), 300);
      } else if (entityType === 'family') {
        setTimeout(() => loadSOARecords(), 300);
      } else {
        setTimeout(() => loadSOARecords(), 300);
      }
    } catch (err) {
      console.error('Failed to load entity for SOA:', err);
      setTimeout(() => loadSOARecords(), 300);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classGradeService.getAll();
      const data = response.data;
      setClassGrades(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedClass(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load classes');
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes, feesRes] = await Promise.all([
        studentService.getAll(),
        attendanceService.getAll(),
        feeService.getAll()
      ]);

      const studentsData = studentsRes.data;
      const attendanceData = attendanceRes.data;
      const feesData = feesRes.data;

      const studentsList = studentsData.students || studentsData || [];
      const attendanceList = attendanceData.data || attendanceData || [];
      const feesList = feesData.data || feesData || [];

      let filteredStudents = studentsList;
      if (selectedClass) {
        filteredStudents = studentsList.filter(s => 
          s.classGrade === selectedClass || s.classGrade?._id === selectedClass
        );
      }
      if (selectedSection) {
        filteredStudents = filteredStudents.filter(s => 
          s.section === selectedSection || s.section?._id === selectedSection
        );
      }

      setStudents(filteredStudents);
      setAttendance(attendanceList);
      setFees(feesList);

      generateReport(reportType, filteredStudents, attendanceList, feesList);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load report data');
      setLoading(false);
    }
  };

  const generateReport = (type, studentsList, attendanceList, feesList) => {
    switch (type) {
      case 'students':
        setReportData({
          title: 'Student Report',
          headers: ['ID', 'Name', 'Class', 'Section', 'Status'],
          rows: studentsList.map(s => [
            s.studentId || '-',
            `${s.firstName} ${s.lastName}`,
            s.classGrade?.name || '-',
            s.section?.name || '-',
            s.status || 'Active'
          ]),
          summary: {
            total: studentsList.length,
            active: studentsList.filter(s => s.status === 'Active').length,
            inactive: studentsList.filter(s => s.status !== 'Active').length
          }
        });
        break;

      case 'attendance':
        const classStudentIds = studentsList.map(s => s._id);
        const classAttendance = attendanceList.filter(a => 
          classStudentIds.includes(a.student?._id || a.student)
        );
        const presentCount = classAttendance.filter(a => a.status === 'Present').length;
        const absentCount = classAttendance.filter(a => a.status === 'Absent').length;
        const lateCount = classAttendance.filter(a => a.status === 'Late').length;
        const total = classAttendance.length;

        setReportData({
          title: 'Attendance Report',
          headers: ['Date', 'Present', 'Absent', 'Late', 'Total', 'Attendance %'],
          rows: getAttendanceByDate(classAttendance),
          summary: {
            totalRecords: total,
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            percentage: total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0
          }
        });
        break;

      case 'fees':
        const classFees = feesList.filter(f => {
          const student = studentsList.find(s => s._id === (f.student?._id || f.student));
          return student !== undefined;
        });
        const totalFees = classFees.reduce((sum, f) => sum + (f.amount || 0), 0);
        const totalCollected = classFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const totalPending = totalFees - totalCollected;

        setReportData({
          title: 'Fee Collection Report',
          headers: ['Student', 'Type', 'Amount', 'Paid', 'Pending', 'Status'],
          rows: classFees.map(f => {
            const student = studentsList.find(s => s._id === (f.student?._id || f.student));
            return [
              student ? `${student.firstName} ${student.lastName}` : '-',
              f.feeType || '-',
              `PKR ${(f.amount || 0).toLocaleString()}`,
              `PKR ${(f.paidAmount || 0).toLocaleString()}`,
              `PKR ${((f.amount || 0) - (f.paidAmount || 0)).toLocaleString()}`,
              f.status || 'Pending'
            ];
          }),
          summary: {
            totalFees: totalFees,
            totalCollected: totalCollected,
            totalPending: totalPending,
            collectionRate: totalFees > 0 ? ((totalCollected / totalFees) * 100).toFixed(1) : 0
          }
        });
        break;

      case 'grades':
        setReportData({
          title: 'Grade Report',
          headers: ['Student', 'Subject', 'Marks', 'Max Marks', 'Percentage', 'Grade'],
          rows: [],
          summary: {
            totalStudents: studentsList.length,
            classes: 1
          },
          message: 'Marks data will appear here after entering exam marks'
        });
        break;

      case 'finance':
        const finClassFees = feesList.filter(f => {
          const student = studentsList.find(s => s._id === (f.student?._id || f.student));
          return student !== undefined;
        });
        const income = finClassFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);

        setReportData({
          title: 'Financial Report',
          headers: ['Category', 'Amount'],
          rows: [
            ['Total Fee Collection', `PKR ${income.toLocaleString()}`],
            ['Total Students', studentsList.length.toString()],
            ['Average Fee', `PKR ${studentsList.length > 0 ? Math.round(income / studentsList.length).toLocaleString() : 0}`]
          ],
          summary: {
            income: income,
            expenses: 0,
            balance: income
          }
        });
        break;

      default:
        setReportData(null);
    }
  };

  const getAttendanceByDate = (attendanceList) => {
    const dateMap = {};
    attendanceList.forEach(a => {
      const date = a.date?.split('T')[0] || 'Unknown';
      if (!dateMap[date]) {
        dateMap[date] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      dateMap[date][a.status?.toLowerCase() || 'present']++;
      dateMap[date].total++;
    });

    return Object.entries(dateMap).map(([date, data]) => [
      new Date(date).toLocaleDateString(),
      data.present.toString(),
      data.absent.toString(),
      data.late.toString(),
      data.total.toString(),
      data.total > 0 ? `${((data.present / data.total) * 100).toFixed(1)}%` : '0%'
    ]);
  };

  const getSections = () => {
    if (!selectedClass) return [];
    const classData = classGrades.find(c => c._id === selectedClass);
    return classData?.sections || [];
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypes = [
    { id: 'students', name: 'Student Report', icon: Users, color: 'blue' },
    { id: 'attendance', name: 'Attendance Report', icon: Calendar, color: 'green' },
    { id: 'fees', name: 'Fee Report', icon: DollarSign, color: 'purple' },
    { id: 'grades', name: 'Grade Report', icon: TrendingUp, color: 'orange' },
    { id: 'finance', name: 'Financial Report', icon: BarChart3, color: 'red' },
    { id: 'soa', name: 'Statement of Account', icon: FileText, color: 'indigo' }
  ];

  // SOA Functions
  const getEntitiesForType = () => {
    switch (soaEntityType) {
      case 'student':
        return students.length > 0 ? students : [];
      case 'teacher':
        return teachers;
      case 'staff':
        return staffMembers;
      default:
        return [];
    }
  };

  const loadSOARecords = async () => {
    if (!soaEntity && soaEntityType !== 'family') {
      toast.warning('Please select an entity');
      return;
    }

    setLoadingSOA(true);
    try {
      if (soaEntityType === 'student') {
        const response = await feeService.getByStudent(soaEntity);
        let records = response.data || [];
        
        if (soaRecordType === 'fees') {
          records = records.filter(r => r.feeType !== 'Fine');
        } else if (soaRecordType === 'fines') {
          records = records.filter(r => r.feeType === 'Fine');
        }
        
        if (soaDateRange.from && soaDateRange.to) {
          records = records.filter(r => {
            const date = new Date(r.dueDate);
            return date >= new Date(soaDateRange.from) && date <= new Date(soaDateRange.to + 'T23:59:59');
          });
        }
        
        setSoaRecords(records);
      } else if (soaEntityType === 'teacher') {
        const response = await expenseService.getByTeacher(soaEntity);
        let records = response.data || [];
        
        if (soaDateRange.from && soaDateRange.to) {
          records = records.filter(r => {
            const date = new Date(r.date);
            return date >= new Date(soaDateRange.from) && date <= new Date(soaDateRange.to + 'T23:59:59');
          });
        }
        
        setSoaRecords(records);
      } else if (soaEntityType === 'staff') {
        const response = await expenseService.getByStaff(soaEntity);
        let records = response.data || [];
        
        if (soaDateRange.from && soaDateRange.to) {
          records = records.filter(r => {
            const date = new Date(r.date);
            return date >= new Date(soaDateRange.from) && date <= new Date(soaDateRange.to + 'T23:59:59');
          });
        }
        
        setSoaRecords(records);
      } else if (soaEntityType === 'family') {
        let records = [...familyVouchers];
        
        if (soaEntity) {
          records = records.filter(r => 
            r._id === soaEntity || r.familyNumber === soaEntity
          );
        }
        
        if (soaDateRange.from && soaDateRange.to) {
          records = records.filter(r => {
            const date = new Date(r.dueDate);
            return date >= new Date(soaDateRange.from) && date <= new Date(soaDateRange.to + 'T23:59:59');
          });
        }
        
        setSoaRecords(records);
      }
    } catch (err) {
      console.error('Failed to load SOA records:', err);
      toast.error('Failed to load records');
    } finally {
      setLoadingSOA(false);
    }
  };

  const downloadSOAPDF = async () => {
    if (soaEntityType !== 'family' && (!soaEntity || soaRecords.length === 0)) {
      toast.warning('No records to download');
      return;
    }

    const entity = getEntitiesForType().find(e => e._id === soaEntity);
    
    if (soaEntityType === 'student') {
      generateSOAPDF({
        student: { fullName: `${entity?.firstName} ${entity?.lastName}` },
        studentId: entity?.studentId || '-',
        className: entity?.classGrade?.name || entity?.class?.name || '-',
        dateRange: soaDateRange.from && soaDateRange.to ? 
          `${new Date(soaDateRange.from).toLocaleDateString()} - ${new Date(soaDateRange.to).toLocaleDateString()}` : null
      }, soaRecords);
      toast.success('PDF downloaded successfully');
    } else if (soaEntityType === 'teacher') {
      generateTeacherSOAPDF({
        teacher: entity,
        dateRange: soaDateRange.from && soaDateRange.to ? 
          `${new Date(soaDateRange.from).toLocaleDateString()} - ${new Date(soaDateRange.to).toLocaleDateString()}` : null
      }, soaRecords, {});
      toast.success('PDF downloaded successfully');
    } else if (soaEntityType === 'staff') {
      generateTeacherSOAPDF({
        teacher: { ...entity, firstName: entity?.firstName || 'Staff', lastName: entity?.lastName || '' },
        dateRange: soaDateRange.from && soaDateRange.to ? 
          `${new Date(soaDateRange.from).toLocaleDateString()} - ${new Date(soaDateRange.to).toLocaleDateString()}` : null
      }, soaRecords, {});
      toast.success('PDF downloaded successfully');
    } else if (soaEntityType === 'family') {
      soaRecords.forEach(voucher => {
        generateFamilyChallanPDF({
          familyNumber: voucher.familyNumber,
          voucher: voucher,
          totalAmount: voucher.amount
        });
      });
      toast.success('Family Challan PDF(s) downloaded');
    }
  };

  const downloadSOAExcel = () => {
    if (!soaRecords.length) {
      toast.warning('No records to export');
      return;
    }

    const entity = getEntitiesForType().find(e => e._id === soaEntity);
    const entityName = entity ? `${entity.firstName || ''} ${entity.lastName || ''}` : (soaEntityType === 'family' ? 'Family' : 'Unknown');
    
    let csvContent = '';
    
    if (soaEntityType === 'student') {
      csvContent = 'Voucher No,Type,Fine Type,Amount,Paid,Balance,Due Date,Status\n';
      soaRecords.forEach(r => {
        csvContent += `${r.voucherNumber || '-'},${r.feeType || '-'},${r.fineType || '-'},${r.amount || 0},${r.paidAmount || 0},${(r.amount || 0) - (r.paidAmount || 0)},${r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'},${r.status || '-'}\n`;
      });
    } else if (soaEntityType === 'teacher' || soaEntityType === 'staff') {
      csvContent = 'Voucher No,Category,Description,Amount,Date\n';
      soaRecords.forEach(r => {
        csvContent += `${r.voucherNumber || '-'},${r.category || '-'},${r.description || '-'},${r.amount || 0},${r.date ? new Date(r.date).toLocaleDateString() : '-'}\n`;
      });
    } else if (soaEntityType === 'family') {
      csvContent = 'Family No,Voucher No,Members,Amount,Paid,Balance,Due Date,Status\n';
      soaRecords.forEach(r => {
        csvContent += `${r.familyNumber || '-'},${r.voucherNumber || '-'},${r.familyMembers?.length || 0},${r.amount || 0},${r.paidAmount || 0},${(r.amount || 0) - (r.paidAmount || 0)},${r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'},${r.status || '-'}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SOA_${entityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Excel file downloaded');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500">Generate class-wise reports</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Printer size={18} /> Print Report
        </button>
      </div>

      <LetterHeadPrint />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Report Types</h3>
            <div className="space-y-2">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      reportType === type.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {reportType === 'soa' ? (
            // Statement of Account Section
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={20} /> Statement of Account
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                    <select
                      value={soaEntityType}
                      onChange={(e) => { setSoaEntityType(e.target.value); setSoaEntity(''); setSoaRecords([]); }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                  
                  {soaEntityType !== 'family' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {soaEntityType === 'student' ? 'Select Student' : soaEntityType === 'teacher' ? 'Select Teacher' : 'Select Staff'}
                      </label>
                      <select
                        value={soaEntity}
                        onChange={(e) => setSoaEntity(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                      >
                        <option value="">Select...</option>
                        {soaEntityType === 'student' && students.map(s => (
                          <option key={s._id} value={s._id}>
                            {s.firstName} {s.lastName} ({s.studentId})
                          </option>
                        ))}
                        {soaEntityType === 'teacher' && teachers.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.firstName} {t.lastName}
                          </option>
                        ))}
                        {soaEntityType === 'staff' && staffMembers.map(s => (
                          <option key={s._id} value={s._id}>
                            {s.firstName} {s.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {soaEntityType === 'family' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Family Voucher</label>
                      <select
                        value={soaEntity}
                        onChange={(e) => setSoaEntity(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                      >
                        <option value="">All Family Vouchers</option>
                        {familyVouchers.map(fv => (
                          <option key={fv._id} value={fv._id}>
                            Family #{fv.familyNumber} - PKR {fv.amount?.toLocaleString()} ({fv.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {soaEntityType === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                      <select
                        value={soaRecordType}
                        onChange={(e) => setSoaRecordType(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                      >
                        <option value="all">All</option>
                        <option value="fees">Fees Only</option>
                        <option value="fines">Fines Only</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={soaDateRange.from}
                      onChange={(e) => setSoaDateRange({ ...soaDateRange, from: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={soaDateRange.to}
                      onChange={(e) => setSoaDateRange({ ...soaDateRange, to: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={loadSOARecords}
                    disabled={soaEntityType !== 'family' && !soaEntity || loadingSOA}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loadingSOA ? 'Loading...' : 'Load Records'}
                  </button>
                  <button
                    onClick={() => {
                      setSoaDateRange({
                        from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                        to: new Date().toISOString().split('T')[0]
                      });
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    This Year
                  </button>
                  <button
                    onClick={() => {
                      setSoaDateRange({
                        from: '',
                        to: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    All Time
                  </button>
                </div>
              </div>

              {soaRecords.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">
                      {soaEntityType === 'family' 
                        ? `Family Vouchers - ${soaRecords.length} Record${soaRecords.length !== 1 ? 's' : ''}` 
                        : `${getEntitiesForType().find(e => e._id === soaEntity)?.firstName || ''} ${getEntitiesForType().find(e => e._id === soaEntity)?.lastName || ''} - ${soaRecords.length} Records`
                      }
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadSOAPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <FileText size={16} /> Download PDF
                      </button>
                      <button
                        onClick={downloadSOAExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <FileSpreadsheet size={16} /> Download Excel
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-indigo-50">
                        <tr>
                          {soaEntityType === 'student' && (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Voucher #</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Type</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Amount</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Paid</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Balance</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Due Date</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-600 uppercase">Status</th>
                            </>
                          )}
                          {soaEntityType === 'teacher' && (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Voucher #</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Description</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Date</th>
                            </>
                          )}
                          {soaEntityType === 'staff' && (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Voucher #</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Description</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Date</th>
                            </>
                          )}
                          {soaEntityType === 'family' && (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Family #</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Voucher #</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-600 uppercase">Members</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Amount</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Paid</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-600 uppercase">Balance</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-600 uppercase">Due Date</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-600 uppercase">Status</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {soaRecords.map((record, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {soaEntityType === 'student' && (
                              <>
                                <td className="px-4 py-3 font-mono text-sm">{record.voucherNumber || '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    record.feeType === 'Fine' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {record.feeType || 'Fee'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-sm">PKR {record.amount?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-sm text-green-600">PKR {(record.paidAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-sm text-orange-600">PKR {(record.amount - (record.paidAmount || 0)).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm">{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    record.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                    record.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                              </>
                            )}
                            {(soaEntityType === 'teacher' || soaEntityType === 'staff') && (
                              <>
                                <td className="px-4 py-3 font-mono text-sm">{record.voucherNumber || '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    record.category === 'Deduction' ? 'bg-red-100 text-red-700' :
                                    record.category === 'Salary' ? 'bg-green-100 text-green-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {record.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm max-w-xs truncate">{record.description || '-'}</td>
                                <td className="px-4 py-3 text-right text-sm">PKR {record.amount?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm">{record.date ? new Date(record.date).toLocaleDateString() : '-'}</td>
                              </>
                            )}
                            {soaEntityType === 'family' && (
                              <>
                                <td className="px-4 py-3 font-mono text-sm font-semibold">{record.familyNumber || '-'}</td>
                                <td className="px-4 py-3 font-mono text-sm">{record.voucherNumber || '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                    {record.familyMembers?.length || 0}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium">PKR {record.amount?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-sm text-green-600">PKR {(record.paidAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-sm text-orange-600">PKR {(record.amount - (record.paidAmount || 0)).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm">{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    record.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                    record.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Regular Report Section
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <BookOpen size={14} className="inline mr-1" /> Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-[200px]"
                  >
                    <option value="">Select Class</option>
                    {classGrades.map(cg => (
                      <option key={cg._id} value={cg._id}>{cg.name} ({cg.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    disabled={!selectedClass}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-[150px] disabled:opacity-50"
                  >
                    <option value="">All Sections</option>
                    {getSections().map(s => (
                      <option key={s._id} value={s._id}>Section {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {reportType !== 'soa' && (
            <>
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading report data...</p>
                </div>
              ) : reportData ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{reportData.title}</h2>
                    <p className="text-sm text-gray-500">
                      {classGrades.find(c => c._id === selectedClass)?.name || 'All Classes'}
                      {selectedSection && ` - Section ${getSections().find(s => s._id === selectedSection)?.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Generated on</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {reportData.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {reportData.summary.total !== undefined && (
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{reportData.summary.total}</p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                    )}
                    {reportData.summary.active !== undefined && (
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.active}</p>
                        <p className="text-sm text-gray-600">Active</p>
                      </div>
                    )}
                    {reportData.summary.present !== undefined && (
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.present}</p>
                        <p className="text-sm text-gray-600">Present</p>
                      </div>
                    )}
                    {reportData.summary.absent !== undefined && (
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{reportData.summary.absent}</p>
                        <p className="text-sm text-gray-600">Absent</p>
                      </div>
                    )}
                    {reportData.summary.totalFees !== undefined && (
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">PKR {reportData.summary.totalFees.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Fees</p>
                      </div>
                    )}
                    {reportData.summary.totalCollected !== undefined && (
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">PKR {reportData.summary.totalCollected.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Collected</p>
                      </div>
                    )}
                    {reportData.summary.totalPending !== undefined && (
                      <div className="bg-orange-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-orange-600">PKR {reportData.summary.totalPending.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Pending</p>
                      </div>
                    )}
                    {reportData.summary.percentage !== undefined && (
                      <div className="bg-indigo-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-600">{reportData.summary.percentage}%</p>
                        <p className="text-sm text-gray-600">Attendance %</p>
                      </div>
                    )}
                  </div>
                )}

                {reportData.message ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>{reportData.message}</p>
                  </div>
                ) : reportData.rows && reportData.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          {reportData.headers.map((header, i) => (
                            <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportData.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {row.map((cell, j) => (
                              <td key={j} className="px-4 py-3 text-sm text-gray-800">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No data available for the selected criteria</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Select Report Options</h3>
              <p className="text-gray-500">Choose a report type and class to generate a report</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
