import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../services/api';

const formatCurrency = (amount) => {
  return (amount || 0).toLocaleString('en-PK');
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

const getLetterHead = async () => {
  try {
    const response = await api.get('/letter-head');
    return response.data;
  } catch (err) {
    return null;
  }
};

const drawLetterHead = (doc, letterHead, title = '') => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let headerHeight = 35;
  
  if (letterHead?.logo || letterHead?.headerText) {
    let yPos = 10;
    let logoAdded = false;
    
    if (letterHead?.logo) {
      try {
        const logoData = letterHead.logo;
        if (logoData && typeof logoData === 'string' && logoData.startsWith('data:')) {
          let format = 'JPEG';
          if (logoData.includes('image/png')) {
            format = 'PNG';
          } else if (logoData.includes('image/jpeg') || logoData.includes('image/jpg')) {
            format = 'JPEG';
          }
          
          try {
            doc.addImage(logoData, format, 15, 8, 30, 22);
            logoAdded = true;
          } catch (e) {
            console.warn('Could not add logo image, skipping');
          }
        }
      } catch (err) {
        console.warn('Logo processing skipped');
      }
    }
    
    const textStartX = logoAdded ? 50 : 15;
    
    if (letterHead?.headerText) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text(letterHead.headerText, textStartX, yPos + 4);
    }
    
    if (letterHead?.tagline) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(letterHead.tagline, textStartX, yPos + 10);
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    
    let contactLine = '';
    if (letterHead?.address) contactLine += letterHead.address;
    if (letterHead?.phone) contactLine += (contactLine ? ' | ' : '') + 'Ph: ' + letterHead.phone;
    if (letterHead?.email) contactLine += (contactLine ? ' | ' : '') + 'Email: ' + letterHead.email;
    
    if (contactLine) {
      doc.text(contactLine, textStartX, yPos + 16);
    }
    
    headerHeight = 30;
  }
  
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.line(15, headerHeight + 3, pageWidth - 15, headerHeight + 3);
  
  if (title) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(title, pageWidth / 2, headerHeight + 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.line(15, headerHeight + 14, pageWidth - 15, headerHeight + 14);
    return headerHeight + 18;
  }
  
  return headerHeight + 8;
};

const PAGE_HEIGHT = 277;

export const generateAdmissionPDF = async (studentData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  const letterHead = await getLetterHead();
  y = drawLetterHead(doc, letterHead, 'STUDENT ADMISSION FORM');

  const addSection = (title) => {
    if (y > PAGE_HEIGHT - 30) {
      doc.addPage();
      y = 15;
      y = drawLetterHead(doc, letterHead, 'STUDENT ADMISSION FORM (Continued)');
      y += 5;
    }
    doc.setFillColor(0, 51, 102);
    doc.rect(15, y, pageWidth - 30, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 17, y + 7);
    y += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
  };

  const addField = (label, value, x1 = 17, x2 = 60, w1 = 50, w2 = 80) => {
    if (y > PAGE_HEIGHT - 15) {
      doc.addPage();
      y = 15;
      y = drawLetterHead(doc, letterHead, 'STUDENT ADMISSION FORM (Continued)');
      y += 5;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', x1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', x2, y, { maxWidth: w2 });
  };

  const addRow = () => {
    y += 9;
  };

  const admission = studentData?.admission || {};
  const student = studentData?.student || {};
  const father = studentData?.father || studentData?.admissionForm?.father || {};
  const mother = studentData?.mother || studentData?.admissionForm?.mother || {};
  const guardian = studentData?.guardian || studentData?.admissionForm?.guardian || {};
  const currentAddress = studentData?.currentAddress || studentData?.admissionForm?.currentAddress || {};
  const permanentAddress = studentData?.admissionForm?.permanentAddress || {};
  const academic = studentData?.academic || studentData?.admissionForm?.academic || {};
  const medical = studentData?.medical || studentData?.admissionForm?.medical || {};
  const transport = studentData?.transport || studentData?.admissionForm?.transport || {};
  const hostel = studentData?.hostel || studentData?.admissionForm?.hostel || {};
  const fee = studentData?.fee || studentData?.admissionForm?.fee || {};
  const declaration = studentData?.declaration || studentData?.admissionForm?.declaration || {};

  const photoWidth = 45;
  const photoHeight = 55;
  const photoX = pageWidth - 20 - photoWidth;
  const photoY = y + 10;

  let contentAfterPhoto = y + 10;

  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', photoX, photoY, photoWidth, photoHeight, undefined, 'FAST');
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.5);
      doc.rect(photoX, photoY, photoWidth, photoHeight);
      contentAfterPhoto = Math.max(y + 10, photoY + photoHeight + 12);
    } catch (e) {
      contentAfterPhoto = Math.max(y + 10, photoY + photoHeight + 12);
    }
  }

  y = contentAfterPhoto;

  addSection('STUDENT INFORMATION');
  addField('Full Name', student.fullName || '-', 17, 55, 45, 100);
  addField('Form No.', admission.admissionNo || '-', 110, 140, 25, 60);
  addRow();
  addField('Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-', 17, 55, 45, 50);
  addField('Gender', student.gender || '-', 110, 140, 25, 60);
  addRow();
  addField('Blood Group', student.bloodGroup || '-', 17, 55, 45, 50);
  addField('Religion', student.religion || '-', 110, 140, 25, 60);
  addRow();
  addField('Nationality', student.nationality || 'Pakistani', 17, 55, 45, 50);
  addField('Place of Birth', student.placeOfBirth || '-', 110, 140, 25, 60);
  addRow();
  addField('B-Form/Cert No', student.birthCertNo || '-', 17, 55, 45, 50);

  addSection('ADMISSION DETAILS');
  addField('Class/Grade', admission.classGrade || '-', 17, 55, 45, 50);
  addField('Session', admission.session || academic.session || '-', 110, 140, 25, 60);
  addRow();
  addField('Admission Date', admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : '-', 17, 55, 45, 50);
  addRow();

  addSection("FATHER'S INFORMATION");
  addField("Father's Name", father.fullName || '-', 17, 60, 50, 100);
  addField("Father's CNIC", father.cnic || '-', 110, 145, 30, 55);
  addRow();
  addField("Father's Mobile", father.mobile || '-', 17, 60, 50, 50);
  addField("Father's Email", father.email || '-', 110, 145, 30, 55);
  addRow();
  addField("Father's Occupation", father.occupation || '-', 17, 60, 50, 50);
  addField("Father's Income", father.monthlyIncome ? `PKR ${formatCurrency(father.monthlyIncome)}` : '-', 110, 145, 30, 55);
  addRow();

  if (mother.fullName) {
    addSection("MOTHER'S INFORMATION");
    addField("Mother's Name", mother.fullName || '-', 17, 60, 50, 100);
    addField("Mother's Mobile", mother.mobile || '-', 110, 145, 30, 55);
    addRow();
    addField("Mother's Occupation", mother.occupation || '-', 17, 60, 50, 50);
    addField("Mother's CNIC", mother.cnic || '-', 110, 145, 30, 55);
    addRow();
  }

  if (guardian.fullName) {
    addSection('GUARDIAN INFORMATION');
    addField('Guardian Name', guardian.fullName || '-', 17, 60, 50, 100);
    addField('Relation', guardian.relation || '-', 110, 145, 30, 55);
    addRow();
    addField('Guardian Mobile', guardian.mobile || '-', 17, 60, 50, 50);
    addRow();
  }

  addSection('ADDRESS INFORMATION');
  const addr = `${currentAddress.houseNo || ''} ${currentAddress.area || ''}`.trim();
  addField('Current Address', addr || '-', 17, 60, 50, 130);
  addRow();
  addField('City', currentAddress.city || '-', 17, 60, 50, 50);
  addField('Postal Code', currentAddress.postalCode || '-', 110, 145, 30, 55);
  addRow();
  
  if (!studentData?.sameAddress && permanentAddress.city) {
    addField('Permanent Address', `${permanentAddress.houseNo || ''} ${permanentAddress.area || ''}`.trim(), 17, 60, 50, 130);
    addRow();
    addField('City', permanentAddress.city || '-', 17, 60, 50, 50);
    addRow();
  }

  if (academic.previousSchool) {
    addSection('PREVIOUS ACADEMIC RECORD');
    addField('Previous School', academic.previousSchool || '-', 17, 60, 50, 100);
    addField('Previous Class', academic.previousClass || '-', 110, 145, 30, 55);
    addRow();
    addField('Last Result', academic.lastResult || '-', 17, 60, 50, 50);
    addField('Reason for Leaving', academic.reasonForLeaving || '-', 110, 145, 30, 55);
    addRow();
  }

  if (medical.diseaseAllergy || medical.physicalDisability) {
    addSection('MEDICAL INFORMATION');
    addField('Disease/Allergy', medical.diseaseAllergy || 'None', 17, 60, 50, 100);
    addField('Physical Disability', medical.physicalDisability || 'None', 110, 145, 30, 55);
    addRow();
    if (medical.emergencyContact) {
      addField('Emergency Contact', medical.emergencyContact || '-', 17, 60, 50, 50);
      addRow();
    }
  }

  if (transport.required || hostel.required) {
    addSection('TRANSPORT & HOSTEL');
    if (transport.required) {
      addField('Transport', 'Required', 17, 60, 50, 50);
      addField('Route Area', transport.routeArea || '-', 110, 145, 30, 55);
      addRow();
    }
    if (hostel.required) {
      addField('Hostel', 'Required', 17, 60, 50, 50);
      addField('Guardian', hostel.guardianName || '-', 110, 145, 30, 55);
      addRow();
    }
  }

  addSection('FEE STRUCTURE');
  addField('Admission Fee', fee.admissionFee ? `PKR ${formatCurrency(fee.admissionFee)}` : '-', 17, 60, 50, 50);
  addField('Security Fee', fee.securityFee ? `PKR ${formatCurrency(fee.securityFee)}` : '-', 110, 145, 30, 55);
  addRow();
  addField('Monthly Tuition', fee.monthlyTuitionFee ? `PKR ${formatCurrency(fee.monthlyTuitionFee)}` : '-', 17, 60, 50, 50);
  addField('Transport Fee', fee.transportFee ? `PKR ${formatCurrency(fee.transportFee)}` : '-', 110, 145, 30, 55);
  addRow();
  if (fee.hostelFee) {
    addField('Hostel Fee', `PKR ${formatCurrency(fee.hostelFee)}`, 17, 60, 50, 50);
    addField('Other Fee', fee.otherFee ? `PKR ${formatCurrency(fee.otherFee)}` : '-', 110, 145, 30, 55);
    addRow();
  }
  if (fee.discount) {
    addField('Discount', fee.discount, 17, 60, 50, 50);
    addRow();
  }

  const totalFee = parseInt(fee.admissionFee || 0) + parseInt(fee.securityFee || 0) + parseInt(fee.monthlyTuitionFee || 0) +
    parseInt(fee.transportFee || 0) + parseInt(fee.hostelFee || 0) + parseInt(fee.otherFee || 0);
  
  doc.setFillColor(0, 51, 102);
  doc.rect(100, y - 2, 90, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL:', 105, y + 4);
  doc.text(`PKR ${formatCurrency(totalFee)}`, 185, y + 4, { align: 'right' });
  y += 14;
  doc.setTextColor(0, 0, 0);

  addSection('DOCUMENTS CHECKLIST');
  const docs = studentData?.documents || studentData?.admissionForm?.documents || {};
  const docList = [
    { label: 'Birth Certificate', checked: docs.birthCertificate },
    { label: "Father's CNIC", checked: docs.fatherCnic },
    { label: 'Photos', checked: docs.photos },
    { label: 'Leaving Certificate', checked: docs.leavingCertificate },
    { label: 'Previous Result', checked: docs.previousResult },
    { label: 'Medical Certificate', checked: docs.medicalCertificate }
  ];

  doc.setFontSize(7);
  docList.forEach((d, i) => {
    const xPos = 17 + (i % 2) * 95;
    const yPos = y + Math.floor(i / 2) * 8;
    if (d.checked) {
      doc.setTextColor(0, 100, 0);
      doc.text('☑', xPos, yPos);
    } else {
      doc.setTextColor(150, 0, 0);
      doc.text('☐', xPos, yPos);
    }
    doc.setTextColor(0, 0, 0);
    doc.text(d.label, xPos + 8, yPos);
  });
  y += Math.ceil(docList.length / 2) * 8 + 8;

  addSection('DECLARATION');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const declarationText = 'I hereby declare that all the information provided in this form is correct and complete to the best of my knowledge.';
  const splitText = doc.splitTextToSize(declarationText, pageWidth - 35);
  doc.text(splitText, 17, y);
  y += splitText.length * 4 + 8;

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.2);
  doc.line(17, y + 3, 85, y + 3);
  doc.setFontSize(7);
  doc.text('Parent/Guardian Signature', 25, y + 8);
  doc.text(declaration.date ? new Date(declaration.date).toLocaleDateString() : new Date().toLocaleDateString(), 90, y + 8);
  doc.line(120, y + 3, 190, y + 3);
  doc.text('Date', 150, y + 8);
  y += 18;

  if (y > PAGE_HEIGHT - 30) {
    doc.addPage();
    y = 15;
    y = drawLetterHead(doc, letterHead, 'STUDENT ADMISSION FORM');
    y += 5;
  }
  
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 18, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('FOR OFFICE USE ONLY', 17, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Approved By: ___________________', 17, y + 12);
  doc.text('Principal: ___________________', 100, y + 12);

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`Document generated on: ${new Date().toLocaleString()}`, 15, pageHeight - 8);
  doc.text('School Management System', pageWidth - 15, pageHeight - 8, { align: 'right' });

  const filename = `Admission_Form_${student.fullName?.replace(/\s+/g, '_') || 'Student'}.pdf`;
  doc.save(filename);
};

export const generateFeeVoucherPDF = async (studentData, fees) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const letterHead = await getLetterHead();
  let y = drawLetterHead(doc, letterHead, 'FEE VOUCHER');
  y += 5;
  
  const voucherNo = fees && fees.length > 0 && fees[0]?.voucherNumber 
    ? fees[0].voucherNumber 
    : `FV-${Date.now().toString().slice(-8)}`;
  const issueDate = fees && fees.length > 0 && fees[0]?.createdAt 
    ? new Date(fees[0].createdAt).toLocaleDateString() 
    : new Date().toLocaleDateString();
  const dueDate = fees && fees.length > 0 && fees[0]?.dueDate 
    ? new Date(fees[0].dueDate).toLocaleDateString() 
    : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString();
  
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 25, 'F');
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Voucher No:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(voucherNo, 45, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(issueDate, 135, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dueDate, 45, y);
  
  y += 10;
  
  const studentName = studentData?.fullName || `${studentData?.firstName || ''} ${studentData?.lastName || ''}`.trim() || '-';
  const studentId = studentData?.studentId || '-';
  const classGrade = studentData?.classGrade?.name || studentData?.classGrade || '-';
  const fatherName = studentData?.fatherName || studentData?.parentName || '-';
  const contactNo = studentData?.phone || studentData?.parentPhone || '-';
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', 20, y + 5.5);
  y += 12;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName.substring(0, 40), 38, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ID:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentId, 122, y);
  
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Class:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(classGrade.substring(0, 30), 38, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Father/Guardian:', 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(fatherName.substring(0, 30), 115, y);
  
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Contact:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(contactNo.substring(0, 20), 38, y);
  
  y += 10;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE DETAILS', 20, y + 5.5);
  y += 12;
  
  const feeHeads = fees && fees.length > 0 ? fees : [
    { feeType: 'Tuition Fee', amount: 5000 }
  ];
  
  const tableData = feeHeads.map((fee, i) => [
    i + 1,
    fee.feeType || fee.description || `Fee`,
    new Date(fee.dueDate).toLocaleDateString(),
    `PKR ${formatCurrency(fee.amount)}`
  ]);
  
  const totalAmount = feeHeads.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = feeHeads.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalBalance = totalAmount - totalPaid;
  
  doc.autoTable({
    startY: y,
    head: [['#', 'Description', 'Due Date', 'Amount (PKR)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });
  
  y = doc.lastAutoTable.finalY + 5;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAYABLE', 20, y + 7);
  doc.text(`PKR ${formatCurrency(totalAmount)}/-`, pageWidth - 20, y + 7, { align: 'right' });
  
  y += 14;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Amount in Words: ${numberToWords(totalAmount)} Rupees Only`, 15, y);
  
  y += 10;
  
  doc.setFillColor(255, 250, 230);
  doc.rect(15, y, pageWidth - 30, 35, 'F');
  doc.setDrawColor(200, 180, 100);
  doc.setLineWidth(0.5);
  doc.rect(15, y, pageWidth - 30, 35, 'S');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Payment Instructions:', 20, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const instructions = [
    '1. Please pay the fee before the due date to avoid late charges.',
    '2. Keep this voucher safe for your records.',
    '3. Payment can be made via cash, bank draft, or online transfer.'
  ];
  instructions.forEach((text, i) => {
    doc.text(text, 20, y + 14 + (i * 5.5));
  });
  
  y += 42;
  
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  
  doc.line(20, y, 70, y);
  doc.text('Receiver', 35, y + 5);
  
  doc.line(90, y, 140, y);
  doc.text('Authorized Signatory', 100, y + 5);
  
  doc.line(160, y, 190, y);
  doc.text('Seal', 172, y + 5);
  
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, pageHeight - 8);
  
  const filename = `Fee_Voucher_${studentName.replace(/\s+/g, '_')}_${voucherNo}.pdf`;
  doc.save(filename);
};

export const generateStudentCard = (studentData) => {
  const doc = new jsPDF({ unit: 'mm', format: [86, 54] });
  
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, 86, 54, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHOOL ID CARD', 43, 8, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('School Management System', 43, 13, { align: 'center' });
  
  doc.setFillColor(255, 255, 255);
  doc.rect(5, 16, 76, 33, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Student:', 8, 23);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.firstName + ' ' + studentData.lastName, 25, 23);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ID:', 8, 29);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.studentId || '-', 25, 29);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Class:', 8, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.class?.name || '-', 25, 35);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', 8, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.phone || '-', 25, 41);
  
  doc.save(`ID_Card_${studentData.studentId}.pdf`);
};

export const generateSOAPDF = async (studentData, fees) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const isFine = fees.length > 0 && fees[0].feeType === 'Fine';
  const title = isFine ? 'FINE STATEMENT' : 'STATEMENT OF ACCOUNT';
  const recordLabel = isFine ? 'FINE RECORDS' : 'FEE RECORDS';
  
  const letterHead = await getLetterHead();
  let y = drawLetterHead(doc, letterHead, title);
  y += 5;
  
  const studentName = studentData?.fullName || '-';
  const studentId = studentData?.studentId || '-';
  const className = studentData?.className || '-';
  const issueDate = new Date().toLocaleDateString();
  const dateRange = studentData?.dateRange;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, dateRange ? 38 : 30, 'F');
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName, 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Student ID:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentId, 140, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Class:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(className, 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(issueDate, 140, y);
  
  if (dateRange) {
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Period:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(dateRange, 55, y);
  }
  
  y += 12;
  
  const totalAmount = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalBalance = totalAmount - totalPaid;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(recordLabel, 20, y + 5.5);
  y += 12;
  
  let tableData, tableHead;
  if (isFine) {
    tableHead = [['#', 'Voucher #', 'Fine Type', 'Date', 'Amount', 'Paid', 'Balance', 'Status']];
    tableData = fees.map((fee, i) => [
      i + 1,
      fee.voucherNumber || '-',
      fee.fineType || 'Fine',
      new Date(fee.dueDate).toLocaleDateString(),
      `PKR ${formatCurrency(fee.amount)}`,
      `PKR ${formatCurrency(fee.paidAmount || 0)}`,
      `PKR ${formatCurrency(fee.amount - (fee.paidAmount || 0))}`,
      fee.status || '-'
    ]);
  } else {
    tableHead = [['#', 'Voucher #', 'Type', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status']];
    tableData = fees.map((fee, i) => [
      i + 1,
      fee.voucherNumber || '-',
      fee.feeType || '-',
      new Date(fee.dueDate).toLocaleDateString(),
      `PKR ${formatCurrency(fee.amount)}`,
      `PKR ${formatCurrency(fee.paidAmount || 0)}`,
      `PKR ${formatCurrency(fee.amount - (fee.paidAmount || 0))}`,
      fee.status || '-'
    ]);
  }
  
  doc.autoTable({
    startY: y,
    head: [tableHead],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 15, right: 15 }
  });
  
  y = doc.lastAutoTable.finalY + 10;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 35, 'F');
  y += 10;
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  doc.text('TOTAL:', 20, y);
  doc.text(`PKR ${formatCurrency(totalAmount)}`, 70, y);
  
  doc.text('PAID:', 100, y);
  doc.text(`PKR ${formatCurrency(totalPaid)}`, 130, y);
  
  y += 15;
  doc.setFontSize(14);
  doc.text('BALANCE:', 20, y);
  doc.text(`PKR ${formatCurrency(totalBalance)}`, 70, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${numberToWords(totalBalance)} Rupees Only)`, 70, y + 7);
  
  y += 20;
  doc.setTextColor(0, 0, 0);
  
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(20, y, 70, y);
  doc.text('Receiver', 35, y + 5);
  
  doc.line(100, y, 150, y);
  doc.text('Authorized Signatory', 110, y + 5);
  
  doc.line(160, y, 190, y);
  doc.text('Seal', 172, y + 5);
  
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, pageHeight - 8);
  
  const recordType = isFine ? 'Fines' : 'SOA';
  const filename = `${recordType}_${studentName.replace(/\s+/g, '_')}_${studentId}.pdf`;
  doc.save(filename);
};

export const generateTeacherSOAPDF = async (data, records, totals) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const teacher = data.teacher;
  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : '-';
  const teacherId = teacher?.teacherId || '-';
  const dateRange = data.dateRange;
  
  const letterHead = await getLetterHead();
  let y = drawLetterHead(doc, letterHead, 'TEACHER SALARY STATEMENT');
  y += 5;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, dateRange ? 38 : 30, 'F');
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Teacher Name:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(teacherName, 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Teacher ID:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(teacherId, 140, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Designation:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(teacher.designation || '-', 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString(), 140, y);
  
  if (dateRange) {
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Period:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(dateRange, 55, y);
  }
  
  y += 12;
  
  const totalSalary = records.filter(r => r.category === 'Salary').reduce((sum, r) => sum + r.amount, 0);
  const totalAdvance = records.filter(r => r.category === 'Advance Salary').reduce((sum, r) => sum + r.amount, 0);
  const totalDeductions = records.filter(r => r.category === 'Deduction').reduce((sum, r) => sum + r.amount, 0);
  const netPay = totalSalary - totalAdvance - totalDeductions;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SALARY RECORDS', 20, y + 5.5);
  y += 12;
  
  const tableData = records.map((record, i) => [
    i + 1,
    record.voucherNumber || '-',
    record.category || '-',
    record.deductionType || record.description || '-',
    new Date(record.date).toLocaleDateString(),
    `PKR ${formatCurrency(record.amount)}`,
    record.category === 'Deduction' ? '-' : `PKR ${formatCurrency(record.amount)}`
  ]);
  
  doc.autoTable({
    startY: y,
    head: [['#', 'Voucher #', 'Type', 'Description', 'Date', 'Amount', 'Payable']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 25 },
      3: { cellWidth: 45 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });
  
  y = doc.lastAutoTable.finalY + 10;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 40, 'F');
  y += 10;
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  doc.text('SUMMARY', 20, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.text(`Total Salary: PKR ${formatCurrency(totalSalary)}`, 20, y);
  doc.text(`Total Advance: PKR ${formatCurrency(totalAdvance)}`, 110, y);
  
  y += 8;
  doc.text(`Total Deductions: PKR ${formatCurrency(totalDeductions)}`, 20, y);
  
  y += 12;
  doc.setFontSize(13);
  doc.text('NET PAYABLE:', 20, y);
  doc.text(`PKR ${formatCurrency(netPay)}`, 80, y);
  
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${numberToWords(netPay)} Rupees Only)`, 80, y);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(20, y, 70, y);
  doc.text('Receiver', 35, y + 5);
  
  doc.line(100, y, 150, y);
  doc.text('Authorized Signatory', 110, y + 5);
  
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, pageHeight - 8);
  
  const filename = `Teacher_Salary_SOA_${teacherName.replace(/\s+/g, '_')}_${teacherId}.pdf`;
  doc.save(filename);
};

export const generateExpenseVoucherPDF = async (voucher, person) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const letterHead = await getLetterHead();
  let y = drawLetterHead(doc, letterHead, 'PAYMENT VOUCHER');
  y += 10;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, pageWidth - 30, 35, 'F');
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Voucher No:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(voucher.voucherNumber || '-', 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 130, y);
  doc.setFont('helvetica', 'normal');
  doc.text(voucher.date ? new Date(voucher.date).toLocaleDateString() : '-', 150, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Payee:', 20, y);
  doc.setFont('helvetica', 'normal');
  const personName = person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : '-';
  const personId = person?.teacherId || person?.employeeId || '-';
  doc.text(personName, 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ID:', 130, y);
  doc.setFont('helvetica', 'normal');
  doc.text(personId, 150, y);
  
  y += 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Category:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(voucher.category || '-', 55, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(voucher.description || '-', 55, y);
  
  y += 15;
  doc.setFillColor(230, 240, 255);
  doc.rect(15, y - 5, pageWidth - 30, 25, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT:', 20, y + 5);
  doc.setTextColor(0, 100, 0);
  doc.text(`PKR ${formatCurrency(voucher.amount)}`, 80, y + 5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${numberToWords(voucher.amount)} Rupees Only)`, 55, y);
  
  y += 20;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(20, y, 70, y);
  doc.text('Receiver', 35, y + 5);
  
  doc.line(100, y, 150, y);
  doc.text('Authorized Signatory', 110, y + 5);
  
  doc.setFontSize(7);
  doc.setTextColor(128);
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, pageHeight - 8);
  
  const filename = `Voucher_${voucher.voucherNumber || 'unknown'}.pdf`;
  doc.save(filename);
};

export const generateFamilyChallanPDF = async (familyData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const { familyNumber, siblings, voucher, totalAmount } = familyData;
  const familyMembers = siblings || voucher?.familyMembers || [];
  const voucherNo = voucher?.voucherNumber || `FV-${Date.now().toString().slice(-8)}`;
  const amount = totalAmount || voucher?.amount || 0;
  const paidAmount = voucher?.paidAmount || 0;
  const balance = amount - paidAmount;
  const isPaid = balance === 0 && amount > 0;
  
  const letterHead = await getLetterHead();
  let y = drawLetterHead(doc, letterHead, 'FAMILY FEE CHALLAN');
  y += 5;
  
  const issueDate = voucher?.createdAt ? new Date(voucher.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const dueDate = voucher?.dueDate ? new Date(voucher.dueDate).toLocaleDateString() : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString();
  
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 25, 'F');
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Family #:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(familyNumber || '-', 48, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Voucher #:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(voucherNo, 142, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(issueDate, 48, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dueDate, 140, y);
  
  y += 10;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT DETAILS', 20, y + 5.5);
  y += 12;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  const tableData = familyMembers.map((member, idx) => {
    const studentObj = typeof member.studentId === 'object' ? member.studentId : null;
    const studentName = member.studentName 
      || (studentObj ? `${studentObj.firstName || ''} ${studentObj.lastName || ''}`.trim() : '-');
    const studentCode = member.studentCode || (studentObj ? studentObj.studentId : '-');
    const className = member.className || (studentObj?.classGrade?.name || studentObj?.class?.name || '-');
    const individualFee = member.feeAmount || Math.round(amount / familyMembers.length);
    
    return [
      idx + 1,
      studentName,
      studentCode,
      className,
      `PKR ${formatCurrency(individualFee)}`
    ];
  });
  
  tableData.push(['', '', '', 'TOTAL:', `PKR ${formatCurrency(amount)}`]);
  
  doc.autoTable({
    startY: y,
    head: [['#', 'Student Name', 'ID', 'Class', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 48, halign: 'right' }
    },
    margin: { left: 15, right: 15 },
    tableWidth: 180,
    didParseCell: function(data) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [230, 230, 230];
      }
    }
  });
  
  y = doc.lastAutoTable.finalY;
  
  if (isPaid) {
    const centerX = pageWidth / 2;
    const centerY = y - 25;
    const radius = 20;
    
    doc.setDrawColor(220, 0, 0);
    doc.setLineWidth(3);
    doc.circle(centerX, centerY, radius, 'S');
    
    doc.setDrawColor(220, 0, 0);
    doc.setLineWidth(2);
    doc.circle(centerX, centerY, radius - 4, 'S');
    
    doc.setTextColor(220, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', centerX, centerY + 2, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`PKR ${formatCurrency(paidAmount || amount)}`, centerX, centerY + 10, { align: 'center' });
  }
  
  y += 10;
  
  doc.setFillColor(0, 51, 102);
  doc.rect(15, y, pageWidth - 30, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  if (isPaid) {
    doc.text('GRAND TOTAL PAID', 20, y + 7);
    doc.text(`PKR ${formatCurrency(paidAmount || amount)}/-`, pageWidth - 20, y + 7, { align: 'right' });
    y += 18;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Amount in Words: ${numberToWords(paidAmount || amount)} Rupees Only`, 15, y);
  } else {
    doc.text('GRAND TOTAL PAYABLE', 20, y + 7);
    doc.text(`PKR ${formatCurrency(balance)}/-`, pageWidth - 20, y + 7, { align: 'right' });
    y += 18;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Amount in Words: ${numberToWords(balance)} Rupees Only`, 15, y);
  }
  y += 10;
  
  doc.setFillColor(255, 250, 230);
  doc.rect(15, y, pageWidth - 30, 30, 'F');
  doc.setDrawColor(200, 180, 100);
  doc.setLineWidth(0.5);
  doc.rect(15, y, pageWidth - 30, 30, 'S');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Payment Instructions:', 20, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const instructions = [
    '1. This is a combined fee challan for all family members listed above.',
    '2. Please pay the total amount before the due date.',
    '3. Payment can be made via cash, bank draft, or online transfer.'
  ];
  instructions.forEach((text, i) => {
    doc.text(text, 20, y + 14 + (i * 5));
  });
  
  y += 35;
  
  if (paidAmount > 0 && balance > 0) {
    doc.setFontSize(9);
    doc.setTextColor(0, 100, 0);
    doc.text(`Previous Payment: PKR ${formatCurrency(paidAmount)}`, 15, y);
    y += 6;
  }
  
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(20, y, 70, y);
  doc.text('Receiver', 35, y + 5);
  
  doc.line(90, y, 140, y);
  doc.text('Authorized Signatory', 100, y + 5);
  
  doc.line(160, y, 190, y);
  doc.text('Seal', 172, y + 5);
  
  y += 12;
  
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, pageHeight - 8);
  doc.text('System Generated Voucher', pageWidth - 15, pageHeight - 8, { align: 'right' });
  
  const filename = `Family_Challan_${familyNumber || 'Unknown'}_${voucherNo}.pdf`;
  doc.save(filename);
};
