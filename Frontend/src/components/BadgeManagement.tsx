import { useState } from 'react';
import { useTheme } from '../ThemeContext';

interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
  active: boolean;
}

const BadgeManagement = () => {
  const { theme } = useTheme();
  const [badges, setBadges] = useState<Badge[]>([
    {
      id: '1',
      name: 'Hackathon Winner',
      description: 'Awarded to hackathon winners',
      imageUrl: '/api/placeholder/100/100',
      criteria: 'Win a hackathon event',
      active: true
    },
    {
      id: '2',
      name: 'Innovation Award',
      description: 'For innovative projects',
      imageUrl: '/api/placeholder/100/100',
      criteria: 'Create an innovative solution',
      active: true
    }
  ]);

  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    criteria: '',
    imageUrl: ''
  });

  const handleAddBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const badge: Badge = {
      id: Date.now().toString(),
      ...newBadge,
      active: true
    };
    setBadges([...badges, badge]);
    setNewBadge({ name: '', description: '', criteria: '', imageUrl: '' });
  };

  const toggleBadgeStatus = (id: string) => {
    setBadges(badges.map(badge => 
      badge.id === id ? { ...badge, active: !badge.active } : badge
    ));
  };

  return (
    <div>
      {/* Create New Badge Form */}
      <div className="form-container">
        <h2 className="form-title">Create New Badge</h2>
        
        <form onSubmit={handleAddBadge}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Badge Name</label>
              <input
                type="text"
                value={newBadge.name}
                onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                value={newBadge.imageUrl}
                onChange={(e) => setNewBadge({...newBadge, imageUrl: e.target.value})}
                className="form-input"
                placeholder="https://example.com/badge.png"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={newBadge.description}
              onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
              className="form-textarea"
              rows={3}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Criteria</label>
            <textarea
              value={newBadge.criteria}
              onChange={(e) => setNewBadge({...newBadge, criteria: e.target.value})}
              className="form-textarea"
              rows={2}
              required
            />
          </div>
          
          <button type="submit" className="form-button">
            Create Badge
          </button>
        </form>
      </div>

      {/* Existing Badges */}
      <div className="form-container">
        <h2 className="form-title">Existing Badges</h2>
        
        <div className="badge-grid">
          {badges.map((badge) => (
            <div key={badge.id} className="badge-card-item">
              <div className="badge-card-header">
                <h3 className="badge-card-name">{badge.name}</h3>
                <button
                  onClick={() => toggleBadgeStatus(badge.id)}
                  className={`badge-status ${badge.active ? 'active' : 'inactive'}`}
                >
                  {badge.active ? 'Active' : 'Inactive'}
                </button>
              </div>
              
              <p className="badge-description">{badge.description}</p>
              <p className="badge-criteria">
                <strong>Criteria:</strong> {badge.criteria}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgeManagement;