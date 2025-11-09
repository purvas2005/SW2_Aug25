import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';

interface Student {
  studentName: string;
  srn: string;
  event: string;
  date: string;
}

interface MintResult {
  studentName: string;
  srn: string;
  event?: string;
  status: string;
  transactionHash?: string;
  imageUrl?: string;
  error?: string;
  message?: string;
}

const BadgeManagement = () => {
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintResults, setMintResults] = useState<MintResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch students from CSV on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/badges');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error('Failed to fetch students:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMintAllBadges = async () => {
    setMinting(true);
    setShowResults(false);
    setMintResults([]);

    try {
      const response = await fetch('http://localhost:5001/api/mint-all-badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMintResults(data.results);
        setShowResults(true);
        
        // Show summary alert
        alert(`Bulk minting completed!\nSuccessful: ${data.summary.successful}\nFailed: ${data.summary.failed}\nSkipped: ${data.summary.skipped}\nTotal: ${data.summary.total}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to mint badges: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error minting badges:', error);
      alert('Network error occurred while minting badges');
    } finally {
      setMinting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'status-success';
      case 'failed':
        return 'status-failed';
      case 'skipped':
        return 'status-skipped';
      default:
        return 'status-default';
    }
  };

  return (
    <div>
      <div className="form-container">
        <h2 className="form-title">Badge Management</h2>

        {/* Student List from CSV */}
        <div className="badge-section">
          <div className="section-header">
            <h3>Students from badges.csv</h3>
            <button 
              onClick={fetchStudents} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="loading-message">Loading students...</div>
          ) : students.length > 0 ? (
            <>
              <div className="student-count">
                Total Students: {students.length}
              </div>
              
              <div className="students-table-container">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>SRN</th>
                      <th>Event</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={index}>
                        <td>{student.studentName}</td>
                        <td>{student.srn}</td>
                        <td>{student.event}</td>
                        <td>{student.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mint-section">
                <button 
                  onClick={handleMintAllBadges}
                  className="mint-all-button"
                  disabled={minting || students.length === 0}
                >
                  {minting ? 'Minting Badges...' : `Mint All ${students.length} Badges`}
                </button>
                
                {minting && (
                  <div className="minting-progress">
                    <p>🔄 Minting certificates for all students...</p>
                    <p>This may take several minutes. Please wait...</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-students">
              No students found in badges.csv file.
            </div>
          )}
        </div>

        {/* Minting Results */}
        {showResults && mintResults.length > 0 && (
          <div className="results-section">
            <h3>Minting Results</h3>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>SRN</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {mintResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.studentName}</td>
                      <td>{result.srn}</td>
                      <td>{result.event || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(result.status)}`}>
                          {result.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="result-details">
                        {result.status === 'success' && result.transactionHash && (
                          <div>
                            <div>✅ Certificate minted successfully</div>
                            <div className="tx-hash">
                              Tx: {result.transactionHash.substring(0, 10)}...
                            </div>
                          </div>
                        )}
                        {result.status === 'failed' && (
                          <div className="error-message">❌ {result.error}</div>
                        )}
                        {result.status === 'skipped' && (
                          <div className="skip-message">⏭️ {result.message}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .badge-section {
          margin: 2rem 0;
          padding: 1.5rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .section-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          margin: 0;
          color: #333;
        }

        .refresh-button {
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .refresh-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .refresh-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .student-count {
          margin-bottom: 1rem;
          font-weight: bold;
          color: #495057;
        }

        .students-table-container {
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }

        .students-table, .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }

        .students-table th, .students-table td,
        .results-table th, .results-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .students-table th, .results-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }

        .students-table tr:hover, .results-table tr:hover {
          background-color: #f5f5f5;
        }

        .mint-section {
          text-align: center;
          padding: 1rem 0;
        }

        .mint-all-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mint-all-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #218838, #1ea080);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .mint-all-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .minting-progress {
          margin-top: 1rem;
          padding: 1rem;
          background: #e7f3ff;
          border-radius: 4px;
          color: #004085;
        }

        .results-section {
          margin-top: 2rem;
          padding: 1.5rem;
          border: 1px solid #28a745;
          border-radius: 8px;
          background: #f8fff9;
        }

        .results-table-container {
          overflow-x: auto;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-success {
          background: #d4edda;
          color: #155724;
        }

        .status-failed {
          background: #f8d7da;
          color: #721c24;
        }

        .status-skipped {
          background: #fff3cd;
          color: #856404;
        }

        .result-details {
          font-size: 0.9rem;
        }

        .tx-hash {
          font-family: monospace;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .error-message {
          color: #dc3545;
        }

        .skip-message {
          color: #ffc107;
        }

        .loading-message, .no-students {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .students-table-container, .results-table-container {
            font-size: 0.9rem;
          }
          
          .mint-all-button {
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BadgeManagement;
