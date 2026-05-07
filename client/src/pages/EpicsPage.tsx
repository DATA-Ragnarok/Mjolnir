import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEpics } from '../hooks/useEpics';
import EpicCard from '../components/EpicCard';
import EpicModal from '../components/EpicModal';
import CollapsibleSection from '../components/CollapsibleSection';
import { Epic } from '../types';
import { EpicWithProgress } from '../services/epicService';
import { Coffee, Plus } from 'lucide-react';

const EpicsPage: React.FC = () => {
  const navigate = useNavigate();
  const { epicId } = useParams<{ epicId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { epics, loading, error, refetch } = useEpics();
  const [selectedEpic, setSelectedEpic] = useState<Epic | undefined>(undefined);

  useEffect(() => {
    if (epicId === 'new') {
      setSelectedEpic(undefined);
      setIsModalOpen(true);
    } else if (epicId && epics.length > 0) {
      const epic = epics.find(e => e._id === epicId);
      if (epic) {
        setSelectedEpic(epic);
        setIsModalOpen(true);
      } else if (!loading) {
        // Epic not found, maybe redirect to /epics
        navigate('/epics', { replace: true });
      }
    } else if (!epicId) {
      setIsModalOpen(false);
      setSelectedEpic(undefined);
    }
  }, [epicId, epics, loading, navigate]);

  const handleCreateClick = () => {
    navigate('/epics/new');
  };

  const handleEpicClick = (epic: EpicWithProgress) => {
    navigate(`/epics/${epic._id}`);
  };

  const handleModalClose = () => {
    navigate('/epics');
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
          <div className="col-span-full py-10 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:bg-gray-50">
            <Coffee className="text-gray-300 mb-3" size={32} />
            <p className="text-gray-400 text-sm font-medium">All clear in {title}</p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Epics</h2>
          <p className="text-gray-500 mt-1">Manage high-level goals and project milestones.</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="-ml-1 mr-2" size={18} />
          Create Epic
        </button>
      </div>

      <div className="space-y-4">
        {renderSection('Blocked', blockedEpics)}
        {renderSection('In Progress', inProgressEpics)}
        {renderSection('To Do', toDoEpics)}
        {renderSection('Done', doneEpics)}
      </div>

      {epics.length === 0 && !loading && (
        <div className="py-12 text-center bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No epics found. Create one to get started!</p>
        </div>
      )}

      {isModalOpen && (
        <EpicModal
          key={selectedEpic?._id || 'new'}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          epic={selectedEpic}
        />
      )}
    </div>
  );
};

export default EpicsPage;
