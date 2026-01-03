import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

interface ComplianceData {
  office: any;
  compliance_score: number;
  total_inspections: number;
  metrics: any;
}

export default function Compliance() {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    office_type: '',
    district: '',
    min_score: '',
    max_score: ''
  });

  useEffect(() => {
    fetchComplianceData();
  }, [filters]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.office_type) params.append('office_type', filters.office_type);
      if (filters.district) params.append('district', filters.district);
      if (filters.min_score) params.append('min_score', filters.min_score);
      if (filters.max_score) params.append('max_score', filters.max_score);

      const response = await axios.get(`${API_URL}/api/responder/compliance/offices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOffices(response.data.offices || []);
    } catch (error: any) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceLevel = (score: number) => {
    if (score >= 80) return { text: 'High', color: 'bg-green-100 text-green-800' };
    if (score >= 50) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low', color: 'bg-red-100 text-red-800' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Office Compliance</h1>
              <p className="mt-1 text-sm text-gray-500">Monitor office performance and compliance scores</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/responder/violations')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                View Violations
              </button>
              <button
                onClick={() => navigate('/responder/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office Type</label>
              <select
                value={filters.office_type}
                onChange={(e) => setFilters({ ...filters, office_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="municipal">Municipal</option>
                <option value="transport">Transport</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
              <input
                type="number"
                value={filters.min_score}
                onChange={(e) => setFilters({ ...filters, min_score: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0-100"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <input
                type="number"
                value={filters.max_score}
                onChange={(e) => setFilters({ ...filters, max_score: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0-100"
                min="0"
                max="100"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ office_type: '', district: '', min_score: '', max_score: '' })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Office Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading compliance data...</p>
          </div>
        ) : offices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No offices found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offices.map((data) => {
              const level = getComplianceLevel(data.compliance_score);
              return (
                <div
                  key={data.office._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/responder/compliance/${data.office._id}`)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{data.office.name}</h3>
                        <p className="text-sm text-gray-500">{data.office.type}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${level.color}`}>
                        {level.text}
                      </span>
                    </div>

                    {/* Compliance Score */}
                    <div className="mb-4">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm text-gray-500">Compliance Score</span>
                        <span className={`text-2xl font-bold ${getScoreColor(data.compliance_score)}`}>
                          {data.compliance_score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.compliance_score >= 80
                              ? 'bg-green-500'
                              : data.compliance_score >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${data.compliance_score}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Inspections:</span>
                        <span className="font-medium">{data.total_inspections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Response Rate:</span>
                        <span className="font-medium">{data.metrics.response_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">On-Time Rate:</span>
                        <span className="font-medium">{data.metrics.on_time_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Rating:</span>
                        <span className="font-medium">{data.metrics.avg_rating} / 5</span>
                      </div>
                    </div>

                    <button
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/responder/compliance/${data.office._id}`);
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
