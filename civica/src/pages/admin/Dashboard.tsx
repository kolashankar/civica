import React, { useEffect, useState } from 'react';
import { School, Building2, Users, Activity } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { schoolsApi, officesApi, usersApi } from '../../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    schools: 0,
    offices: 0,
    users: 0,
    activeInspections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [schoolsRes, officesRes, usersRes] = await Promise.all([
        schoolsApi.getAll({ page: 1, limit: 1 }),
        officesApi.getAll({ page: 1, limit: 1 }),
        usersApi.getAll({ page: 1, limit: 1 }),
      ]);

      setStats({
        schools: schoolsRes.pagination.total,
        offices: officesRes.pagination.total,
        users: usersRes.pagination.total,
        activeInspections: 0, // TODO: Add inspections API
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Admin Portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Schools"
          value={stats.schools}
          icon={<School className="text-white" size={24} />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Offices"
          value={stats.offices}
          icon={<Building2 className="text-white" size={24} />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={<Users className="text-white" size={24} />}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Inspections"
          value={stats.activeInspections}
          icon={<Activity className="text-white" size={24} />}
          color="bg-orange-500"
        />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/schools"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors"
          >
            <School className="text-primary mb-2" size={24} />
            <h3 className="font-semibold">Manage Schools</h3>
            <p className="text-sm text-gray-600 mt-1">Add, edit, or remove schools</p>
          </a>
          <a
            href="/admin/offices"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors"
          >
            <Building2 className="text-primary mb-2" size={24} />
            <h3 className="font-semibold">Manage Offices</h3>
            <p className="text-sm text-gray-600 mt-1">Add, edit, or remove offices</p>
          </a>
          <a
            href="/admin/users"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors"
          >
            <Users className="text-primary mb-2" size={24} />
            <h3 className="font-semibold">Manage Users</h3>
            <p className="text-sm text-gray-600 mt-1">Add, edit, or remove users</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
