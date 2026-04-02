import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';

function ReportCardModal({ exam, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStudents();
  }, []);
  
  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const response = await fetch('/api/students/all?all=true', { headers });
      const data = await response.json();
      const studentsList = data.students || data || [];
      
      // Get the classGrade ID from exam (could be string or object)
      const examClassGradeId = typeof exam.classGrade === 'object' 
        ? exam.classGrade?._id 
        : exam.classGrade;
      
      const classStudents = studentsList.filter(s => {
        const studentClassId = typeof s.classGrade === 'object' 
          ? s.classGrade?._id 
          : s.classGrade;
        return studentClassId?.toString() === examClassGradeId?.toString();
      });
      
      setStudents(classStudents);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const generateReportCard = async (student) => {
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const response = await fetch(`/api/marks/exam/${exam._id}`, { headers });
      const marks = await response.json();
      
      const studentId = student._id.toString();
      const studentMarks = marks.filter(m => {
        const markStudentId = (m.student?._id || m.student || '').toString();
        return markStudentId === studentId;
      });
      
      if (studentMarks.length === 0) {
        alert('No marks found for this student');
        return;
      }
      
      const totalMarks = studentMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
      const totalMax = studentMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
      const percentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : 0;
      
      let grade = '';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';
      else grade = 'F';
      
      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Report Card - ${exam.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #333; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .info-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .info-item label { font-weight: bold; display: block; color: #666; font-size: 12px; }
            .info-item span { font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4a90d9; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { text-align: right; font-size: 18px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
            .grade-box { text-align: center; margin-top: 20px; padding: 20px; background: #4a90d9; color: white; border-radius: 10px; }
            .grade-box .grade { font-size: 48px; font-weight: bold; }
            .grade-box .remark { font-size: 14px; margin-top: 5px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${exam.name}</h1>
            <p>Academic Year: ${exam.academicYearName || new Date().getFullYear()}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>Student Name</label>
              <span>${student.firstName} ${student.lastName}</span>
            </div>
            <div class="info-item">
              <label>Student ID</label>
              <span>${student.studentId || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>Class</label>
              <span>${exam.classGrade?.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>Exam Date</label>
              <span>${exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Marks Obtained</th>
                <th>Maximum Marks</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${studentMarks.map(m => {
                const pct = m.maxMarks > 0 ? ((m.marksObtained / m.maxMarks) * 100).toFixed(1) : 0;
                return `<tr>
                  <td>${m.subject?.name || 'N/A'}</td>
                  <td>${m.marksObtained}</td>
                  <td>${m.maxMarks}</td>
                  <td>${pct}%</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <p>Total Marks: ${totalMarks} / ${totalMax}</p>
            <p>Percentage: ${percentage}%</p>
          </div>
          
          <div class="grade-box">
            <div class="grade">${grade}</div>
            <div class="remark">
              ${percentage >= 90 ? 'Outstanding Performance!' :
                percentage >= 80 ? 'Excellent Performance!' :
                percentage >= 70 ? 'Very Good Performance!' :
                percentage >= 60 ? 'Good Performance!' :
                percentage >= 50 ? 'Needs Improvement' : 'Below Expectations'}
            </div>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };
  
  const printAllReportCards = async () => {
    if (students.length === 0) {
      alert('No students found');
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      const schoolId = localStorage.getItem('currentSchoolId');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (schoolId) headers['x-school-id'] = schoolId;
      
      const response = await fetch(`/api/marks/exam/${exam._id}`, { headers });
      const marks = await response.json();
      
      if (marks.length === 0) {
        alert('No marks found');
        return;
      }
      
      // Get unique subjects from marks
      const subjects = [...new Set(marks.map(m => m.subject?._id || m.subject))].filter(Boolean);
      
      // Build student data with marks grouped by student
      const studentData = students.map(student => {
        const studentId = student._id.toString();
        const studentMarks = marks.filter(m => {
          const markStudentId = (m.student?._id || m.student || '').toString();
          return markStudentId === studentId;
        });
        
        const totalMarks = studentMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
        const totalMax = studentMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
        const percentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : 0;
        
        let grade = '';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else grade = 'F';
        
        return {
          student,
          studentMarks,
          totalMarks,
          totalMax,
          percentage,
          grade
        };
      }).filter(s => s.studentMarks.length > 0);
      
      // Get subject names
      const subjectNames = {};
      marks.forEach(m => {
        if (m.subject?._id && m.subject?.name) {
          subjectNames[m.subject._id] = m.subject.name;
        }
      });
      
      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Result Sheet - ${exam.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #333; }
            .header p { margin: 5px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 6px; text-align: center; }
            th { background-color: #4a90d9; color: white; font-weight: bold; }
            th:first-child { text-align: left; }
            td:first-child { text-align: left; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .grade-col { font-weight: bold; }
            .grade-Aplus { color: #16a34a; }
            .grade-A { color: #16a34a; }
            .grade-B { color: #2563eb; }
            .grade-C { color: #ca8a04; }
            .grade-D { color: #ea580c; }
            .grade-F { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${exam.name}</h1>
            <p>Class: ${exam.classGrade?.name || 'N/A'} | Academic Year: ${exam.academicYearName || new Date().getFullYear()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Roll No</th>
                <th>Student Name</th>
                ${subjects.map(subId => `<th>${subjectNames[subId] || 'Subject'}</th>`).join('')}
                <th>Total</th>
                <th>%</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${studentData.map((data, index) => {
                const gradeClass = data.percentage >= 90 ? 'grade-Aplus' : 
                                   data.percentage >= 80 ? 'grade-A' : 
                                   data.percentage >= 70 ? 'grade-B' : 
                                   data.percentage >= 60 ? 'grade-C' : 
                                   data.percentage >= 50 ? 'grade-D' : 'grade-F';
                
                // Create marks map for quick lookup
                const marksMap = {};
                data.studentMarks.forEach(m => {
                  const subId = m.subject?._id || m.subject;
                  marksMap[subId] = m.marksObtained;
                });
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${data.student.studentId || '-'}</td>
                    <td>${data.student.firstName} ${data.student.lastName}</td>
                    ${subjects.map(subId => `<td>${marksMap[subId] || '-'}</td>`).join('')}
                    <td>${data.totalMarks}/${data.totalMax}</td>
                    <td>${data.percentage}%</td>
                    <td class="grade-col ${gradeClass}">${data.grade}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } catch (err) {
      console.error('Failed to generate reports:', err);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Report Cards</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium">{exam.name}</h4>
          <p className="text-sm text-gray-500">{exam.classGrade?.name || 'N/A'}</p>
        </div>
        
        <button
          onClick={printAllReportCards}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium mb-4"
        >
          <FileText size={18} /> Print All Report Cards
        </button>
        
        <p className="text-sm text-gray-500 mb-2">Or select individual student:</p>
        
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No students found</div>
          ) : (
            <div className="divide-y">
              {students.map(student => (
                <button
                  key={student._id}
                  onClick={() => generateReportCard(student)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>
                    {student.firstName} {student.lastName}
                    <span className="text-gray-400 text-sm ml-2">{student.studentId}</span>
                  </span>
                  <FileText size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportCardModal;
