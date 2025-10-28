import React from 'react';
import { useTheme } from '../ThemeContext';

interface AdminNavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminNavigationTabs: React.FC<AdminNavigationTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'fa-home' },
    { id: 'badge-management', label: 'Badge Management', icon: 'fa-medal' },
  ];

  return (
    <nav className="nav-tabs">
      <div className="nav-tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default AdminNavigationTabs;