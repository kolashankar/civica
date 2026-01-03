import React, { useEffect, useState } from 'react';
import { teamsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, TrendingUp, Eye } from 'lucide-react';
import type { Team } from '../../types';

const Teams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      if (!user?.school_id) {
        setError('School information not found');
        return;
      }

      const response = await teamsApi.getBySchool(user.school_id);
      setTeams(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Manage student teams in your school</p>
        </div>
        <button
          onClick={() => navigate('/headmaster/teams/create')}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-4">No teams created yet</p>
          <button
            onClick={() => navigate('/headmaster/teams/create')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {team.students?.length || 0} members
                  </p>
                </div>
                {team.is_active ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                    Inactive
                  </span>
                )}
              </div>

              {/* Team Leader */}
              {team.team_leader && (
                <div className="mb-4 pb-4 border-b">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Team Leader</p>
                  <p className="text-sm font-medium text-gray-900">{team.team_leader.name}</p>
                </div>
              )}

              {/* Stats */}
              {team.stats && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Inspections</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {team.stats.total_inspections}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {team.stats.completed_inspections}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => navigate(`/headmaster/teams/${team.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;