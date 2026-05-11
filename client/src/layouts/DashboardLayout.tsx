import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const tabs = [
    { name: 'Epics', path: '/epics' },
    { name: 'Features', path: '/features' },
    { name: 'Sprints', path: '/sprints' }
  ];

  const isActive = (path: string) => {
    if (path === '/epics' && location.pathname.startsWith('/epics')) return true;
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link to="/epics" className="text-xl font-bold tracking-tight text-indigo-600">🔨 Mjolnir</Link>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            <button 
              onClick={logout}
              className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.path}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive(tab.path)
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </nav>

      <main className="p-6">
        <div className={location.pathname.startsWith('/sprints') ? "" : "max-w-7xl mx-auto"}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
