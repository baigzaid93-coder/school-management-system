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
      const pdf = new jsPDF('p', 'mm', [86, 54]);
      
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
          {/* Front Side - Vertical */}
          <div className={`id-card-side ${showBack ? 'hidden' : 'active'}`}>
            <div id="id-card-front" className="id-card vertical-card">
              <div className="vertical-header" style={{ backgroundColor: primaryColor }}>
                <div className="vertical-school-info">
                  {letterHead?.logo && (
                    <img src={letterHead.logo} alt="Logo" className="vertical-logo" />
                  )}
                  <div>
                    <h1 className="vertical-school-name">{schoolName}</h1>
                    {letterHead?.tagline && (
                      <p className="vertical-tagline">{letterHead.tagline}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="vertical-card-body">
                <div className="vertical-photo-section">
                  <div className="vertical-photo-frame">
                    {student?.photo ? (
                      <img src={student.photo} alt="Student" className="student-photo" />
                    ) : (
                      <div className="vertical-photo-placeholder" style={{ backgroundColor: primaryColor }}>
                        <span>{student?.firstName?.charAt(0) || 'S'}</span>
                      </div>
                    )}
                  </div>
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR" className="vertical-qr" />
                  )}
                </div>

                <div className="vertical-title" style={{ backgroundColor: accentColor }}>
                  Student Identity Card
                </div>

                <div className="vertical-info">
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
                    <span className="value">{student?.studentId}</span>
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
                  <div className="info-row">
                    <span className="label">DOB</span>
                    <span className="value">{formatDate(student?.dateOfBirth)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Blood Group</span>
                    <span className="value">{student?.bloodGroup || '-'}</span>
                  </div>
                </div>

                <div className="vertical-footer">
                  <div className="vertical-barcode">
                    <div className="barcode">{generateBarcode()}</div>
                    <span className="barcode-number">{barcodeValue}</span>
                  </div>
                  <div className="validity">
                    Valid Till: {getValidTill()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side - Vertical */}
          <div className={`id-card-side ${!showBack ? 'hidden' : 'active'}`}>
            <div id="id-card-back" className="id-card vertical-card">
              <div className="vertical-back-header" style={{ backgroundColor: primaryColor }}>
                <h2>{schoolName}</h2>
              </div>
              <div className="vertical-back-body">
                <div className="back-section">
                  <h3 style={{ color: primaryColor }}>Contact Information</h3>
                  {letterHead?.address && <p>📍 {letterHead.address}</p>}
                  {letterHead?.phone && <p>📞 {letterHead.phone}</p>}
                  {letterHead?.email && <p>✉️ {letterHead.email}</p>}
                  {letterHead?.website && <p>🌐 {letterHead.website}</p>}
                </div>

                <div className="back-section">
                  <h3 style={{ color: primaryColor }}>Academic Info</h3>
                  <div className="info-grid">
                    <div><span>Admission Date:</span> {formatDate(student?.admissionDate)}</div>
                    <div><span>Academic Year:</span> {new Date().getFullYear()}-{new Date().getFullYear() + 1}</div>
                  </div>
                </div>

                <div className="if-found-box" style={{ borderColor: primaryColor }}>
                  <h3 style={{ color: primaryColor }}>⚠️ IF FOUND</h3>
                  <p>Please return this card to the school. This card is the property of {schoolName}.</p>
                </div>
              </div>
              <div className="vertical-back-footer">
                <div className="signature-line"></div>
                <span>Principal Signature</span>
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
