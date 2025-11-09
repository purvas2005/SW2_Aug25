import { useState } from 'react';
import { useTheme } from '../ThemeContext';

interface PasswordProtectedProps {
  children: React.ReactNode;
  onClose: () => void;
}

const PasswordProtected: React.FC<PasswordProtectedProps> = ({ children, onClose }) => {
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a brief loading time for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Hardcoded credentials as requested
    if (username === 'admin' && password === '123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setError('');
    onClose(); // Return to previous tab
  };

  if (isAuthenticated) {
    return (
      <div className="password-protected-content">
        <div className="auth-header">
          <div className="auth-status">
            <i className="fas fa-shield-alt"></i>
            <span>Authenticated as: <strong>{username}</strong></span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="password-protection-container">
      <div className="login-form-container">
        <div className="login-header">
          <div className="security-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h2>Badge Management Access</h2>
          <p>This section requires administrator authentication</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <i className="fas fa-user"></i>
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-key"></i>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Login
                </>
              )}
            </button>
          </div>
        </form>

        <div className="login-hint">
          <small>
            <i className="fas fa-info-circle"></i>
            For demo purposes: admin / 123
          </small>
        </div>
      </div>

      <style jsx>{`
        .password-protection-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          padding: 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .login-form-container {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          text-align: center;
          border: 1px solid #e1e8ed;
        }

        .login-header {
          margin-bottom: 2rem;
        }

        .security-icon {
          font-size: 3rem;
          color: #007bff;
          margin-bottom: 1rem;
        }

        .login-header h2 {
          color: #333;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .login-header p {
          color: #6c757d;
          margin: 0;
          font-size: 0.95rem;
        }

        .login-form {
          text-align: left;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          color: #495057;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .form-group label i {
          margin-right: 0.5rem;
          width: 16px;
          color: #007bff;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-group input:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
        }

        .error-message i {
          margin-right: 0.5rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .cancel-button, .login-button {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .cancel-button:hover:not(:disabled) {
          background: #545b62;
        }

        .login-button {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
        }

        .login-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #0056b3, #004085);
          transform: translateY(-1px);
        }

        .cancel-button:disabled, .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-hint {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e1e8ed;
          color: #6c757d;
        }

        .password-protected-content {
          width: 100%;
        }

        .auth-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .auth-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .auth-status i {
          font-size: 1.2rem;
        }

        .logout-button {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logout-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        @media (max-width: 480px) {
          .password-protection-container {
            padding: 1rem;
          }
          
          .login-form-container {
            padding: 2rem 1.5rem;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .auth-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PasswordProtected;