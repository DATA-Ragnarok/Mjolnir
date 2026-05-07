import React from 'react';

const EpicsPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Epics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Example Epic</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <span className="text-xs text-gray-500 font-medium">45% Complete</span>
        </div>
      </div>
    </div>
  );
};

export default EpicsPage;
