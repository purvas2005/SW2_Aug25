import { useState } from 'react';
import AdminHeader from './components/AdminHeader';
import AdminHome from './components/AdminHome';
import AdminNavigationTabs from './components/AdminNavigationTabs';
import BadgeManagement from './components/BadgeManagement';
import CertificateList from './components/CertificateList';
import './index.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminHome />;
      case 'badge-management':
        return <BadgeManagement />;
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
          setActiveTab={setActiveTab} 
        />

        <main className="main-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;