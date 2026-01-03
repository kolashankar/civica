import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function EscalationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [escalation, setEscalation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchEscalationDetail();
  }, [id]);

  const fetchEscalationDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/responder/escalations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEscalation(response.data);
    } catch (error: any) {
      console.error('Error fetching escalation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = async () => {
    if (followUpNotes.trim().length < 10) {
      alert('Follow-up notes must be at least 10 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/responder/escalations/${id}/follow-up`,
        { notes: followUpNotes, action_taken: actionTaken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Follow-up added successfully');
      setShowFollowUpModal(false);
      setFollowUpNotes('');
      setActionTaken('');
      fetchEscalationDetail();
    } catch (error: any) {
      alert('Error adding follow-up: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleResolve = async () => {
    if (resolutionNotes.trim().length < 30) {
      alert('Resolution notes must be at least 30 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/responder/escalations/${id}/resolve`,
        { resolution_notes: resolutionNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Escalation resolved successfully');
      setShowResolveModal(false);
      fetchEscalationDetail();
    } catch (error: any) {
      alert('Error resolving escalation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading escalation details...</p>
        </div>
      </div>
    );
  }

  if (!escalation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Escalation not found</p>
          <button
            onClick={() => navigate('/responder/escalations')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Escalations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Escalation Detail</h1>
              <p className="mt-1 text-sm text-gray-500">Escalation ID: {escalation._id}</p>
            </div>
            <button
              onClick={() => navigate('/responder/escalations')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ← Back to Escalations
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Escalation Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Escalation Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Reason:</span>
                  <p className="mt-1 text-gray-900">{escalation.escalation_reason}</p>
                </div>
                {escalation.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                    <p className="mt-1 text-gray-900">{escalation.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Action Items:</span>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {escalation.action_items?.map((item: string, index: number) => (
                      <li key={index} className="text-gray-900">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Inspection Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Related Inspection</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Task:</span> {escalation.inspection?.task_name}</p>
                <p><span className="font-medium">School:</span> {escalation.school?.name}</p>
                <p><span className="font-medium">Office:</span> {escalation.office?.name}</p>
                <button
                  onClick={() => navigate(`/responder/inspections/${escalation.inspection_id}`)}
                  className="mt-2 text-blue-600 hover:text-blue-900"
                >
                  View Full Inspection →
                </button>
              </div>
            </div>

            {/* Follow-ups Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Follow-up Timeline</h2>
                {escalation.status !== 'resolved' && (
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Follow-up
                  </button>
                )}
              </div>

              {escalation.follow_ups && escalation.follow_ups.length > 0 ? (
                <div className="space-y-4">
                  {escalation.follow_ups.map((followUp: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{followUp.user?.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">{formatDate(followUp.added_at)}</p>
                        </div>
                        {followUp.action_taken && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {followUp.action_taken}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-gray-700">{followUp.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No follow-ups yet</p>
              )}
            </div>

            {/* Resolution */}
            {escalation.status === 'resolved' && escalation.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-green-900 mb-4">Resolution</h2>
                <p className="text-gray-700">{escalation.resolution_notes}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Resolved on {formatDate(escalation.resolved_at)} by {escalation.resolved_by_user?.name}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Current Status:</span>
                  <p className="font-medium capitalize">{escalation.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Severity:</span>
                  <p className="font-medium capitalize">{escalation.severity}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Escalated By:</span>
                  <p className="font-medium">{escalation.escalated_by_user?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Escalated At:</span>
                  <p className="font-medium">{formatDate(escalation.escalated_at)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {escalation.status !== 'resolved' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Follow-up</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes *</label>
                <textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter follow-up notes (min 10 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken (Optional)</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Called office, Sent reminder"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleAddFollowUp}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Follow-up
              </button>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Resolve Escalation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Notes * (min 30 characters)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={5}
                  placeholder="Explain how the issue was resolved..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {resolutionNotes.length} / 30 characters
                </p>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleResolve}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Resolve
              </button>
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
