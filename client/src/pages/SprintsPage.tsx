import React from 'react';

const SprintsPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sprints</h2>
      <div className="flex space-x-6 h-[calc(100vh-250px)]">
        <div className="w-1/3 bg-gray-100 p-4 rounded-lg overflow-y-auto">
          <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Backlog</h3>
        </div>
        <div className="w-2/3 bg-gray-100 p-4 rounded-lg overflow-y-auto">
          <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Active Sprint</h3>
          <div className="flex space-x-4">
             <div className="flex-1 min-w-[250px]">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">To Do</h4>
             </div>
             <div className="flex-1 min-w-[250px]">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">In Progress</h4>
             </div>
             <div className="flex-1 min-w-[250px]">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Done</h4>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintsPage;
