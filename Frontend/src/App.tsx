import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import AdminDashboard from './AdminDashboard';
import CertificateDisplay from './components/CertificateDisplay';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Admin Dashboard Route */}
          <Route path="/" element={<AdminDashboard />} />
          
          {/* Individual Certificate Route - matches pattern /certificate/SRN/EventName */}
          <Route path="/certificate/:srn/:eventName" element={<CertificateDisplay />} />
          
          {/* Fallback route for unknown paths */}
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
