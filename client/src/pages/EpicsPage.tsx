import React, { useState } from 'react';
import { useEpics } from '../hooks/useEpics';
import EpicCard from '../components/EpicCard';
import EpicModal from '../components/EpicModal';
import CollapsibleSection from '../components/CollapsibleSection';
import { Epic } from '../types';
import { EpicWithProgress } from '../services/epicService';

const EpicsPage: React.FC = () => {
  const { epics, loading, error, refetch } = useEpics();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | undefined>(undefined);

  const handleCreateClick = () => {
    setSelectedEpic(undefined);
    setIsModalOpen(true);
  };

  const handleEpicClick = (epic: EpicWithProgress) => {
    setSelectedEpic(epic);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEpic(undefined);
  };

  const handleModalSubmit = () => {
    refetch();
  };

  if (loading && epics.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && epics.length === 0) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 border border-red-200">
        <p className="font-medium">Error: {error}</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 text-sm font-semibold underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const inProgressEpics = epics.filter((e) => e.status === 'In Progress');
  const toDoEpics = epics.filter((e) => e.status === 'To Do');
  const blockedEpics = epics.filter((e) => e.status === 'Blocked');
  const doneEpics = epics.filter((e) => e.status === 'Done');

  const renderSection = (title: string, filteredEpics: EpicWithProgress[]) => (
    <CollapsibleSection title={title} count={filteredEpics.length}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEpics.map((epic) => (
          <EpicCard 
            key={epic._id} 
            epic={epic} 
            onClick={handleEpicClick} 
          />
        ))}
        {filteredEpics.length === 0 && (
          <div className="col-span-full py-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm italic">No epics in this status</p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Epics</h2>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Epic
        </button>
      </div>

      <div className="space-y-2">
        {renderSection('In Progress', inProgressEpics)}
        {renderSection('To Do', toDoEpics)}
        {renderSection('Blocked', blockedEpics)}
        {renderSection('Done', doneEpics)}
      </div>

      {epics.length === 0 && !loading && (
        <div className="py-12 text-center bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No epics found. Create one to get started!</p>
        </div>
      )}

      <EpicModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        epic={selectedEpic}
      />
    </div>
  );
};

export default EpicsPage;
