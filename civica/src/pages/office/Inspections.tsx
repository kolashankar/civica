import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { officeApi } from '../../services/api';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StarRating from '../../components/office/StarRating';

const Inspections: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchInspections();
  }, [statusFilter, priorityFilter, sortBy]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const officeId = user?.office_id;
      if (!officeId) return;

      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const data = await officeApi.getInspections(officeId, params);
      
      // Sort inspections
      let sorted = [...data];
      if (sortBy === 'date_desc') {
        sorted.sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime());
      } else if (sortBy === 'date_asc') {
        sorted.sort((a, b) => new Date(a.assigned_date).getTime() - new Date(b.assigned_date).getTime());
      } else if (sortBy === 'priority') {
        const priorityOrder: any = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      } else if (sortBy === 'rating') {
        sorted.sort((a, b) => {
          const ratingA = a.report ? (a.report.cleanliness_rating + a.report.staff_behavior_rating + a.report.service_quality_rating) / 3 : 0;
          const ratingB = b.report ? (b.report.cleanliness_rating + b.report.staff_behavior_rating + b.report.service_quality_rating) / 3 : 0;
          return ratingB - ratingA;
        });
      }

      setInspections(sorted);
    } catch (error) {
      console.error('Error fetching inspections:', error);
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

  const getPriorityBadge = (priority: string) => {
    const badges: any = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  const getAverageRating = (report: any) => {
    if (!report) return 0;
    return (report.cleanliness_rating + report.staff_behavior_rating + report.service_quality_rating) / 3;
  };

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch = 
      inspection.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.school?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
        <h1 className="text-3xl font-bold text-gray-900">Inspection Reports</h1>
        <p className="text-gray-600 mt-1">View and respond to inspection reports</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by task or school name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="submitted">Submitted</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="date_desc">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
            <option value="priority">Priority</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {/* Inspections List */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {filteredInspections.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No inspections found</p>
          </div>
        ) : (
          filteredInspections.map((inspection) => (
            <div
              key={inspection._id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/office/inspections/${inspection._id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{inspection.task_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(inspection.status)}`}>
                      {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(inspection.priority)}`}>
                      {inspection.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">School:</span> {inspection.school?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Team:</span> {inspection.team?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Assigned:</span> {new Date(inspection.assigned_date).toLocaleDateString()}
                    </p>
                    {inspection.report && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Submitted:</span> {new Date(inspection.report.submitted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {inspection.report && (
                  <div className="ml-6">
                    <p className="text-xs text-gray-500 mb-1">Average Rating</p>
                    <StarRating rating={getAverageRating(inspection.report)} size="sm" showNumber />
                  </div>
                )}
              </div>

              {/* Action needed indicator */}
              {inspection.status === 'submitted' && !inspection.office_response && (
                <div className="mt-3 flex items-center text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
                  <span className="font-medium">⚠️ Response required</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Inspections;