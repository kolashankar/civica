import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { officeApi } from '../../services/api';
import { Calendar, Download, Filter, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Inspection {
  _id: string;
  task_name: string;
  school: { name: string };
  team: { name: string };
  status: string;
  office_response: {
    response_text: string;
    action_taken: string;
    responded_at: string;
  };
  govt_review?: {
    status: string;
    review_date: string;
  };
}

const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Inspection[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.office_id) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [history, searchTerm, statusFilter, dateFrom, dateTo]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await officeApi.getHistory(user!.office_id);
      setHistory(data);
      setFilteredHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load response history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.school?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.team?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'reviewed') {
        filtered = filtered.filter((item) => item.govt_review);
      } else if (statusFilter === 'pending-review') {
        filtered = filtered.filter((item) => !item.govt_review);
      }
    }

    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(
        (item) => new Date(item.office_response.responded_at) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (item) => new Date(item.office_response.responded_at) <= new Date(dateTo)
      );
    }

    setFilteredHistory(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const exportToCSV = () => {
    const headers = ['Inspection ID', 'Task Name', 'School', 'Response Date', 'Status', 'Response Text', 'Actions Taken'];
    const rows = filteredHistory.map((item) => [
      item._id,
      item.task_name,
      item.school?.name || 'N/A',
      new Date(item.office_response.responded_at).toLocaleDateString(),
      item.govt_review ? 'Reviewed' : 'Pending Review',
      item.office_response.response_text.replace(/,/g, ';'), // Replace commas to avoid CSV issues
      item.office_response.action_taken.replace(/,/g, ';'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `response_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (inspection: Inspection) => {
    if (inspection.govt_review) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Reviewed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending Review
      </span>
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Response History</h1>
          <p className="text-gray-600 mt-1">View all your submitted responses and their status</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by task name, school, or team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="reviewed">Reviewed</option>
                <option value="pending-review">Pending Review</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="md:col-span-3">
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredHistory.length} of {history.length} responses
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || dateFrom || dateTo
              ? 'Try adjusting your filters'
              : 'You have not submitted any responses yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((inspection) => (
                <tr key={inspection._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{inspection.task_name}</div>
                    <div className="text-sm text-gray-500">Team: {inspection.team?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{inspection.school?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(inspection.office_response.responded_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(inspection)}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/office/inspections/${inspection._id}`}
                      className="flex items-center text-primary hover:text-primary-dark font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;
