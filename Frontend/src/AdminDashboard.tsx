import { useState } from 'react';
import AdminHeader from './components/AdminHeader';
import AdminHome from './components/AdminHome';
import AdminNavigationTabs from './components/AdminNavigationTabs';
import BadgeManagement from './components/BadgeManagement';
import CertificateList from './components/CertificateList';
import PasswordProtected from './components/PasswordProtected';
import './index.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
  };

  const handlePasswordProtectedClose = () => {
    // Return to home tab when password protection is cancelled
    setActiveTab('home');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminHome />;
      case 'badge-management':
        return (
          <PasswordProtected onClose={handlePasswordProtectedClose}>
            <BadgeManagement />
          </PasswordProtected>
        );
      case 'certificate-list':
        return <CertificateList />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <AdminHeader />
        
        <AdminNavigationTabs 
          activeTab={activeTab} 
          setActiveTab={handleTabSwitch} 
        />

        <main className="main-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;