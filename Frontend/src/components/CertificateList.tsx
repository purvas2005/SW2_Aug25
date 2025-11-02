import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  transactionHash?: string;
  verified?: boolean;
}

const CertificateList = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBadge, setFilterBadge] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('http://localhost:5001/api/certificates');
        setCertificates(response.data || []);
      } catch (err) {
        console.error('Failed to fetch certificates:', err);
        setError('Failed to load certificates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const generateCertificateUrl = (srn: string, eventName: string) => {
    // Normalize event name: remove spaces, convert to lowercase
    const normalizedEventName = eventName.replace(/\s+/g, '').toLowerCase();
    return `/certificate/${srn}/${normalizedEventName}`;
  };

  const handleCertificateClick = (certificate: Certificate) => {
    const url = generateCertificateUrl(certificate.srn, certificate.eventName);
    navigate(url);
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.srn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.studentName && cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBadge = !filterBadge || cert.badgeType === filterBadge;
    
    return matchesSearch && matchesBadge;
  });

  const uniqueBadgeTypes = [...new Set(certificates.map(cert => cert.badgeType).filter(Boolean))];

  if (loading) {
    return (
      <div className="certificate-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="certificate-list-container">
        <div className="certificate-error">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2>Error Loading Certificates</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-list-container">
      <div className="certificate-list-header">
        <h1 className="page-title">Digital Certificates</h1>
        <div className="certificate-stats">
          <div className="stat-item">
            <span className="stat-number">{certificates.length}</span>
            <span className="stat-label">Total Certificates</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{certificates.filter(c => c.verified).length}</span>
            <span className="stat-label">Verified</span>
          </div>
        </div>
      </div>

      <div className="certificate-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by student name, SRN, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <select
          value={filterBadge}
          onChange={(e) => setFilterBadge(e.target.value)}
          className="filter-select"
        >
          <option value="">All Badge Types</option>
          {uniqueBadgeTypes.map(badgeType => (
            <option key={badgeType} value={badgeType}>{badgeType}</option>
          ))}
        </select>
      </div>

      {filteredCertificates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-certificate"></i>
          </div>
          <h3>No Certificates Found</h3>
          <p>{searchTerm ? 'Try adjusting your search terms.' : 'No certificates have been issued yet.'}</p>
        </div>
      ) : (
        <div className="certificates-grid">
          {filteredCertificates.map((certificate) => (
            <div
              key={certificate._id}
              className="certificate-card"
              onClick={() => handleCertificateClick(certificate)}
            >
              <div className="certificate-card-header">
                <div className="certificate-icon">
                  <i className="fas fa-certificate"></i>
                </div>
                {certificate.verified && (
                  <div className="badge-type-tag">
                    <i className="fas fa-shield-check"></i>
                    Verified
                  </div>
                )}
              </div>

              <div className="certificate-card-content">
                <h3 className="certificate-event">{certificate.eventName}</h3>
                
                <div className="certificate-info">
                  <p><span className="info-label">Student:</span> {certificate.studentName || 'N/A'}</p>
                  <p><span className="info-label">SRN:</span> {certificate.srn}</p>
                  <p><span className="info-label">Issue Date:</span> {certificate.issueDate || 'N/A'}</p>
                </div>

                {certificate.description && (
                  <p className="certificate-description">{certificate.description}</p>
                )}
              </div>

              <div className="certificate-card-actions">
                <button className="view-certificate-btn">
                  <i className="fas fa-eye"></i>
                  View Certificate
                </button>
                <p className="certificate-url-info">
                  URL: /certificate/{certificate.srn}/{certificate.eventName.replace(/\s+/g, '').toLowerCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificateList;