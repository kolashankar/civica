import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { officeApi, inspectionsApi } from '../../services/api';
import { ClipboardCheck, Clock, CheckCircle, Star, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  total: number;
  pending: number;
  responded: number;
  avg_rating: number;
  overdue_count: number;
  overdue_inspections: any[];
}

const OfficeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInspections, setRecentInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const officeId = user?.office_id;
      if (!officeId) return;

      // Fetch stats
      const statsData = await officeApi.getStats(officeId);
      setStats(statsData);

      // Fetch recent inspections (submitted status)
      const inspections = await officeApi.getInspections(officeId, { status: 'submitted' });
      setRecentInspections(inspections.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      assigned: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      responded: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Office Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inspections</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <ClipboardCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Responses</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.pending || 0}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Responded</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats?.responded || 0}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.avg_rating?.toFixed(1) || '0.0'}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Star className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alerts */}
      {stats?.overdue_count && stats.overdue_count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="text-red-600 mt-0.5" size={20} />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Overdue Responses</h3>
              <p className="text-sm text-red-700 mt-1">
                You have {stats.overdue_count} inspection(s) pending response for more than 7 days.
              </p>
              <button
                onClick={() => navigate('/office/inspections?status=submitted')}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                View Overdue Inspections
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Inspections */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Inspections</h2>
            <button
              onClick={() => navigate('/office/inspections')}
              className="text-sm font-medium text-primary hover:text-blue-700"
            >
              View All
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentInspections.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No pending inspections</p>
            </div>
          ) : (
            recentInspections.map((inspection) => (
              <div
                key={inspection._id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/office/inspections/${inspection._id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{inspection.task_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{inspection.school?.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500">
                        Team: {inspection.team?.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        Submitted: {new Date(inspection.report?.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(inspection.status)}`}>
                      {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficeDashboard;