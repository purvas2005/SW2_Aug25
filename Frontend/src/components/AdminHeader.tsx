import { useTheme } from '../ThemeContext';

function AdminHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="admin-header">
      {/* Brand Name */}
      <div className="header-brand">
        <span className="brand-title">CIE IGNITE</span>
      </div>

      {/* Dashboard Title */}
      <h1 className="dashboard-title">Admin Dashboard</h1>
      
      {/* Right Section */}
      <div className="header-actions">
        {/* Theme Toggle Button */}
        <button onClick={toggleTheme} className="theme-toggle">
          <span style={{ fontSize: '1.125rem' }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {/* Admin Info */}
        <div className="admin-info">
          <div className="admin-avatar">
            <i className="fas fa-shield-alt" />
          </div>
          <div className="admin-details">
            <span className="admin-name">Admin User</span>
            <span className="admin-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;