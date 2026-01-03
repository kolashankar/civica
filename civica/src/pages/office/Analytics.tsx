import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { officeApi } from '../../services/api';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Clock, Award } from 'lucide-react';

interface AnalyticsData {
  stats: {
    total_inspections: number;
    total_responses: number;
    response_rate: number;
    avg_response_time: number;
  };
  rating_trends: Array<{
    date: string;
    average_rating: number;
    count: number;
  }>;
  issue_categories: Array<{
    category: string;
    count: number;
  }>;
  response_times: Array<{
    bucket: string;
    count: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (user?.office_id) {
      fetchAnalytics();
    }
  }, [user, days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await officeApi.getAnalytics(user!.office_id, days);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Track your office's performance and improvement areas</p>
        </div>
        <div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inspections</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.stats.total_inspections}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.stats.total_responses}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.stats.response_rate}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <PieChartIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.stats.avg_response_time} days</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Rating Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Rating Trends Over Time</h2>
        {analytics.rating_trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.rating_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => [value.toFixed(2), 'Average Rating']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="average_rating"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Average Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No rating data available for the selected period</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Categories Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Issue Categories</h2>
          {analytics.issue_categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.issue_categories}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category}: ${entry.count}`}
                  labelLine={true}
                >
                  {analytics.issue_categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No issue data available</p>
            </div>
          )}
        </div>

        {/* Response Time Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Time Distribution</h2>
          {analytics.response_times.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.response_times}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10B981" name="Number of Responses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No response time data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Insights & Recommendations</h3>
        <ul className="space-y-2 text-blue-800">
          {analytics.stats.response_rate < 50 && (
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span>Your response rate is below 50%. Consider prioritizing pending inspections to improve accountability.</span>
            </li>
          )}
          {analytics.stats.avg_response_time > 7 && (
            <li className="flex items-start">
              <span className="mr-2">⏰</span>
              <span>Average response time exceeds 7 days. Try to respond to reports within a week for better service delivery.</span>
            </li>
          )}
          {analytics.issue_categories.length > 0 && (
            <li className="flex items-start">
              <span className="mr-2">📊</span>
              <span>
                Most common issue: <strong>{analytics.issue_categories[0].category}</strong> ({analytics.issue_categories[0].count} reports). 
                Focus on addressing this area for maximum impact.
              </span>
            </li>
          )}
          {analytics.stats.response_rate >= 80 && (
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Excellent response rate! Keep up the good work in maintaining accountability standards.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Analytics;
