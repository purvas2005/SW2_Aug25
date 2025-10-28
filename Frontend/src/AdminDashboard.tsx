import { useState } from 'react';
import AdminHeader from './components/AdminHeader';
import AdminNavigationTabs from './components/AdminNavigationTabs';
import AdminHome from './components/AdminHome';
import BadgeManagement from './components/BadgeManagement';
import './index.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <AdminHeader />
        
        <AdminNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="main-content">
          {activeTab === 'home' && <AdminHome />}
          {activeTab === 'badge-management' && <BadgeManagement />}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;