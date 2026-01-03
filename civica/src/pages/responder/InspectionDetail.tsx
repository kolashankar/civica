import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { responderApi } from '../../services/api';
import { ArrowLeft, CheckCircle, AlertTriangle, MessageSquare, Calendar, User, Building, School, FileText, X } from 'lucide-react';

const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Review form states
  const [reviewData, setReviewData] = useState({
    review_status: 'approved',
    review_comments: '',
    escalation_reason: '',
    action_items: [''],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInspection();
    }
  }, [id]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const data = await responderApi.getInspectionFull(id!);
      setInspection(data);
    } catch (error) {
      console.error('Error fetching inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewData.review_comments.length < 30) {
      alert('Review comments must be at least 30 characters');
      return;
    }

    if (reviewData.review_status === 'escalated' && !reviewData.escalation_reason) {
      alert('Escalation reason is required');
      return;
    }

    try {
      setSubmitting(true);
      const submitData: any = {
        review_status: reviewData.review_status,
        review_comments: reviewData.review_comments,
      };

      if (reviewData.review_status === 'escalated') {
        submitData.escalation_reason = reviewData.escalation_reason;
        submitData.action_items = reviewData.action_items.filter(item => item.trim() !== '');
      }

      await responderApi.submitReview(id!, submitData);
      alert('Review submitted successfully');
      setShowReviewModal(false);
      fetchInspection();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.detail || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const addActionItem = () => {
    setReviewData({
      ...reviewData,
      action_items: [...reviewData.action_items, ''],
    });
  };

  const updateActionItem = (index: number, value: string) => {
    const newItems = [...reviewData.action_items];
    newItems[index] = value;
    setReviewData({ ...reviewData, action_items: newItems });
  };

  const removeActionItem = (index: number) => {
    const newItems = reviewData.action_items.filter((_, i) => i !== index);
    setReviewData({ ...reviewData, action_items: newItems });
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      assigned: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      responded: 'bg-purple-100 text-purple-800',
      closed: 'bg-green-100 text-green-800',
      escalated: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-2xl'}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
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
            onClick={() => navigate('/responder/inspections')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{inspection.task_name}</h1>
            <p className="text-gray-600 mt-1">Inspection ID: {inspection._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(inspection.status)}`}>
            {inspection.status}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {inspection.status === 'responded' && !inspection.govt_review && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">This inspection is ready for review</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setReviewData({ ...reviewData, review_status: 'approved' });
                setShowReviewModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Approve & Close
            </button>
            <button
              onClick={() => {
                setReviewData({ ...reviewData, review_status: 'escalated' });
                setShowReviewModal(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <AlertTriangle size={18} />
              Escalate Issue
            </button>
            <button
              onClick={() => {
                setReviewData({ ...reviewData, review_status: 'more_info' });
                setShowReviewModal(true);
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
            >
              <MessageSquare size={18} />
              Request More Info
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Task Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1">{inspection.task_description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Priority</label>
                  <p className="text-gray-900 mt-1 capitalize">{inspection.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <p className="text-gray-900 mt-1">{new Date(inspection.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Report */}
          {inspection.report && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Student Report</h2>
              <div className="space-y-4">
                {/* Ratings */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Cleanliness</p>
                    <div className="flex justify-center">{renderStars(inspection.report.cleanliness_rating)}</div>
                    <p className="text-2xl font-bold mt-2">{inspection.report.cleanliness_rating}/5</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Staff Behavior</p>
                    <div className="flex justify-center">{renderStars(inspection.report.staff_behavior_rating)}</div>
                    <p className="text-2xl font-bold mt-2">{inspection.report.staff_behavior_rating}/5</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Service Quality</p>
                    <div className="flex justify-center">{renderStars(inspection.report.service_quality_rating)}</div>
                    <p className="text-2xl font-bold mt-2">{inspection.report.service_quality_rating}/5</p>
                  </div>
                </div>

                {/* Issues & Complaints */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Issues Identified</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{inspection.report.issues}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Complaints</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{inspection.report.complaints}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Suggestions</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{inspection.report.suggestions}</p>
                </div>

                {/* Photos */}
                {inspection.report.photos && inspection.report.photos.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">Photos</label>
                    <div className="grid grid-cols-3 gap-4">
                      {inspection.report.photos.map((photo: string, index: number) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Submitted on {new Date(inspection.report.submitted_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Office Response */}
          {inspection.office_response && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Office Response</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Response</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{inspection.office_response.response_text}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Actions Taken</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{inspection.office_response.action_taken}</p>
                </div>
                {inspection.office_response.remarks && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Remarks</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{inspection.office_response.remarks}</p>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Responded on {new Date(inspection.office_response.responded_at).toLocaleString()}
                  {inspection.office_response.responder && ` by ${inspection.office_response.responder.name}`}
                </div>
              </div>
            </div>
          )}

          {/* Government Review */}
          {inspection.govt_review && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Government Review</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-900 mt-1 capitalize font-semibold">{inspection.govt_review.review_status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Comments</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{inspection.govt_review.review_comments}</p>
                </div>
                {inspection.govt_review.escalation_reason && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Escalation Reason</label>
                    <p className="text-gray-900 mt-1">{inspection.govt_review.escalation_reason}</p>
                  </div>
                )}
                {inspection.govt_review.action_items && inspection.govt_review.action_items.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Action Items</label>
                    <ul className="list-disc list-inside text-gray-900 mt-1">
                      {inspection.govt_review.action_items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Reviewed on {new Date(inspection.govt_review.reviewed_at).toLocaleString()}
                  {inspection.govt_review.reviewer && ` by ${inspection.govt_review.reviewer.name}`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Calendar size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Assigned</p>
                  <p className="text-xs text-gray-500">{new Date(inspection.assigned_date).toLocaleString()}</p>
                </div>
              </div>
              
              {inspection.report && (
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <FileText size={16} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submitted</p>
                    <p className="text-xs text-gray-500">{new Date(inspection.report.submitted_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {inspection.office_response && (
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <MessageSquare size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Responded</p>
                    <p className="text-xs text-gray-500">{new Date(inspection.office_response.responded_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {inspection.govt_review && (
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reviewed</p>
                    <p className="text-xs text-gray-500">{new Date(inspection.govt_review.reviewed_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* School Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <School size={20} />
              School Information
            </h2>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{inspection.school?.name}</p>
              <p className="text-xs text-gray-600">{inspection.school?.address}</p>
              <p className="text-xs text-gray-600">{inspection.school?.district}, {inspection.school?.state}</p>
              {inspection.school?.headmaster && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Headmaster</p>
                  <p className="text-sm text-gray-900">{inspection.school.headmaster.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Office Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building size={20} />
              Office Information
            </h2>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{inspection.office?.name}</p>
              <p className="text-xs text-gray-600 capitalize">{inspection.office?.type}</p>
              <p className="text-xs text-gray-600">{inspection.office?.address}</p>
              <p className="text-xs text-gray-600">{inspection.office?.district}, {inspection.office?.state}</p>
            </div>
          </div>

          {/* Team Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Team Information
            </h2>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{inspection.team?.name}</p>
              {inspection.team?.members && inspection.team.members.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Team Members</p>
                  {inspection.team.members.map((member: any) => (
                    <p key={member._id} className="text-xs text-gray-900">{member.name}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Submit Review</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Review Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Status *</label>
                <select
                  value={reviewData.review_status}
                  onChange={(e) => setReviewData({ ...reviewData, review_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="approved">Approve & Close</option>
                  <option value="escalated">Escalate Issue</option>
                  <option value="more_info">Request More Information</option>
                </select>
              </div>

              {/* Review Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Comments * (minimum 30 characters)
                </label>
                <textarea
                  value={reviewData.review_comments}
                  onChange={(e) => setReviewData({ ...reviewData, review_comments: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Document your decision rationale..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewData.review_comments.length} / 30 characters minimum
                </p>
              </div>

              {/* Escalation Reason */}
              {reviewData.review_status === 'escalated' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Reason *</label>
                    <input
                      type="text"
                      value={reviewData.escalation_reason}
                      onChange={(e) => setReviewData({ ...reviewData, escalation_reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Inadequate response, Issue not resolved, etc."
                    />
                  </div>

                  {/* Action Items */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action Items</label>
                    {reviewData.action_items.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateActionItem(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Action item ${index + 1}`}
                        />
                        {reviewData.action_items.length > 1 && (
                          <button
                            onClick={() => removeActionItem(index)}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addActionItem}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Action Item
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-2 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
        </div>
      )}
    </div>
  );
};

export default InspectionDetail;
