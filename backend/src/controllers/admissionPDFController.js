const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const School = require('../models/School');
const LetterHead = require('../models/LetterHead');

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

exports.generateAdmissionPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate('school', 'name address phone email website tagline logo settings');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const school = student.school;
    const schoolId = school?._id || school;
    const letterHead = schoolId ? await LetterHead.findOne({ school: schoolId }) : null;
    const admission = student.admissionForm || {};
    const primaryColor = letterHead?.primaryColor || school?.branding?.primaryColor || '#003366';
    
    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 15, bottom: 15, left: 20, right: 20 },
      info: { Title: 'Student Admission Form' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Admission_Form_${student.studentId}.pdf`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const bottomMargin = pageHeight - 30;
    let y = 15;
    let currentPage = 1;

    const checkPageBreak = (needed = 50) => {
      if (y + needed > bottomMargin) {
        doc.addPage();
        currentPage++;
        y = 20;
        addFooter(currentPage);
        return true;
      }
      return false;
    };

    const addFooter = (pageNum) => {
      doc.fontSize(8).fillColor('#999999').font('Helvetica');
      const currency = school?.settings?.currency || 'PKR';
      const dateFormat = school?.settings?.dateFormat || 'DD/MM/YYYY';
      doc.text(`Page ${pageNum} | Currency: ${currency} | Student ID: ${student.studentId}`, 20, pageHeight - 15);
      doc.text(school?.name || 'School Management System', pageWidth - 20, pageHeight - 15, { align: 'right' });
    };

    const addHeader = () => {
      y = 15;
      
      const logoData = letterHead?.logo;
      if (logoData) {
        try {
          let imgData = logoData;
          if (logoData.includes(',')) {
            imgData = logoData.split(',')[1];
          }
          const imgBuffer = Buffer.from(imgData, 'base64');
          if (imgBuffer.length > 0) {
            doc.image(imgBuffer, 20, y, { width: 40, height: 40 });
          }
        } catch (e) {
          console.error('Logo image error:', e.message);
        }
      }
      
      const textStartX = logoData ? 70 : 20;
      doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold');
      doc.text(letterHead?.headerText || school?.name || 'School Name', textStartX, y + 8);
      
      doc.fontSize(9).fillColor('#666666').font('Helvetica');
      let contactParts = [];
      if (letterHead?.address || school?.address) contactParts.push(letterHead?.address || school?.address);
      if (letterHead?.phone || school?.phone) contactParts.push('Ph: ' + (letterHead?.phone || school?.phone));
      if (letterHead?.email || school?.email) contactParts.push('Email: ' + (letterHead?.email || school?.email));
      if (contactParts.length > 0) {
        doc.text(contactParts.join(' | '), textStartX, y + 20, { width: pageWidth - 90 });
      }
      
      if (letterHead?.tagline || school?.tagline) {
        doc.fontSize(9).fillColor('#666666').font('Helvetica-Oblique');
        doc.text(letterHead?.tagline || school?.tagline, textStartX, y + 30, { width: pageWidth - 90 });
        y += 40;
      } else {
        y += 35;
      }
      
      doc.strokeColor(primaryColor).lineWidth(0.5);
      doc.moveTo(20, y).lineTo(pageWidth - 20, y).stroke();
      y += 8;
      
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold');
      doc.text('STUDENT ADMISSION FORM', 0, y, { align: 'center' });
      y += 15;
    };

    const addSection = (title) => {
      checkPageBreak(25);
      doc.rect(20, y, pageWidth - 40, 14).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text(title, 25, y + 4);
      y += 16;
    };

    const addField = (label, value, x1 = 20, x2 = 100, width = 150) => {
      checkPageBreak(12);
      doc.fillColor('#333333').fontSize(8).font('Helvetica-Bold');
      doc.text(label + ':', x1, y);
      doc.font('Helvetica').fillColor('#555555');
      const text = value || '-';
      doc.text(text, x2, y, { width: width });
    };

    const addRow = () => {
      y += 11;
    };

    const addCheckboxField = (label, checked) => {
      doc.fontSize(8).font('Helvetica');
      doc.fillColor(checked ? '#006600' : '#999999').text(checked ? '☑' : '☐', 20 + (label.length * 2.5), y);
      doc.fillColor('#333333').text(label, 35 + (label.length * 2.5), y);
    };

    addHeader();

    const photoBoxWidth = 50;
    const photoBoxHeight = 60;
    const photoX = pageWidth - 25 - photoBoxWidth;
    const photoY = y + 10;

    let contentAfterPhoto = y + 10;

    if (student.admissionForm?.photo) {
      try {
        const imgData = student.admissionForm.photo;
        let base64Data = imgData;
        if (imgData.startsWith('data:')) {
          base64Data = imgData.split(',')[1];
        }
        doc.image(Buffer.from(base64Data, 'base64'), photoX, photoY, { width: photoBoxWidth, height: photoBoxHeight });
        doc.strokeColor(primaryColor).lineWidth(0.5).rect(photoX, photoY, photoBoxWidth, photoBoxHeight).stroke();
        contentAfterPhoto = Math.max(y + 10, photoY + photoBoxHeight + 10);
      } catch (e) {
        contentAfterPhoto = Math.max(y + 10, photoY + photoBoxHeight + 10);
      }
    }

    y = contentAfterPhoto;

    addSection('STUDENT INFORMATION');
    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    addField('Full Name', studentName);
    addField('Form No.', student.studentId || '-');
    addRow();
    addField('Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-');
    addField('Gender', student.gender || '-');
    addRow();
    addField('Blood Group', admission.bloodGroup || '-');
    addField('Religion', admission.religion || '-');
    addRow();
    addField('Nationality', admission.nationality || 'Pakistani');
    addField('Place of Birth', admission.placeOfBirth || '-');
    addRow();
    addField('B-Form/Cert No', admission.birthCertNo || '-');

    addSection('ADMISSION DETAILS');
    addField('Class/Grade', admission.classGrade || student.classGrade?.name || '-');
    addField('Session', admission.session || '-');
    addRow();
    addField('Admission Date', student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '-');
    addField('Status', admission.admissionStatus || 'Pending');
    addRow();

    addSection("FATHER'S INFORMATION");
    addField("Father's Name", admission.father?.fullName || student.parentName || '-', 20, 85, 150);
    addField("Father's CNIC", admission.father?.cnic || '-', 200, 255, 100);
    addRow();
    addField("Father's Mobile", admission.father?.mobile || student.parentPhone || '-', 20, 85, 150);
    addField("Father's Email", admission.father?.email || student.parentEmail || '-', 200, 255, 100);
    addRow();
    addField("Father's Occupation", admission.father?.occupation || '-', 20, 85, 150);
    addField("Father's Qualification", admission.father?.qualification || '-', 200, 255, 100);
    addRow();

    if (admission.mother?.fullName) {
      addSection("MOTHER'S INFORMATION");
      addField("Mother's Name", admission.mother?.fullName || '-', 20, 85, 150);
      addField("Mother's Mobile", admission.mother?.mobile || '-', 200, 255, 100);
      addRow();
      addField("Mother's Occupation", admission.mother?.occupation || '-', 20, 85, 150);
      addField("Mother's CNIC", admission.mother?.cnic || '-', 200, 255, 100);
      addRow();
    }

    if (admission.guardian?.fullName) {
      addSection('GUARDIAN INFORMATION');
      addField('Guardian Name', admission.guardian?.fullName || '-', 20, 85, 150);
      addField('Relation', admission.guardian?.relation || '-', 200, 255, 100);
      addRow();
      addField('Guardian Mobile', admission.guardian?.mobile || '-', 20, 85, 150);
      addField('Guardian CNIC', admission.guardian?.cnic || '-', 200, 255, 100);
      addRow();
    }

    addSection('ADDRESS INFORMATION');
    const currentAddr = `${admission.currentAddress?.houseNo || ''} ${admission.currentAddress?.area || ''}`.trim();
    addField('Current Address', currentAddr || '-', 20, 85, 350);
    addRow();
    addField('City', admission.currentAddress?.city || student.address?.city || '-', 20, 85, 150);
    addField('Postal Code', admission.currentAddress?.postalCode || student.address?.zipCode || '-', 200, 255, 100);
    addRow();
    
    if (!admission.sameAddress && admission.permanentAddress?.city) {
      addField('Permanent Address', `${admission.permanentAddress?.houseNo || ''} ${admission.permanentAddress?.area || ''}`.trim(), 20, 85, 350);
      addRow();
      addField('City', admission.permanentAddress?.city || '-', 20, 85, 150);
      addRow();
    }

    if (admission.academic?.previousSchool) {
      addSection('PREVIOUS ACADEMIC RECORD');
      addField('Previous School', admission.academic?.previousSchool || '-', 20, 85, 150);
      addField('Previous Class', admission.academic?.previousClass || '-', 200, 255, 100);
      addRow();
      addField('Last Result', admission.academic?.lastResult || '-', 20, 85, 150);
      addField('Reason for Leaving', admission.academic?.reasonForLeaving || '-', 200, 255, 100);
      addRow();
    }

    if (admission.medical?.diseaseAllergy || admission.medical?.physicalDisability) {
      addSection('MEDICAL INFORMATION');
      addField('Disease/Allergy', admission.medical?.diseaseAllergy || 'None', 20, 85, 150);
      addField('Physical Disability', admission.medical?.physicalDisability || 'None', 200, 255, 100);
      addRow();
      if (admission.medical?.emergencyContact) {
        addField('Emergency Contact', admission.medical?.emergencyContact || '-', 20, 85, 150);
        addRow();
      }
    }

    if (admission.transport?.required || admission.hostel?.required) {
      addSection('TRANSPORT & HOSTEL');
      if (admission.transport?.required) {
        addField('Transport', 'Required', 20, 85, 150);
        addField('Route Area', admission.transport?.routeArea || '-', 200, 255, 100);
        addRow();
      }
      if (admission.hostel?.required) {
        addField('Hostel', 'Required', 20, 85, 150);
        addField('Guardian', admission.hostel?.guardianName || '-', 200, 255, 100);
        addRow();
      }
    }

    addSection('FEE STRUCTURE');
    const fees = [
      { label: 'Admission Fee', value: admission.fee?.admissionFee },
      { label: 'Security Fee', value: admission.fee?.securityFee },
      { label: 'Monthly Tuition', value: admission.fee?.monthlyTuitionFee },
      { label: 'Transport Fee', value: admission.fee?.transportFee },
      { label: 'Hostel Fee', value: admission.fee?.hostelFee },
      { label: 'Other Fee', value: admission.fee?.otherFee }
    ];
    
    const currency = school?.settings?.currency || 'PKR';
    let col = 20;
    fees.forEach((fee, i) => {
      if (fee.value) {
        const xPos = col + (i % 2) * 175;
        const yPos = y + Math.floor(i / 2) * 11;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
        doc.text(fee.label + ':', xPos, yPos);
        doc.font('Helvetica').fillColor('#555555');
        doc.text(`${currency} ${formatCurrency(fee.value)}`, xPos + 70, yPos);
      }
    });
    y += Math.ceil(fees.filter(f => f.value).length / 2) * 11 + 5;

    if (admission.fee?.discount) {
      addField('Discount', admission.fee.discount, 20, 85, 150);
      addRow();
    }

    const totalFee = 
      parseInt(admission.fee?.admissionFee || 0) +
      parseInt(admission.fee?.securityFee || 0) +
      parseInt(admission.fee?.monthlyTuitionFee || 0) +
      parseInt(admission.fee?.transportFee || 0) +
      parseInt(admission.fee?.hostelFee || 0) +
      parseInt(admission.fee?.otherFee || 0);

    doc.rect(180, y, pageWidth - 200, 16).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('TOTAL:', 185, y + 5);
    doc.text(`${currency} ${formatCurrency(totalFee)}`, 0, y + 5, { align: 'right', rightMargin: 25 });
    y += 18;

    addSection('DOCUMENTS CHECKLIST');
    const docs = admission.documents || {};
    const docList = [
      { label: 'Birth Certificate / B-Form', checked: docs.birthCertificate },
      { label: "Father's CNIC", checked: docs.fatherCnic },
      { label: 'Passport Size Photos', checked: docs.photos },
      { label: 'Leaving Certificate', checked: docs.leavingCertificate },
      { label: 'Previous Result Card', checked: docs.previousResult },
      { label: 'Medical Certificate', checked: docs.medicalCertificate }
    ];
    
    doc.fontSize(8).font('Helvetica');
    docList.forEach((d, i) => {
      const xPos = 20 + (i % 2) * 175;
      const yPos = y + Math.floor(i / 2) * 11;
      doc.fillColor(d.checked ? '#006600' : '#999999').text(d.checked ? '☑' : '☐', xPos, yPos);
      doc.fillColor('#333333').text(d.label, xPos + 12, yPos);
    });
    y += Math.ceil(docList.length / 2) * 11 + 8;

    addSection('DECLARATION');
    checkPageBreak(40);
    doc.fontSize(8).font('Helvetica').fillColor('#333333');
    const declarationText = 'I hereby declare that all the information provided in this form is correct and complete to the best of my knowledge. I agree to abide by the rules and regulations of the school and understand that any false information may result in cancellation of admission.';
    doc.text(declarationText, 20, y, { width: pageWidth - 40, align: 'justify', lineGap: 2 });
    y += 25;

    doc.fontSize(8);
    doc.moveTo(20, y).lineTo(120, y).stroke();
    doc.fillColor('#666666').text('Parent/Guardian Signature', 40, y + 4);
    
    doc.moveTo(140, y).lineTo(220, y).stroke();
    doc.text('Date', 170, y + 4);
    
    doc.moveTo(240, y).lineTo(pageWidth - 20, y).stroke();
    doc.text('Student Signature', 310, y + 4);
    y += 18;

    checkPageBreak(35);
    doc.rect(20, y, pageWidth - 40, 30).fill('#f5f5f5');
    doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold');
    doc.text('FOR OFFICE USE ONLY', 25, y + 6);
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Admission Status:', 25, y + 16);
    doc.rect(85, y + 13, 35, 10).stroke();
    doc.text(admission.admissionStatus || 'Pending', 88, y + 17);
    doc.text('Approved By:', 130, y + 16);
    doc.moveTo(175, y + 23).lineTo(260, y + 23).stroke();
    doc.text('Principal:', 270, y + 16);
    doc.moveTo(310, y + 23).lineTo(pageWidth - 25, y + 23).stroke();

    addFooter(currentPage);
    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

exports.getPendingCount = async (req, res) => {
  try {
    const query = { ...req.tenantQuery, admissionStatus: 'Pending' };
    const count = await Student.countDocuments(query);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
