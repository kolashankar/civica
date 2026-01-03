import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { inspectionsApi, officeApi } from '../../services/api';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const ResponseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    response_text: '',
    action_taken: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({
    response_text: '',
    action_taken: '',
  });

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

      // If edit mode, populate form with existing response
      if (isEditMode && data.office_response) {
        setFormData({
          response_text: data.office_response.response_text,
          action_taken: data.office_response.action_taken,
          remarks: data.office_response.remarks || '',
        });
      }
    } catch (error) {
      console.error('Error fetching inspection detail:', error);
      setError('Failed to load inspection details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      response_text: '',
      action_taken: '',
    };

    let isValid = true;

    if (!formData.response_text.trim()) {
      newErrors.response_text = 'Response text is required';
      isValid = false;
    } else if (formData.response_text.length < 50) {
      newErrors.response_text = 'Response text must be at least 50 characters';
      isValid = false;
    }

    if (!formData.action_taken.trim()) {
      newErrors.action_taken = 'Actions taken is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (isEditMode) {
        await officeApi.editResponse(id!, formData);
      } else {
        await officeApi.submitResponse(id!, formData);
      }

      setSuccess(true);
      setShowConfirmDialog(false);

      // Redirect after success
      setTimeout(() => {
        navigate(`/office/inspections/${id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting response:', err);
      setError(err.response?.data?.detail || 'Failed to submit response. Please try again.');
      setShowConfirmDialog(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreSubmit = () => {
    if (validateForm()) {
      setShowConfirmDialog(true);
    }
  };

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

  // Check if govt has already reviewed (cannot edit)
  if (isEditMode && inspection.govt_review) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <h3 className="font-semibold text-red-800">Cannot Edit Response</h3>
              <p className="text-red-700 mt-1">
                This response has already been reviewed by the government and cannot be edited.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/office/inspections/${id}`)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Inspection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/office/inspections/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Response' : 'Submit Response'}
          </h1>
          <p className="text-gray-600 mt-1">{inspection.task_name}</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <h3 className="font-semibold text-green-800">Response Submitted Successfully!</h3>
              <p className="text-green-700 mt-1">Redirecting to inspection details...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Response Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Response Text <span className="text-red-500">*</span>
          </label>
          <textarea
            name="response_text"
            value={formData.response_text}
            onChange={handleChange}
            rows={6}
            placeholder="Acknowledge the student feedback and provide your detailed response..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.response_text ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500">
              Minimum 50 characters required
            </p>
            <p className={`text-sm ${
              formData.response_text.length < 50 ? 'text-red-500' : 'text-green-600'
            }`}>
              {formData.response_text.length} characters
            </p>
          </div>
          {errors.response_text && (
            <p className="text-sm text-red-500 mt-1">{errors.response_text}</p>
          )}
        </div>

        {/* Actions Taken */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Actions Taken <span className="text-red-500">*</span>
          </label>
          <textarea
            name="action_taken"
            value={formData.action_taken}
            onChange={handleChange}
            rows={6}
            placeholder="Detail the specific corrective actions that have been or will be taken..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.action_taken ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <p className="text-sm text-gray-500 mt-2">
            {formData.action_taken.length} characters
          </p>
          {errors.action_taken && (
            <p className="text-sm text-red-500 mt-1">{errors.action_taken}</p>
          )}
        </div>

        {/* Remarks (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Official Remarks <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows={4}
            placeholder="Additional comments, explanation of delays, or any other relevant information..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">
            {formData.remarks.length} characters
          </p>
        </div>

        {/* Preview Section */}
        {formData.response_text.length >= 50 && formData.action_taken && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Preview</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">Response:</p>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">{formData.response_text}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">Actions Taken:</p>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">{formData.action_taken}</p>
              </div>
              {formData.remarks && (
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Remarks:</p>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">{formData.remarks}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <button
            onClick={() => navigate(`/office/inspections/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handlePreSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : isEditMode ? 'Update Response' : 'Submit Response'}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Submission</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to {isEditMode ? 'update' : 'submit'} this response? 
              {!isEditMode && ' Once submitted, you can only edit it before government review.'}
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseForm;
