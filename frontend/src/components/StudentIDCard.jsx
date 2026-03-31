import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { settingsService, letterHeadService } from '../services/api';
import './StudentIDCard.css';

const StudentIDCard = ({ student, schoolInfo, onClose }) => {
  const [showBack, setShowBack] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [barcodeValue] = useState(() => student?.studentId || 'SID' + Math.random().toString(36).substr(2, 9).toUpperCase());
  const [schoolData, setSchoolData] = useState(null);
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getValidTill = () => {
    const year = new Date().getFullYear() + 1;
    return `30 June ${year}`;
  };

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const [schoolRes, letterHeadRes] = await Promise.all([
          settingsService.school.get(),
          letterHeadService.get()
        ]);
        
        const schoolSettings = schoolRes.data || {};
        const letterHeadData = letterHeadRes.data || {};
        
        setSchoolData({
          name: schoolSettings.name || 'School Name',
          tagline: schoolSettings.tagline || schoolSettings.schoolTagline || '',
          address: schoolSettings.address || '',
          phone: schoolSettings.phone || '',
          website: schoolSettings.website || '',
          email: schoolSettings.email || '',
          logo: letterHeadData.logo || schoolSettings.logo || null
        });
      } catch (err) {
        console.error('Failed to fetch school data:', err);
        setSchoolData({
          name: schoolInfo?.name || 'School Name',
          tagline: schoolInfo?.tagline || '',
          address: schoolInfo?.address || '',
          phone: schoolInfo?.phone || '',
          website: schoolInfo?.website || '',
          email: schoolInfo?.email || '',
          logo: schoolInfo?.logo || null
        });
      }
    };
    
    fetchSchoolData();
  }, []);

  useEffect(() => {
    const generateQR = async () => {
      if (student) {
        const qrData = JSON.stringify({
          id: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          class: student.classGrade?.name || '-',
          school: schoolData?.name || 'School'
        });
        try {
          const url = await QRCode.toDataURL(qrData, { width: 60, margin: 0 });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('QR generation failed:', err);
        }
      }
    };
    generateQR();
  }, [student, schoolData]);

  const generateBarcode = () => {
    return barcodeValue.split('').map((char, i) => (
      <span key={i} className={`bar-code-line ${char === '0' ? 'thin' : 'thick'}`}></span>
    ));
  };

  const downloadPDF = async () => {
    const cardElement = document.getElementById('id-card-front');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', [86, 54]);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      
      if (showBack) {
        const backElement = document.getElementById('id-card-back');
        if (backElement) {
          const backCanvas = await html2canvas(backElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          pdf.addPage();
          const backImgData = backCanvas.toDataURL('image/png');
          pdf.addImage(backImgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }
      }

      pdf.save(`Student_ID_Card_${student?.studentId || 'card'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const downloadPNG = async () => {
    const cardElement = document.getElementById('id-card-front');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `Student_ID_Card_${student?.studentId || 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('PNG download failed:', error);
    }
  };

  const school = schoolData || schoolInfo || {
    name: 'School Name',
    tagline: '',
    address: '',
    phone: '',
    website: '',
    email: '',
    logo: null
  };

  const studentData = {
    ...student,
    fullName: `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || '-',
    className: student?.classGrade?.name || student?.class?.name || '-',
    sectionName: student?.section?.name || '-',
    dob: formatDate(student?.dateOfBirth),
    fatherName: student?.parentName || '-',
    bloodGroup: student?.bloodGroup || student?.admissionForm?.bloodGroup || '-',
    photo: student?.photo || student?.admissionForm?.photo || null
  };

  return (
    <div className="id-card-modal-overlay">
      <div className="id-card-container">
        <div className="id-card-header">
          <h2>Student ID Card Preview</h2>
          <div className="header-actions">
            <button className="btn-toggle" onClick={() => setShowBack(!showBack)}>
              {showBack ? 'Show Front' : 'Show Back'}
            </button>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="id-card-wrapper">
          {/* Front Side - Horizontal */}
          <div className={`id-card-side ${showBack ? 'hidden' : 'active'}`}>
            <div id="id-card-front" className="id-card horizontal-card">
              {/* Left Side - Photo and QR */}
              <div className="card-left">
                <div className="header-section">
                  <div className="logo-area">
                    {school.logo ? (
                      <img src={school.logo} alt="School Logo" className="school-logo" />
                    ) : (
                      <div className="logo-placeholder">
                        <span>{school.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="school-text">
                    <h1 className="school-name">{school.name}</h1>
                    <p className="school-tagline">{school.tagline}</p>
                  </div>
                </div>
                
                <div className="card-title">Student Identity Card</div>
                
                <div className="photo-section">
                  <div className="photo-frame">
                    {studentData.photo ? (
                      <img src={studentData.photo} alt="Student" className="student-photo" />
                    ) : (
                      <div className="photo-placeholder">
                        <span>{studentData.fullName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="qr-section">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
                    ) : (
                      <div className="qr-placeholder">QR</div>
                    )}
                  </div>
                </div>
                
                <div className="signature-section">
                  <div className="signature-line"></div>
                  <span className="signature-label">Principal Signature</span>
                </div>
              </div>

              {/* Right Side - Student Info */}
              <div className="card-right">
                <div className="info-section">
                  <div className="info-row">
                    <span className="label">Student Name</span>
                    <span className="value">{studentData.fullName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Father's Name</span>
                    <span className="value">{studentData.fatherName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Student ID</span>
                    <span className="value id-highlight">{studentData.studentId}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Class / Section</span>
                    <span className="value">{studentData.className} {studentData.sectionName !== '-' ? `/ ${studentData.sectionName}` : ''}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Roll Number</span>
                    <span className="value">{studentData.rollNo || '-'}</span>
                  </div>
                </div>

                <div className="info-secondary">
                  <div className="info-item">
                    <span className="label-sm">Date of Birth</span>
                    <span className="value-sm">{studentData.dob}</span>
                  </div>
                  <div className="info-item">
                    <span className="label-sm">Blood Group</span>
                    <span className="value-sm">{studentData.bloodGroup}</span>
                  </div>
                  <div className="info-item">
                    <span className="label-sm">Valid Till</span>
                    <span className="value-sm">{getValidTill()}</span>
                  </div>
                </div>

                <div className="barcode-section">
                  <div className="barcode">{generateBarcode()}</div>
                  <span className="barcode-number">{barcodeValue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side - Horizontal */}
          <div className={`id-card-side ${!showBack ? 'hidden' : 'active'}`}>
            <div id="id-card-back" className="id-card horizontal-card back-card">
              {/* Header */}
              <div className="back-header">
                <h2 className="back-school-name">{school.name}</h2>
              </div>

              {/* Content */}
              <div className="back-content">
                <div className="back-section">
                  <h3 className="section-title">Contact Information</h3>
                  <div className="contact-list">
                    <div className="contact-item">
                      <span className="icon">📍</span>
                      <span>{school.address}</span>
                    </div>
                    <div className="contact-item">
                      <span className="icon">📞</span>
                      <span>{school.phone}</span>
                    </div>
                    <div className="contact-item">
                      <span className="icon">🌐</span>
                      <span>{school.website}</span>
                    </div>
                    <div className="contact-item">
                      <span className="icon">✉️</span>
                      <span>{school.email}</span>
                    </div>
                  </div>
                </div>

                <div className="back-section">
                  <h3 className="section-title">Emergency & Transport</h3>
                  <div className="info-grid">
                    <div className="grid-item">
                      <span className="label-sm">Emergency Contact</span>
                      <span className="value-sm">{studentData.phone || '-'}</span>
                    </div>
                    <div className="grid-item">
                      <span className="label-sm">Transport Route</span>
                      <span className="value-sm">{studentData.transportRoute || '-'}</span>
                    </div>
                    <div className="grid-item">
                      <span className="label-sm">Pickup Point</span>
                      <span className="value-sm">{studentData.pickupPoint || '-'}</span>
                    </div>
                    <div className="grid-item">
                      <span className="label-sm">Academic Year</span>
                      <span className="value-sm">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="if-found-box">
                  <h3>⚠️ IF FOUND</h3>
                  <p>Please return this card to the school administration or contact the nearest police station.</p>
                </div>

                <div className="terms-box">
                  <p>This card is the property of {school.name}. Misuse will result in disciplinary action. Please report loss immediately to the school office.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="back-footer">
                <div className="signature-section">
                  <div className="signature-line"></div>
                  <span className="signature-label">Authorized Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions">
          <button className="btn-action btn-preview" onClick={() => setShowBack(!showBack)}>
            {showBack ? '← Front Side' : 'Back Side →'}
          </button>
          <button className="btn-action btn-pdf" onClick={downloadPDF}>
            📄 Download PDF
          </button>
          <button className="btn-action btn-png" onClick={downloadPNG}>
            🖼️ Download PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentIDCard;

// Sample Data for Testing
export const sampleStudent = {
  studentId: 'IGS-2024-0001',
  firstName: 'Ahmed',
  lastName: 'Khan',
  dateOfBirth: '2010-05-15',
  gender: 'Male',
  bloodGroup: 'A+',
  rollNo: '15',
  parentName: 'Muhammad Ali Khan',
  phone: '+92 300 1234567',
  classGrade: { name: 'Class 5' },
  section: { name: 'A' },
  photo: null,
  transportRoute: 'Route A - North Campus',
  pickupPoint: 'Main Boulevard Stop'
};

export const sampleSchoolInfo = {
  name: 'International Grammar School',
  tagline: 'Building Tomorrow\'s Leaders',
  address: '123 Education Street, Main Boulevard, City - 12345',
  phone: '+92 300 1234567',
  website: 'www.grammarschool.edu',
  email: 'info@grammarschool.edu',
  logo: null
};
