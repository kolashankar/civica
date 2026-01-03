import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, History, Bell, User, Settings } from 'lucide-react';

const OfficeSidebar: React.FC = () => {
  const navItems = [
    { to: '/office/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/office/inspections', icon: ClipboardList, label: 'Inspections' },
    { to: '/office/history', icon: History, label: 'Response History' },
    { to: '/office/notifications', icon: Bell, label: 'Notifications' },
    { to: '/office/profile', icon: User, label: 'Profile' },
    { to: '/office/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Office Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Accountability Dashboard</p>
      </div>

      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors ${
                isActive ? 'bg-blue-50 text-primary border-r-4 border-primary' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default OfficeSidebar;