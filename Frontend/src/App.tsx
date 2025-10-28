import { ThemeProvider } from './ThemeContext';
import AdminDashboard from './AdminDashboard';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AdminDashboard />
    </ThemeProvider>
  );
}

export default App;
