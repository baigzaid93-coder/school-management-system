import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 */
export const generateQRCode = async (data, options = {}) => {
  const defaultOptions = {
    width: 100,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  };
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return await QRCode.toDataURL(JSON.stringify(data), mergedOptions);
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
};

/**
 * Download ID Card as PDF
 */
export const downloadIDCardPDF = async (frontElement, backElement = null, filename = 'Student_ID_Card.pdf') => {
  if (!frontElement) {
    throw new Error('Card element not found');
  }

  try {
    // Generate front side
    const frontCanvas = await html2canvas(frontElement, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    const imgData = frontCanvas.toDataURL('image/png', 1.0);
    
    // Calculate dimensions (3.37" x 2.12" standard ID card ratio)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [90, 140]
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 2;

    // Add front side
    pdf.addImage(imgData, 'PNG', margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

    // Add back side if provided
    if (backElement) {
      const backCanvas = await html2canvas(backElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const backImgData = backCanvas.toDataURL('image/png', 1.0);
      pdf.addPage();
      pdf.addImage(backImgData, 'PNG', margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

/**
 * Download ID Card as PNG
 */
export const downloadIDCardPNG = async (element, filename = 'Student_ID_Card.png') => {
  if (!element) {
    throw new Error('Card element not found');
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    return true;
  } catch (error) {
    console.error('PNG download failed:', error);
    throw error;
  }
};

/**
 * Generate barcode pattern from text
 */
export const generateBarcodePattern = (text) => {
  if (!text) return [];
  
  return text.split('').map((char, index) => {
    const isDigit = !isNaN(parseInt(char));
    return {
      id: index,
      width: isDigit ? (parseInt(char) % 3 === 0 ? 3 : 2) : (char.charCodeAt(0) % 3 === 0 ? 3 : 2),
      height: isDigit ? 25 : 30
    };
  });
};

/**
 * Format date for ID card display
 */
export const formatIDDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

/**
 * Get validity date (next academic year)
 */
export const getValidTillDate = () => {
  const currentYear = new Date().getFullYear();
  return `30 June ${currentYear + 1}`;
};

/**
 * Get academic session string
 */
export const getAcademicSession = () => {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${currentYear + 1}`;
};

/**
 * Create student data object from various sources
 */
export const prepareStudentData = (student, admissionForm = null) => {
  const studentPhoto = student?.photo || admissionForm?.photo || null;
  const bloodGroup = student?.bloodGroup || admissionForm?.bloodGroup || '-';
  const fatherName = student?.father?.fullName || student?.parentName || '-';
  const motherName = student?.mother?.fullName || '-';
  const emergencyContact = student?.father?.mobile || student?.phone || '-';
  const transportRoute = student?.transportRoute || '-';
  const pickupPoint = student?.pickupPoint || '-';

  return {
    studentId: student?.studentId || 'N/A',
    fullName: [student?.firstName, student?.lastName].filter(Boolean).join(' ') || '-',
    fatherName,
    motherName,
    className: student?.classGrade?.name || student?.class?.name || '-',
    sectionName: student?.section?.name || '-',
    rollNo: student?.rollNo || '-',
    dob: formatIDDate(student?.dateOfBirth),
    gender: student?.gender || '-',
    bloodGroup,
    photo: studentPhoto,
    emergencyContact,
    transportRoute,
    pickupPoint,
    phone: student?.phone || '-',
    address: student?.address || admissionForm?.currentAddress || '-',
    validTill: getValidTillDate(),
    academicSession: getAcademicSession()
  };
};

export default {
  generateQRCode,
  downloadIDCardPDF,
  downloadIDCardPNG,
  generateBarcodePattern,
  formatIDDate,
  getValidTillDate,
  getAcademicSession,
  prepareStudentData
};
