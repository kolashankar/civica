import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/responder/analytics/system?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent\"></div>
          <p className=\"mt-2 text-gray-600\">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* Header */}
      <div className=\"bg-white shadow-sm border-b border-gray-200\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6\">
          <div className=\"flex justify-between items-center\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900\">System Analytics</h1>
              <p className=\"mt-1 text-sm text-gray-500\">Comprehensive system-wide analytics and insights</p>
            </div>
            <div className=\"flex space-x-3\">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className=\"px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
              >
                <option value=\"7\">Last 7 days</option>
                <option value=\"30\">Last 30 days</option>
                <option value=\"90\">Last 90 days</option>
                <option value=\"365\">Last year</option>
              </select>
              <button
                onClick={() => navigate('/responder/reports')}
                className=\"px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700\"
              >
                Generate Report
              </button>
              <button
                onClick={() => navigate('/responder/dashboard')}
                className=\"px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700\"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        {/* Charts Grid */}
        <div className=\"space-y-8\">
          {/* Inspections Over Time */}
          {analytics.inspections_over_time && analytics.inspections_over_time.length > 0 && (
            <div className=\"bg-white rounded-lg shadow p-6\">
              <h3 className=\"text-lg font-semibold mb-4\">Inspections Over Time</h3>
              <ResponsiveContainer width=\"100%\" height={300}>
                <LineChart data={analytics.inspections_over_time}>
                  <CartesianGrid strokeDasharray=\"3 3\" />
                  <XAxis dataKey=\"date\" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type=\"monotone\" dataKey=\"count\" stroke=\"#3B82F6\" strokeWidth={2} name=\"Inspections\" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status Distribution & Office Compliance */}
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Status Distribution */}
            {analytics.status_distribution && analytics.status_distribution.length > 0 && (
              <div className=\"bg-white rounded-lg shadow p-6\">
                <h3 className=\"text-lg font-semibold mb-4\">Status Distribution</h3>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.status_distribution}
                      dataKey=\"count\"
                      nameKey=\"status\"
                      cx=\"50%\"
                      cy=\"50%\"
                      outerRadius={100}
                      label
                    >
                      {analytics.status_distribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Office Compliance by Type */}
            {analytics.office_compliance && analytics.office_compliance.length > 0 && (
              <div className=\"bg-white rounded-lg shadow p-6\">
                <h3 className=\"text-lg font-semibold mb-4\">Office Compliance by Type</h3>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <BarChart data={analytics.office_compliance}>
                    <CartesianGrid strokeDasharray=\"3 3\" />
                    <XAxis dataKey=\"office_type\" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey=\"compliance_rate\" fill=\"#10B981\" name=\"Compliance Rate (%)\" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Rating Trends */}
          {analytics.rating_trends && analytics.rating_trends.length > 0 && (
            <div className=\"bg-white rounded-lg shadow p-6\">
              <h3 className=\"text-lg font-semibold mb-4\">Rating Trends</h3>
              <ResponsiveContainer width=\"100%\" height={300}>
                <LineChart data={analytics.rating_trends}>
                  <CartesianGrid strokeDasharray=\"3 3\" />
                  <XAxis dataKey=\"date\" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type=\"monotone\"
                    dataKey=\"average_rating\"
                    stroke=\"#F59E0B\"
                    strokeWidth={2}
                    name=\"Average Rating\"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Response Times & Issue Categories */}
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Response Time Distribution */}
            {analytics.response_times && analytics.response_times.length > 0 && (
              <div className=\"bg-white rounded-lg shadow p-6\">
                <h3 className=\"text-lg font-semibold mb-4\">Response Time Distribution</h3>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <BarChart data={analytics.response_times}>
                    <CartesianGrid strokeDasharray=\"3 3\" />
                    <XAxis dataKey=\"bucket\" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey=\"count\" fill=\"#8B5CF6\" name=\"Number of Inspections\" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Issue Categories */}
            {analytics.issue_categories && analytics.issue_categories.length > 0 && (
              <div className=\"bg-white rounded-lg shadow p-6\">
                <h3 className=\"text-lg font-semibold mb-4\">Issue Categories</h3>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.issue_categories}
                      dataKey=\"count\"
                      nameKey=\"category\"
                      cx=\"50%\"
                      cy=\"50%\"
                      outerRadius={100}
                      label
                    >
                      {analytics.issue_categories.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
