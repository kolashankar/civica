import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

interface Violation {
  office: any;
  violation_count: number;
  avg_violation_rating: number;
  violations: any[];
  severity: string;
}

export default function Violations() {
  const navigate = useNavigate();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    min_violations: '2'
  });

  useEffect(() => {
    fetchViolations();
  }, [filters]);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.min_violations) params.append('min_violations', filters.min_violations);

      const response = await axios.get(`${API_URL}/api/responder/violations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setViolations(response.data.violations || []);
    } catch (error: any) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Violation Tracking</h1>
              <p className="mt-1 text-sm text-gray-500">Monitor offices with repeated violations</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/responder/compliance')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Compliance
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Violations</label>
              <input
                type="number"
                value={filters.min_violations}
                onChange={(e) => setFilters({ ...filters, min_violations: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ severity: '', min_violations: '2' })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Violations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading violations...</p>
          </div>
        ) : violations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No repeated violations found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {violations.map((violation) => (
              <div
                key={violation.office._id}
                className={`bg-white rounded-lg shadow border-l-4 ${getSeverityColor(violation.severity)} p-6`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{violation.office.name}</h3>
                    <p className="text-sm text-gray-500">{violation.office.type} - {violation.office.district}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(violation.severity)}`}>
                      {violation.severity} Severity
                    </span>
                    <p className="mt-1 text-sm text-gray-600">
                      {violation.violation_count} violations
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Average violation rating: <span className="font-semibold text-red-600">{violation.avg_violation_rating} / 5</span>
                  </p>
                </div>

                {/* Recent Violations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Violations:</h4>
                  <div className="space-y-2">
                    {violation.violations.slice(0, 5).map((v: any) => (
                      <div key={v.inspection_id} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
                        <div>
                          <p className="font-medium">{v.task_name}</p>
                          <p className="text-gray-500 text-xs">{formatDate(v.date)}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-red-600 font-semibold">Rating: {v.rating}/5</span>
                          <button
                            onClick={() => navigate(`/responder/inspections/${v.inspection_id}`)}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => navigate(`/responder/compliance/${violation.office._id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    View Office Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
