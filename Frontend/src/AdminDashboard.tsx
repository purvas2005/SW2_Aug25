import AdminHeader from './components/AdminHeader';
import BadgeManagement from './components/BadgeManagement';
import './index.css';

function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <AdminHeader />

        <main className="main-content">
          <BadgeManagement />
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;