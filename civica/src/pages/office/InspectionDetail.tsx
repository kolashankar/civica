import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionsApi } from '../../services/api';
import { ArrowLeft, Calendar, MapPin, Users, FileText, MessageSquare, CheckCircle } from 'lucide-react';
import StarRating from '../../components/office/StarRating';
import PhotoGallery from '../../components/office/PhotoGallery';

const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInspectionDetail();
    }
  }, [id]);

  const fetchInspectionDetail = async () => {
    try {
      setLoading(true);
      const data = await inspectionsApi.getById(id!);
      setInspection(data);
    } catch (error) {
      console.error('Error fetching inspection detail:', error);
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

  const canRespond = inspection?.status === 'submitted' && !inspection?.office_response;
  const canEdit = inspection?.office_response && !inspection?.govt_review;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inspection not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/office/inspections')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{inspection.task_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(inspection.status)}`}>
                {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(inspection.priority)}`}>
                {inspection.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {canEdit && (
            <button
              onClick={() => navigate(`/office/inspections/${id}/respond?edit=true`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Response
            </button>
          )}
          {canRespond && (
            <button
              onClick={() => navigate(`/office/inspections/${id}/respond`)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Respond to Report
            </button>
          )}
        </div>
      </div>

      {/* Inspection Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Inspection Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <FileText className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{inspection.task_description}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">Assigned Date</p>
              <p className="text-gray-900">{new Date(inspection.assigned_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-gray-900">{new Date(inspection.due_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">School</p>
              <p className="text-gray-900">{inspection.school?.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">Team</p>
              <p className="text-gray-900">{inspection.team?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Report */}
      {inspection.report && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Student Report</h2>
          
          {/* Ratings */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Cleanliness Rating</p>
              <StarRating rating={inspection.report.cleanliness_rating} showNumber />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Staff Behavior Rating</p>
              <StarRating rating={inspection.report.staff_behavior_rating} showNumber />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Service Quality Rating</p>
              <StarRating rating={inspection.report.service_quality_rating} showNumber />
            </div>
          </div>

          {/* Text Feedback */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Issues Identified</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{inspection.report.issues}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Complaints</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{inspection.report.complaints}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Suggestions</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{inspection.report.suggestions}</p>
            </div>
          </div>

          {/* Photos */}
          {inspection.report.photos && inspection.report.photos.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Inspection Photos</h3>
              <PhotoGallery photos={inspection.report.photos} altText="Inspection photo" />
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Submitted on {new Date(inspection.report.submitted_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* Office Response */}
      {inspection.office_response && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Office Response</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Response</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg">{inspection.office_response.response_text}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Actions Taken</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg">{inspection.office_response.action_taken}</p>
            </div>
            {inspection.office_response.remarks && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Remarks</h3>
                <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg">{inspection.office_response.remarks}</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Responded on {new Date(inspection.office_response.responded_at).toLocaleString()}
            {inspection.office_response.edited_at && (
              <span className="ml-2">(Edited on {new Date(inspection.office_response.edited_at).toLocaleString()})</span>
            )}
          </div>
        </div>
      )}

      {/* Government Review */}
      {inspection.govt_review && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Government Review</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Review Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                inspection.govt_review.review_status === 'approved' ? 'bg-green-100 text-green-800' :
                inspection.govt_review.review_status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {inspection.govt_review.review_status.charAt(0).toUpperCase() + inspection.govt_review.review_status.slice(1)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Review Comments</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg">{inspection.govt_review.review_comments}</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Reviewed on {new Date(inspection.govt_review.reviewed_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDetail;