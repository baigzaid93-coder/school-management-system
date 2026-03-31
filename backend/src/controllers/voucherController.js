const PDFDocument = require('pdfkit');
const Expense = require('../models/Expense');
const School = require('../models/School');
const LetterHead = require('../models/LetterHead');

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
    const schoolId = school?._id || school;
    const letterHead = schoolId ? await LetterHead.findOne({ school: schoolId }) : null;
    const primaryColor = letterHead?.primaryColor || school?.settings?.primaryColor || '#1e40af';
    const accentColor = letterHead?.accentColor || school?.settings?.accentColor || '#3b82f6';
    const currency = school?.settings?.currency || 'PKR';
    
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Voucher-${expense.voucherNumber}.pdf`);
    doc.pipe(res);
    
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - 60;
    
    const drawLetterHead = (startY) => {
      let y = startY;
      const leftMargin = 30;
      const rightMargin = pageWidth - 30;
      
      doc.rect(leftMargin, y, contentWidth, 100)
        .fillAndStroke('#f8fafc', primaryColor);
      
      doc.rect(leftMargin, y, 4, 100).fill(primaryColor);
      
      const logoData = letterHead?.logo;
      if (logoData) {
        try {
          const imgBuffer = Buffer.from(logoData.split(',')[1] || logoData, 'base64');
          doc.image(imgBuffer, leftMargin + 15, y + 15, { width: 70, height: 70 });
        } catch (e) {}
      }
      
      const textStartX = logoData ? leftMargin + 100 : leftMargin + 15;
      const headerText = letterHead?.headerText || 'School Name';
      
      doc.fontSize(20).fillColor(primaryColor).font('Helvetica-Bold');
      doc.text(headerText, textStartX, y + 15, { width: contentWidth - 120 });
      
      const taglineText = letterHead?.tagline || '';
      if (taglineText) {
        doc.fontSize(11).fillColor(accentColor).font('Helvetica-Oblique');
        doc.text(taglineText, textStartX, y + 35, { width: contentWidth - 120 });
      }
      
      const contactParts = [];
      if (letterHead?.address) {
        contactParts.push(letterHead.address);
      }
      if (letterHead?.phone) {
        contactParts.push(`Ph: ${letterHead.phone}`);
      }
      if (letterHead?.email) {
        contactParts.push(letterHead.email);
      }
      if (letterHead?.website) {
        contactParts.push(letterHead.website);
      }
      
      if (contactParts.length > 0) {
        doc.fontSize(9).fillColor('#64748b').font('Helvetica');
        doc.text(contactParts.join('  •  '), textStartX, y + 55, { width: contentWidth - 120 });
      }
      
      y += 110;
      
      doc.moveTo(leftMargin, y).lineTo(rightMargin, y).stroke('#e2e8f0');
      
      return y + 15;
    };
    
    let y = drawLetterHead(20);
    
    doc.rect(30, y, contentWidth, 40).fillAndStroke(primaryColor, primaryColor);
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold');
    doc.text('PAYMENT VOUCHER', 0, y + 10, { align: 'center' });
    doc.fontSize(11).font('Helvetica');
    doc.text(`Voucher #: ${expense.voucherNumber}`, 0, y + 26, { align: 'center' });
    
    y += 55;
    
    doc.fontSize(10).fillColor('#333333');
    const leftCol = 30;
    const rightCol = pageWidth / 2;
    const labelWidth = 110;
    
    const addField = (label, value, x, yPos) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b');
      doc.text(label + ':', x, yPos);
      doc.font('Helvetica').fillColor('#1e293b');
      doc.text(value || '-', x + labelWidth, yPos);
    };
    
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    };
    
    doc.rect(30, y - 5, contentWidth, 70).fillAndStroke('#f8fafc', '#e2e8f0');
    addField('Date', formatDate(expense.date), leftCol + 10, y + 5);
    addField('Category', expense.category || '-', rightCol, y + 5);
    
    y += 18;
    addField('Payment Method', expense.paymentMethod || 'Cash', leftCol + 10, y + 5);
    addField('Reference', expense.reference || '-', rightCol, y + 5);
    
    y += 80;
    
    doc.rect(30, y, contentWidth, 5).fill(accentColor);
    
    y += 15;
    
    doc.rect(30, y, contentWidth, 65).fillAndStroke('#fff', '#e2e8f0');
    doc.rect(30, y, 4, 65).fill(accentColor);
    
    doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
    doc.text('Description:', 45, y + 10);
    doc.font('Helvetica').fontSize(10).fillColor('#334155');
    doc.text(expense.description || '-', 45, y + 26, { width: contentWidth - 30, height: 40 });
    
    y += 80;
    
    doc.rect(30, y, contentWidth, 45).fillAndStroke(primaryColor, primaryColor);
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
    doc.text('AMOUNT:', 50, y + 16);
    doc.fontSize(14);
    doc.text(formatCurrency(expense.amount, currency), 0, y + 14, { align: 'right', rightMargin: 40 });
    
    y += 55;
    
    doc.fontSize(10).fillColor('#64748b');
    doc.text('Amount in Words:', 30, y);
    doc.font('Helvetica').fillColor('#334155').fontSize(11);
    doc.text(numberToWords(expense.amount) + ' ' + currency + ' Only', 30, y + 16);
    
    y += 45;
    
    const infoBoxY = y;
    doc.rect(30, infoBoxY, contentWidth, 0).stroke('#f1f5f9');
    
    if (expense.vendor || expense.teacher || expense.staff) {
      doc.rect(30, infoBoxY, contentWidth / 2 - 5, 45).fillAndStroke('#f8fafc', '#e2e8f0');
      let infoY = infoBoxY + 10;
      
      if (expense.vendor) {
        doc.fontSize(9).fillColor('#64748b').text('Vendor:', 40, infoY);
        doc.font('Helvetica').fillColor('#1e293b');
        doc.text(expense.vendor, 90, infoY);
        infoY += 15;
      }
      
      if (expense.teacher) {
        doc.fontSize(9).fillColor('#64748b').text('Teacher:', 40, infoY);
        doc.font('Helvetica').fillColor('#1e293b');
        doc.text(`${expense.teacher.firstName || ''} ${expense.teacher.lastName || ''}`, 90, infoY);
        infoY += 15;
      }
      
      if (expense.staff) {
        doc.fontSize(9).fillColor('#64748b').text('Staff:', 40, infoY);
        doc.font('Helvetica').fillColor('#1e293b');
        doc.text(`${expense.staff.firstName || ''} ${expense.staff.lastName || ''}`, 90, infoY);
      }
      
      y += 50;
    }
    
    if (expense.notes) {
      doc.fontSize(9).fillColor('#64748b');
      doc.text('Notes:', 30, y);
      doc.font('Helvetica').fillColor('#475569');
      doc.text(expense.notes, 30, y + 14, { width: contentWidth });
      y += 35;
    }
    
    y += 20;
    
    const lineY = y + 25;
    doc.moveTo(30, lineY).lineTo(pageWidth / 2 - 20, lineY).stroke('#334155');
    doc.moveTo(pageWidth / 2 + 20, lineY).lineTo(pageWidth - 30, lineY).stroke('#334155');
    
    doc.fontSize(9).fillColor('#64748b').font('Helvetica');
    doc.text('Prepared By', 30, lineY + 8, { align: 'center', width: pageWidth / 2 - 50 });
    doc.text('Approved By', pageWidth / 2 + 20, lineY + 8, { align: 'center', width: pageWidth / 2 - 50 });
    
    y = lineY + 35;
    doc.moveTo(30, y).lineTo(pageWidth - 30, y).stroke('#e2e8f0');
    
    doc.fontSize(8).fillColor('#94a3b8');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 30, pageHeight - 35);
    doc.text(`Voucher: ${expense.voucherNumber}`, pageWidth - 130, pageHeight - 35);
    
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
