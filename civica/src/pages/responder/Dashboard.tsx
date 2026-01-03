import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { responderApi } from '../../services/api';
import { ClipboardCheck, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  overview: {
    total_inspections: number;
    active_inspections: number;
    pending_reviews: number;
    escalated_issues: number;
  };
  metrics: {
    avg_response_time: number;
    compliance_rate: number;
    resolution_rate: number;
    escalation_rate: number;
  };
}

interface PriorityItems {
  overdue_responses: any[];
  critical_issues: any[];
  repeated_violations: any[];
}

interface ActivityItem {
  type: string;
  timestamp: string;
  inspection_id: string;
  task_name: string;
  office_name: string;
  school_name: string;
  status: string;
  review_status?: string;
}

const ResponderDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [priorityItems, setPriorityItems] = useState<PriorityItems | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, priorityData, activityData] = await Promise.all([
        responderApi.getDashboardStats(),
        responderApi.getPriorityItems(),
        responderApi.getRecentActivity(10)
      ]);
      setStats(statsData);
      setPriorityItems(priorityData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission': return '📝';
      case 'response': return '💬';
      case 'review': return '✅';
      case 'assignment': return '📋';
      default: return '•';
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'submission':
        return `${activity.school_name} submitted inspection for ${activity.office_name}`;
      case 'response':
        return `${activity.office_name} responded to inspection`;
      case 'review':
        return `Inspection ${activity.review_status} for ${activity.office_name}`;
      case 'assignment':
        return `New inspection assigned to ${activity.school_name}`;
      default:
        return activity.task_name;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inspections</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.overview.total_inspections || 0}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <ClipboardCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Inspections</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.overview.active_inspections || 0}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats?.overview.pending_reviews || 0}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Escalated Issues</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats?.overview.escalated_issues || 0}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
            <TrendingDown className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.metrics.avg_response_time.toFixed(1) || '0.0'} days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.metrics.compliance_rate.toFixed(1) || '0.0'}%</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.metrics.resolution_rate.toFixed(1) || '0.0'}%</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Escalation Rate</p>
            <TrendingDown className="text-red-500" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.metrics.escalation_rate.toFixed(1) || '0.0'}%</p>
        </div>
      </div>

      {/* Priority Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Responses */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900">Overdue Responses</h3>
            <p className="text-sm text-red-700">{priorityItems?.overdue_responses.length || 0} items</p>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {priorityItems?.overdue_responses.slice(0, 5).map((item) => (
              <div
                key={item._id}
                className="mb-3 pb-3 border-b border-gray-200 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => navigate(`/responder/inspections/${item._id}`)}
              >
                <p className="text-sm font-medium text-gray-900">{item.office?.name}</p>
                <p className="text-xs text-gray-600">{item.school?.name}</p>
                <p className="text-xs text-red-600 mt-1">{item.days_overdue} days overdue</p>
              </div>
            ))}
            {(!priorityItems?.overdue_responses || priorityItems.overdue_responses.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No overdue responses</p>
            )}
          </div>
        </div>

        {/* Critical Issues */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-900">Critical Issues</h3>
            <p className="text-sm text-orange-700">{priorityItems?.critical_issues.length || 0} items</p>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {priorityItems?.critical_issues.slice(0, 5).map((item) => (
              <div
                key={item._id}
                className="mb-3 pb-3 border-b border-gray-200 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => navigate(`/responder/inspections/${item._id}`)}
              >
                <p className="text-sm font-medium text-gray-900">{item.office?.name}</p>
                <p className="text-xs text-gray-600">{item.school?.name}</p>
                <p className="text-xs text-orange-600 mt-1">Rating: {item.avg_rating}/5 ⭐</p>
              </div>
            ))}
            {(!priorityItems?.critical_issues || priorityItems.critical_issues.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No critical issues</p>
            )}
          </div>
        </div>

        {/* Repeated Violations */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 bg-purple-50">
            <h3 className="text-lg font-semibold text-purple-900">Repeated Violations</h3>
            <p className="text-sm text-purple-700">{priorityItems?.repeated_violations.length || 0} offices</p>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {priorityItems?.repeated_violations.slice(0, 5).map((item) => (
              <div
                key={item.office._id}
                className="mb-3 pb-3 border-b border-gray-200 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => navigate(`/responder/compliance`)}
              >
                <p className="text-sm font-medium text-gray-900">{item.office?.name}</p>
                <p className="text-xs text-gray-600">{item.office?.type}</p>
                <p className="text-xs text-purple-600 mt-1">{item.violation_count} violations • Avg: {item.avg_rating}/5</p>
              </div>
            ))}
            {(!priorityItems?.repeated_violations || priorityItems.repeated_violations.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No repeated violations</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{getActivityText(activity)}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                </div>
                <button
                  onClick={() => navigate(`/responder/inspections/${activity.inspection_id}`)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye size={16} />
                </button>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/responder/inspections?status=submitted,responded')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Pending Reviews
          </button>
          <button
            onClick={() => navigate('/responder/escalations')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            View Escalated Issues
          </button>
          <button
            onClick={() => navigate('/responder/reports')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Generate Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponderDashboard;