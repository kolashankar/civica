import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';

const HeadmasterSidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/headmaster/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/headmaster/students', icon: Users, label: 'Students' },
    { path: '/headmaster/teams', icon: UsersRound, label: 'Teams' },
    { path: '/headmaster/inspections', icon: ClipboardList, label: 'Inspections' },
    { path: '/headmaster/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/headmaster/notifications', icon: Bell, label: 'Notifications' },
    { path: '/headmaster/profile', icon: GraduationCap, label: 'Profile' },
    { path: '/headmaster/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Civica</h1>
            <p className="text-xs text-gray-600">Headmaster Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b bg-gray-50">
        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-600">{user?.email}</p>
        <p className="text-xs text-green-600 mt-1 font-medium">Headmaster</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default HeadmasterSidebar;