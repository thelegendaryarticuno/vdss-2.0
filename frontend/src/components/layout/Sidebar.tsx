import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'SALES_REP', 'DISTRIBUTOR'] },
    { path: '/customers', label: 'Customers', roles: ['ADMIN', 'MANAGER', 'SALES_REP', 'DISTRIBUTOR'] },
    { path: '/quotes', label: 'Quotes', roles: ['ADMIN', 'MANAGER', 'SALES_REP'] },
    { path: '/orders', label: 'Orders', roles: ['ADMIN', 'MANAGER', 'SALES_REP', 'DISTRIBUTOR'] },
    { path: '/reports', label: 'Reports', roles: ['ADMIN', 'MANAGER'] },
    { path: '/ai-insights', label: 'AI Insights', roles: ['ADMIN', 'MANAGER', 'SALES_REP'] },
  ];

  const visibleItems = navItems.filter((item) => user?.role && item.roles.includes(user.role));

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold">VDSS 2.0</h1>
        <p className="text-sm text-gray-400">Digital Sales System</p>
      </div>
      <nav className="mt-4">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 hover:bg-gray-700 ${
              isActive(item.path) ? 'bg-gray-700 border-l-4 border-blue-500' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
