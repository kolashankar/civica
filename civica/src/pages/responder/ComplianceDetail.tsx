import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function ComplianceDetail() {
  const { officeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchComplianceDetail();
  }, [officeId]);

  const fetchComplianceDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/responder/compliance/office/${officeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error: any) {
      console.error('Error fetching compliance detail:', error);
      alert('Error loading compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/responder/compliance/report/${officeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Download as JSON
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_report_${data.office.name}_${new Date().getTime()}.json`;
      a.click();

      alert('Report downloaded successfully!');
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.detail || error.message));
    } finally {
      setGeneratingReport(false);
    }
  };

  const getComplianceLevel = (score: number) => {
    if (score >= 80) return { text: 'High', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 50) return { text: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { text: 'Low', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading compliance details...</p>
        </div>
      </div>
    );
  }

  const level = getComplianceLevel(data.compliance.compliance_score);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{data.office.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {data.office.type} - {data.office.district}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {generatingReport ? 'Generating...' : 'Download Report'}
              </button>
              <button
                onClick={() => navigate('/responder/compliance')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                ← Back to Compliance
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compliance Score Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Compliance Score</h2>
              <p className="text-sm text-gray-500">Overall performance rating</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${level.color}`}>
                {data.compliance.compliance_score}%
              </div>
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${level.bgColor} ${level.color} mt-2`}>
                {level.text} Compliance
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                data.compliance.compliance_score >= 80
                  ? 'bg-green-500'
                  : data.compliance.compliance_score >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${data.compliance.compliance_score}%` }}
            ></div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Inspections</p>
            <p className="text-3xl font-bold text-gray-900">{data.total_inspections}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Response Rate</p>
            <p className="text-3xl font-bold text-blue-600">
              {data.compliance.metrics.response_rate}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">On-Time Rate</p>
            <p className="text-3xl font-bold text-green-600">
              {data.compliance.metrics.on_time_rate}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-yellow-600">
              {data.compliance.metrics.avg_rating}/5
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
            <p className="text-3xl font-bold text-purple-600">
              {data.compliance.metrics.avg_response_time_days} days
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Resolution Rate</p>
            <p className="text-3xl font-bold text-indigo-600">
              {data.compliance.metrics.resolution_rate}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Violations</p>
            <p className="text-3xl font-bold text-red-600">
              {data.compliance.metrics.violation_count}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Violation Rate</p>
            <p className="text-3xl font-bold text-orange-600">
              {data.compliance.metrics.violation_rate}%
            </p>
          </div>
        </div>

        {/* Compliance History Chart */}
        {data.history && data.history.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Compliance History (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="response_rate"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Response Rate %"
                />
                <Line
                  type="monotone"
                  dataKey="resolution_rate"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Resolution Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Rating Trend Chart */}
        {data.history && data.history.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Rating Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg_rating"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Average Rating"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Common Issues */}
        {data.common_issues && data.common_issues.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Common Issues</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.common_issues}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#EF4444" name="Issue Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Office Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Office Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Office Name</p>
              <p className="font-medium">{data.office.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Office Type</p>
              <p className="font-medium capitalize">{data.office.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">District</p>
              <p className="font-medium">{data.office.district}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact</p>
              <p className="font-medium">{data.office.contact_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{data.office.address || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
