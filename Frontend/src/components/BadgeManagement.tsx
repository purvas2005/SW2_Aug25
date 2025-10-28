import { useState } from 'react';
import { useTheme } from '../ThemeContext';

const BadgeManagement = () => {
  const { theme } = useTheme();
  const [newBadge, setNewBadge] = useState({
    type: ''
  });

  const handleAddBadge = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New Badge:', newBadge);
    setNewBadge({ type: '' });
  };

  return (
    <div>
      {/* Create New Certificate Form */}
      <div className="form-container">
        <h2 className="form-title">Create New Certificate</h2>

        <form onSubmit={handleAddBadge}>


          <div className="form-group">
            <label className="form-label">Badge Type</label>
            <select
              value={newBadge.type}
              onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select Type</option>
              <option value="Hackathon Winner">Hackathon Winner</option>
              <option value="Innovation Award">Innovation Award</option>
            </select>
          </div>

          <button type="submit" className="form-button">
            Create Badge
          </button>
        </form>
      </div>
    </div>
  );
};

export default BadgeManagement;