import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamsApi } from '../../services/api';
import { ArrowLeft, Users, TrendingUp, ClipboardList, Crown } from 'lucide-react';

interface TeamPerformance {
  team: {
    id: string;
    name: string;
    member_count: number;
  };
  performance: {
    total_inspections: number;
    completed_inspections: number;
    pending_inspections: number;
    completion_rate: number;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    grade?: string;
    is_leader: boolean;
  }>;
  recent_activity: Array<{
    id: string;
    task_name: string;
    office_name: string;
    status: string;
    due_date: string;
  }>;
}

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<TeamPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchTeamPerformance();
    }
  }, [id]);

  const fetchTeamPerformance = async () => {
    try {
      setLoading(true);
      const response = await teamsApi.getById(id!);
      
      // Also fetch performance data
      const perfData = await fetch(`/api/teams/${id}/performance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
      
      setTeamData(perfData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load team details');
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

  if (error || !teamData) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/headmaster/teams')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Team not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/headmaster/teams')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{teamData.team.name}</h1>
          <p className="text-gray-600 mt-1">
            {teamData.team.member_count} members • {teamData.performance.completion_rate}% completion rate
          </p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inspections</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {teamData.performance.total_inspections}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {teamData.performance.completed_inspections}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {teamData.performance.pending_inspections}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {teamData.performance.completion_rate}%
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamData.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    {member.is_leader && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        <Crown className="w-3 h-3" />
                        Leader
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  {member.grade && (
                    <p className="text-xs text-gray-500 mt-1">Grade {member.grade}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Recent Inspections</h2>
        </div>
        <div className="p-6">
          {teamData.recent_activity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No inspections yet</p>
          ) : (
            <div className="space-y-3">
              {teamData.recent_activity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{activity.task_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.office_name} • Due: {new Date(activity.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;