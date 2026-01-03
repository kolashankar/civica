import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, AlertTriangle, Building2, BarChart3, FileText, Bell, User, Settings } from 'lucide-react';

const ResponderSidebar: React.FC = () => {
  const navItems = [
    { to: '/responder/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/responder/inspections', icon: ClipboardList, label: 'All Inspections' },
    { to: '/responder/escalations', icon: AlertTriangle, label: 'Escalations' },
    { to: '/responder/compliance', icon: Building2, label: 'Office Compliance' },
    { to: '/responder/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/responder/reports', icon: FileText, label: 'Reports' },
    { to: '/responder/notifications', icon: Bell, label: 'Notifications' },
    { to: '/responder/profile', icon: User, label: 'Profile' },
    { to: '/responder/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-900">Govt Oversight</h1>
        <p className="text-sm text-gray-500 mt-1">Responder Portal</p>
      </div>

      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-900 border-r-4 border-blue-900' : ''
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

export default ResponderSidebar;