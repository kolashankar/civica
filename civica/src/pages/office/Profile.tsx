import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { officesApi } from '../../services/api';
import { User, Mail, Phone, Building2, MapPin, Calendar, Shield } from 'lucide-react';

interface OfficeDetails {
  _id: string;
  name: string;
  office_type: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [office, setOffice] = useState<OfficeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.office_id) {
      fetchOfficeDetails();
    }
  }, [user]);

  const fetchOfficeDetails = async () => {
    try {
      setLoading(true);
      const data = await officesApi.getById(user!.office_id);
      setOffice(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load office details');
    } finally {
      setLoading(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">View your account information and office details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary text-white rounded-full text-3xl font-bold mb-4">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Shield className="w-3 h-3 mr-1" />
                Office User
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span>{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Office Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Office Information</h3>
            <p className="text-sm text-gray-600 mt-1">Details about your government office</p>
          </div>

          <div className="p-6">
            {office ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office Name</label>
                  <div className="flex items-center text-gray-900">
                    <Building2 className="w-5 h-5 mr-2 text-gray-400" />
                    <span>{office.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office Type</label>
                  <div className="text-gray-900">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {office.office_type}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center text-gray-900">
                    <Mail className="w-5 h-5 mr-2 text-gray-400" />
                    <span>{office.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="flex items-center text-gray-900">
                    <Phone className="w-5 h-5 mr-2 text-gray-400" />
                    <span>{office.phone}</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="flex items-start text-gray-900">
                    <MapPin className="w-5 h-5 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <p>{office.address}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {office.city}, {office.district}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No office details available</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">About Office Portal</h3>
        <p className="text-blue-800 text-sm">
          This portal allows you to view student inspection reports, respond to findings, and track your office's performance.
          Your responses contribute to transparency and accountability in government services.
        </p>
      </div>
    </div>
  );
};

export default Profile;
