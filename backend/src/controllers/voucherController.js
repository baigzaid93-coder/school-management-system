const PDFDocument = require('pdfkit');
const Expense = require('../models/Expense');
const School = require('../models/School');

const formatCurrency = (amount, currency = 'PKR') => {
  return `${currency} ${(amount || 0).toLocaleString('en-PK')}`;
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

exports.generateVoucherPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findById(id)
      .populate('school', 'name address phone email tagline logo settings');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const school = expense.school;
    const primaryColor = school?.settings?.primaryColor || '#003366';
    const currency = school?.settings?.currency || 'PKR';
    
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Voucher-${expense.voucherNumber}.pdf`);
    doc.pipe(res);
    
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - 80;
    
    let y = 30;
    
    if (school?.logo) {
      try {
        doc.image(Buffer.from(school.logo, 'base64'), 40, y, { width: 60, height: 40 });
      } catch (e) {}
    }
    
    doc.fontSize(18).fillColor(primaryColor).font('Helvetica-Bold');
    doc.text(school?.name || 'School Name', school?.logo ? 110 : 40, y + 15);
    
    doc.fontSize(10).fillColor('#666666').font('Helvetica');
    let contactInfo = [];
    if (school?.address) contactInfo.push(school.address);
    if (school?.phone) contactInfo.push('Ph: ' + school.phone);
    if (school?.email) contactInfo.push('Email: ' + school.email);
    if (school?.tagline) contactInfo.push(school.tagline);
    doc.text(contactInfo.join(' | ') || '', school?.logo ? 110 : 40, y + 32);
    
    y += 55;
    
    doc.rect(40, y, contentWidth, 35).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
    doc.text('PAYMENT VOUCHER', 0, y + 12, { align: 'center' });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Voucher #: ${expense.voucherNumber}`, 0, y + 26, { align: 'center' });
    
    y += 50;
    
    doc.fontSize(10).fillColor('#333333');
    const leftCol = 40;
    const rightCol = pageWidth / 2;
    const labelWidth = 100;
    
    const addField = (label, value, x, yPos) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#555555');
      doc.text(label + ':', x, yPos);
      doc.font('Helvetica').fillColor('#000000');
      doc.text(value || '-', x + labelWidth, yPos);
    };
    
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    };
    
    addField('Date', formatDate(expense.date), leftCol, y);
    addField('Category', expense.category || '-', rightCol, y);
    
    y += 18;
    addField('Payment Method', expense.paymentMethod || 'Cash', leftCol, y);
    addField('Reference', expense.reference || '-', rightCol, y);
    
    y += 30;
    
    doc.rect(40, y, contentWidth, 60).stroke('#dddddd');
    
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333');
    doc.text('Description:', 50, y + 8);
    doc.font('Helvetica').fontSize(10).fillColor('#000000');
    doc.text(expense.description || '-', 50, y + 22, { width: contentWidth - 20, height: 40 });
    
    y += 75;
    
    doc.rect(40, y, contentWidth, 40).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
    doc.text('Amount:', 50, y + 14);
    doc.text(formatCurrency(expense.amount, currency), 0, y + 14, { align: 'right', rightMargin: 50 });
    
    y += 50;
    
    doc.fontSize(10).fillColor('#555555');
    doc.text('Amount in Words:', 40, y);
    doc.font('Helvetica').fillColor('#333333').fontSize(11);
    doc.text(numberToWords(expense.amount) + ' ' + currency + ' Only', 40, y + 15);
    
    y += 40;
    
    if (expense.vendor) {
      doc.fontSize(10).fillColor('#555555');
      doc.text('Vendor:', 40, y);
      doc.font('Helvetica').fillColor('#333333');
      doc.text(expense.vendor, 120, y);
      y += 20;
    }
    
    if (expense.teacher) {
      doc.fontSize(10).fillColor('#555555');
      doc.text('Teacher:', 40, y);
      doc.font('Helvetica').fillColor('#333333');
      doc.text(`${expense.teacher.firstName || ''} ${expense.teacher.lastName || ''} ${expense.teacher.employeeId ? `(${expense.teacher.employeeId})` : ''}`, 120, y);
      y += 20;
    }
    
    if (expense.staff) {
      doc.fontSize(10).fillColor('#555555');
      doc.text('Staff:', 40, y);
      doc.font('Helvetica').fillColor('#333333');
      doc.text(`${expense.staff.firstName || ''} ${expense.staff.lastName || ''} ${expense.staff.employeeId ? `(${expense.staff.employeeId})` : ''}`, 120, y);
      y += 20;
    }
    
    if (expense.notes) {
      doc.fontSize(10).fillColor('#555555');
      doc.text('Notes:', 40, y);
      doc.font('Helvetica').fillColor('#333333');
      doc.text(expense.notes, 120, y, { width: contentWidth - 100 });
      y += 20;
    }
    
    y += 30;
    
    const lineY = y + 25;
    doc.moveTo(40, lineY).lineTo(pageWidth / 2 - 30, lineY).stroke('#333333');
    doc.moveTo(pageWidth / 2 + 30, lineY).lineTo(pageWidth - 40, lineY).stroke('#333333');
    
    doc.fontSize(9).fillColor('#555555').font('Helvetica');
    doc.text('Prepared By', 40, lineY + 8, { align: 'center', width: pageWidth / 2 - 70 });
    doc.text('Approved By', pageWidth / 2 + 30, lineY + 8, { align: 'center', width: pageWidth / 2 - 70 });
    
    doc.fontSize(8).fillColor('#999999');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, pageHeight - 40);
    doc.text(`Voucher: ${expense.voucherNumber}`, pageWidth - 150, pageHeight - 40);
    
    doc.end();
  } catch (error) {
    console.error('Error generating voucher PDF:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getVoucherPreview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findById(id)
      .populate('school', 'name address phone email tagline logo settings');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
