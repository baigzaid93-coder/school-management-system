import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { letterHeadService } from '../services/api';
import './StudentIDCard.css';

const StudentIDCard = ({ student, onClose }) => {
  const [showBack, setShowBack] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [barcodeValue] = useState(() => student?.studentId || 'SID' + Math.random().toString(36).substr(2, 9).toUpperCase());
  const [letterHead, setLetterHead] = useState(null);
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getValidTill = () => {
    const year = new Date().getFullYear() + 2;
    return `30 June ${year}`;
  };

  useEffect(() => {
    const fetchLetterHead = async () => {
      try {
        const response = await letterHeadService.get();
        if (response.data) {
          setLetterHead(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch letter head:', err);
      }
    };
    fetchLetterHead();
  }, []);

  useEffect(() => {
    const generateQR = async () => {
      if (student && letterHead) {
        const qrData = JSON.stringify({
          id: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          class: student.classGrade?.name || '-',
          school: letterHead.headerText || 'School'
        });
        try {
          const url = await QRCode.toDataURL(qrData, { width: 50, margin: 0 });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('QR generation failed:', err);
        }
      }
    };
    generateQR();
  }, [student, letterHead]);

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

  const schoolName = letterHead?.headerText || 'School Name';
  const primaryColor = letterHead?.primaryColor || '#1e40af';
  const accentColor = letterHead?.accentColor || '#3b82f6';

  return (
    <div className="id-card-modal-overlay">
      <div className="id-card-container">
        <div className="id-card-header">
          <h2>Student ID Card</h2>
          <div className="header-actions">
            <button className="btn-toggle" onClick={() => setShowBack(!showBack)}>
              {showBack ? 'Show Front' : 'Show Back'}
            </button>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="id-card-wrapper">
          {/* Front Side */}
          <div className={`id-card-side ${showBack ? 'hidden' : 'active'}`}>
            <div id="id-card-front" className="id-card horizontal-card">
              <div className="card-left">
                <div className="header-section">
                  <div className="logo-area">
                    {letterHead?.logo ? (
                      <img src={letterHead.logo} alt="School Logo" className="school-logo" />
                    ) : (
                      <div className="logo-placeholder" style={{ backgroundColor: primaryColor }}>
                        <span>{schoolName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="school-text">
                    <h1 className="school-name" style={{ color: primaryColor }}>{schoolName}</h1>
                    {letterHead?.tagline && (
                      <p className="school-tagline" style={{ color: accentColor }}>{letterHead.tagline}</p>
                    )}
                  </div>
                </div>
                
                <div className="card-title" style={{ backgroundColor: primaryColor }}>Student Identity Card</div>
                
                <div className="photo-section">
                  <div className="photo-frame">
                    {student?.photo ? (
                      <img src={student.photo} alt="Student" className="student-photo" />
                    ) : (
                      <div className="photo-placeholder" style={{ backgroundColor: primaryColor }}>
                        <span>{student?.firstName?.charAt(0) || 'S'}</span>
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
                  <span className="signature-label">Principal</span>
                </div>
              </div>

              <div className="card-right">
                <div className="info-section">
                  <div className="info-row">
                    <span className="label">Student Name</span>
                    <span className="value">{student?.firstName} {student?.lastName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Father Name</span>
                    <span className="value">{student?.parentName || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Student ID</span>
                    <span className="value id-highlight">{student?.studentId}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Class</span>
                    <span className="value">{student?.classGrade?.name || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Section</span>
                    <span className="value">{student?.section?.name || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Roll No</span>
                    <span className="value">{student?.rollNo || '-'}</span>
                  </div>
                </div>

                <div className="info-secondary">
                  <div className="info-item">
                    <span className="label-sm">Date of Birth</span>
                    <span className="value-sm">{formatDate(student?.dateOfBirth)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label-sm">Blood Group</span>
                    <span className="value-sm">{student?.bloodGroup || '-'}</span>
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

          {/* Back Side */}
          <div className={`id-card-side ${!showBack ? 'hidden' : 'active'}`}>
            <div id="id-card-back" className="id-card horizontal-card back-card">
              <div className="back-header" style={{ backgroundColor: primaryColor }}>
                <h2 className="back-school-name">{schoolName}</h2>
              </div>

              <div className="back-content">
                <div className="back-section">
                  <h3 className="section-title" style={{ color: primaryColor }}>Contact Information</h3>
                  <div className="contact-list">
                    {letterHead?.address && (
                      <div className="contact-item">
                        <span className="icon">📍</span>
                        <span>{letterHead.address}</span>
                      </div>
                    )}
                    {letterHead?.phone && (
                      <div className="contact-item">
                        <span className="icon">📞</span>
                        <span>{letterHead.phone}</span>
                      </div>
                    )}
                    {letterHead?.email && (
                      <div className="contact-item">
                        <span className="icon">✉️</span>
                        <span>{letterHead.email}</span>
                      </div>
                    )}
                    {letterHead?.website && (
                      <div className="contact-item">
                        <span className="icon">🌐</span>
                        <span>{letterHead.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="back-section">
                  <h3 className="section-title" style={{ color: primaryColor }}>Academic Info</h3>
                  <div className="info-grid">
                    <div className="grid-item">
                      <span className="label-sm">Admission Date</span>
                      <span className="value-sm">{formatDate(student?.admissionDate)}</span>
                    </div>
                    <div className="grid-item">
                      <span className="label-sm">Academic Year</span>
                      <span className="value-sm">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="if-found-box" style={{ borderColor: primaryColor }}>
                  <h3 style={{ color: primaryColor }}>⚠️ IF FOUND</h3>
                  <p>Please return this card to the school or contact us. This card is the property of {schoolName}.</p>
                </div>
              </div>

              <div className="back-footer">
                <div className="signature-section">
                  <div className="signature-line"></div>
                  <span className="signature-label">Authorized Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
