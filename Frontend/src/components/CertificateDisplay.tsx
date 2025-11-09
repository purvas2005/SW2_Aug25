import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Certificate {
  _id: string;
  srn: string;
  eventName: string;
  certificateUrl: string;
  studentName?: string;
  issueDate?: string;
  description?: string;
  badgeType?: string;
}

const CertificateDisplay = () => {
  const { srn, eventName } = useParams<{ srn: string; eventName: string }>();
  const navigate = useNavigate();
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Since the URL uses normalized event names (no spaces, lowercase),
        // we need to fetch all certificates and find the matching one
        const response = await axios.get('http://localhost:5001/api/certificates');
        
        if (response.data && Array.isArray(response.data)) {
          // Find certificate by matching SRN and normalized event name
          const foundCertificate = response.data.find((cert: Certificate) => {
            const normalizedDbEventName = cert.eventName.replace(/\s+/g, '').toLowerCase();
            return cert.srn === srn && normalizedDbEventName === eventName;
          });
          
          if (foundCertificate) {
            setCertificate(foundCertificate);
          } else {
            setError('Certificate not found');
          }
        } else {
          setError('Certificate not found');
        }
      } catch (err) {
        console.error('Failed to fetch certificate:', err);
        setError('Failed to load certificate. Please check if the certificate exists.');
      } finally {
        setLoading(false);
      }
    };

    if (srn && eventName) {
      fetchCertificate();
    } else {
      setError('Invalid certificate URL');
      setLoading(false);
    }
  }, [srn, eventName]);

  const handleDownload = async () => {
    if (!certificate?.certificateUrl) return;

    try {
      const response = await fetch(certificate.certificateUrl, {
        mode: 'cors',
      });
      
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Force .png extension for reliable opening
      const cleanEventName = certificate.eventName.replace(/\s+/g, '_');
      link.download = `${cleanEventName}_Certificate.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download failed, falling back to open in new tab:', err);
      window.open(certificate.certificateUrl, '_blank');
    }
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert('Certificate URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  if (loading) {
    return (
      <div className="certificate-container">
        <div className="certificate-loading">
          <div className="loading-spinner"></div>
          <p>Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="certificate-container">
        <div className="certificate-error">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2>Certificate Not Found</h2>
          <p>{error || 'The requested certificate could not be found.'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-container">
      <div className="certificate-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <i className="fas fa-arrow-left"></i>
          Back
        </button>
        <div className="certificate-actions">
          <button onClick={handleShare} className="action-btn share-btn">
            <i className="fas fa-share"></i>
            Share
          </button>
          <button onClick={handleDownload} className="action-btn download-btn">
            <i className="fas fa-download"></i>
            Download
          </button>
        </div>
      </div>

      <div className="certificate-content">
        <div className="certificate-info">
          <h1 className="certificate-title">Digital Certificate</h1>
          <div className="certificate-details">
            <div className="detail-row">
              <span className="detail-label">Student Name:</span>
              <span className="detail-value">{certificate.studentName || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">SRN:</span>
              <span className="detail-value">{certificate.srn}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Event:</span>
              <span className="detail-value">{certificate.eventName}</span>
            </div>
            {certificate.badgeType && (
              <div className="detail-row">
                <span className="detail-label">Badge Type:</span>
                <span className="detail-value badge-type">{certificate.badgeType}</span>
              </div>
            )}
            {certificate.issueDate && (
              <div className="detail-row">
                <span className="detail-label">Issue Date:</span>
                <span className="detail-value">{new Date(certificate.issueDate).toLocaleDateString()}</span>
              </div>
            )}
            {certificate.description && (
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{certificate.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="certificate-display">
          <div className="certificate-frame">
            {certificate.certificateUrl ? (
              <img 
                src={certificate.certificateUrl} 
                alt={`Certificate for ${certificate.eventName}`}
                className="certificate-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="certificate-placeholder">
                        <i class="fas fa-certificate"></i>
                        <p>Certificate image could not be loaded</p>
                        <a href="${certificate.certificateUrl}" target="_blank" class="view-original-btn">
                          View Original
                        </a>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="certificate-placeholder">
                <i className="fas fa-certificate"></i>
                <p>No certificate image available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="certificate-footer">
        <div className="verification-info">
          <i className="fas fa-shield-check"></i>
          <span>This certificate is digitally verified and stored on the blockchain</span>
        </div>
      </div>
    </div>
  );
};

export default CertificateDisplay;