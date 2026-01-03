import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { inspectionsApi } from '../../services/api';
import { Inspection } from '../../types';
import { ArrowLeft, MapPin, Phone, User, Calendar, AlertTriangle, CheckCircle, Star, Image as ImageIcon, MessageSquare } from 'lucide-react';

const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadInspectionDetail();
    }
  }, [id]);

  const loadInspectionDetail = async () => {
    try {
      setLoading(true);
      const data = await inspectionsApi.getById(id!);
      setInspection(data);
    } catch (error) {
      console.error('Error loading inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!approvalAction) return;
    
    try {
      setSubmitting(true);
      await inspectionsApi.approveReport(id!, {
        approved: approvalAction === 'approve',
        comments: comments
      });
      
      alert(`Report ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setApprovalAction(null);
      setComments('');
      loadInspectionDetail();
    } catch (error: any) {
      console.error('Error submitting approval:', error);
      alert(error.response?.data?.detail || 'Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Inspection not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/headmaster/inspections')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Inspections
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{inspection.task_name}</h1>
            <p className="text-gray-600">{inspection.task_description}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(inspection.status)}`}>
            {inspection.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Assigned Date</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(inspection.assigned_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Due Date</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(inspection.due_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Priority</p>
            <p className={`text-sm font-medium ${
              inspection.priority === 'high' ? 'text-red-600' :
              inspection.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {inspection.priority.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Office Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Office Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Office Name</p>
                <p className="font-medium text-gray-900">{inspection.office?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900">{inspection.office?.address}</p>
              </div>
            </div>
          </div>
          <div>
            {inspection.office?.contact_person && (
              <div className="flex items-start gap-3 mb-4">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium text-gray-900">{inspection.office.contact_person}</p>
                </div>
              </div>
            )}
            {inspection.office?.contact_phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{inspection.office.contact_phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Team</h2>
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{inspection.team?.name}</p>
            <p className="text-sm text-gray-600">
              {inspection.team?.student_ids?.length || 0} members
            </p>
          </div>
        </div>
      </div>

      {/* Student Report */}
      {inspection.report && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Student Report</h2>
          
          {/* Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Cleanliness</p>
              {renderStars(inspection.report.cleanliness_rating)}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Staff Behavior</p>
              {renderStars(inspection.report.staff_behavior_rating)}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Service Quality</p>
              {renderStars(inspection.report.service_quality_rating)}
            </div>
          </div>

          {/* Text Responses */}
          <div className="space-y-4 mb-6">
            {inspection.report.issues && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Issues Identified</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{inspection.report.issues}</p>
              </div>
            )}
            {inspection.report.complaints && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Complaints</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{inspection.report.complaints}</p>
              </div>
            )}
            {inspection.report.suggestions && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Suggestions</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{inspection.report.suggestions}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          {inspection.report.photos && inspection.report.photos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Photos ({inspection.report.photos.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inspection.report.photos.map((photo: string, index: number) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Actions */}
          {inspection.status === 'submitted' && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Actions</h3>
              
              {!approvalAction ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => setApprovalAction('approve')}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Approve Report
                  </button>
                  <button
                    onClick={() => setApprovalAction('reject')}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Request Corrections
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments {approvalAction === 'reject' && '(Required)'}
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={approvalAction === 'approve' 
                        ? 'Add any additional comments...' 
                        : 'Please specify what needs to be corrected...'}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleApproval}
                      disabled={submitting || (approvalAction === 'reject' && !comments.trim())}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : `Confirm ${approvalAction === 'approve' ? 'Approval' : 'Rejection'}`}
                    </button>
                    <button
                      onClick={() => {
                        setApprovalAction(null);
                        setComments('');
                      }}
                      disabled={submitting}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Office Response */}
      {inspection.office_response && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Office Response</h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-900">{inspection.office_response.response}</p>
            <p className="text-sm text-gray-600 mt-2">
              Responded on {new Date(inspection.office_response.responded_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedPhoto}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDetail;