import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const tabs = ['Epics', 'Features', 'Sprints'];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-indigo-600">🔨 Mjolnir</h1>
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
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
