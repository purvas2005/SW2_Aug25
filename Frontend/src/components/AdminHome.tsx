import { useState, useEffect } from 'react';
import { Users, Zap, Award } from 'lucide-react';
import { useTheme } from '../ThemeContext'; // Make sure this path is correct
import axios from 'axios';

const AdminHome = () => {
  const { theme } = useTheme();

  const handleBadgeClick = (badgeType: string) => {
    console.log('Clicked badge:', badgeType);
  };

  const [loading, setLoading] = useState(true);
  const [totalTeams, setTotalTeams] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [tokensMinted, setTokensMinted] = useState(0);
  const [toBeEvaluated, setToBeEvaluated] = useState(0);
  const [badgeStats, setBadgeStats] = useState<Record<string, number>>({});

  const fetchTeamStats = async (
    setTotalTeams: Function,
    setTotalStudents: Function,
    setTokensMinted: Function,
    setBadgeStats: Function,
    setLoading: Function
  ) => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/teams');
      const validTeams = res.data.fullTeams.filter(Boolean);

      const badgeTypes = ['Newbie', 'Amateur', 'Intermediate', 'Pro', 'EntePROneur', 'Legend'];

      let totalStudents = 0;
      let mintedTokens = 0;
      let pendingEvalCount = 0;

      const badgeCounts: Record<string, number> = {
        Newbie: 0,
        Amateur: 0,
        Intermediate: 0,
        Pro: 0,
        EntePROneur: 0,
        Legend: 0
      };

      validTeams.forEach((team: any) => {
        const membersCount = 1 + (Array.isArray(team.members) ? team.members.length : 0);
        totalStudents += membersCount;

        if (badgeTypes.includes(team.status)) {
          mintedTokens += membersCount;
          badgeCounts[team.status] += 1;
        }

        if (team.status === 'pending' || team.status === 'Pending') {
          pendingEvalCount += 1;
        }
      });

      setTotalTeams(validTeams.length);
      setTotalStudents(totalStudents);
      setTokensMinted(mintedTokens);
      setToBeEvaluated(pendingEvalCount);
      setBadgeStats(badgeCounts);
    } catch (err) {
      console.error('Failed to fetch combined admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamStats(
      setTotalTeams,
      setTotalStudents,
      setTokensMinted,
      setBadgeStats,
      setLoading
    );
  }, []);

  const badgeEntries = Object.entries(badgeStats);
  const displayedBadges = badgeEntries.slice(0, 5);

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total Teams</p>
              <p className="stat-value">{loading ? '...' : totalTeams}</p>
            </div>
            <Users className="stat-icon" />
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total Students</p>
              <p className="stat-value">{loading ? '...' : totalStudents}</p>
            </div>
            <Users className="stat-icon" />
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Tokens Minted</p>
              <p className="stat-value">{loading ? '...' : tokensMinted}</p>
            </div>
            <Zap className="stat-icon" />
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">To be Evaluated</p>
              <p className="stat-value">{loading ? '...' : toBeEvaluated}</p>
            </div>
            <Award className="stat-icon" />
          </div>
        </div>
      </div>

      {/* Badge Distribution */}
      <div className="badge-card">
        <div className="badge-header">
          <h3 className="badge-title">Badge Distribution</h3>
        </div>
        <div className="badge-list">
          {displayedBadges.map(([badgeType, count]) => (
            <div
              key={badgeType}
              className="badge-item"
              onClick={() => handleBadgeClick(badgeType)}
            >
              <div className="badge-info">
                <div className="badge-icon">
                  <Award style={{ width: '24px', height: '24px' }} />
                </div>
                <span className="badge-name">{badgeType}</span>
              </div>
              <div className="badge-count">
                <span className="badge-number">{count}</span>
                <span className="badge-label">teams</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;