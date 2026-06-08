import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEpics } from '../hooks/useEpics';
import { useModal } from '../hooks/useModal';
import EpicCard from '../components/EpicCard';
import EpicModalContent from '../components/EpicModal/EpicModalContent';
import CollapsibleSection from '../components/CollapsibleSection';
import { EpicWithProgress } from '../types';
import { Coffee, Plus, Layers } from 'lucide-react';
import EmptyState from '../components/EmptyState';

const EpicsPage: React.FC = () => {
  const navigate = useNavigate();
  const { epicId } = useParams<{ epicId: string }>();
  const { openModal, closeModal, isOpen: isModalOpen } = useModal();
  const { epics, loading, error, refetch } = useEpics();
  const lastOpenedId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (epicId && epics.length > 0 && epicId !== lastOpenedId.current) {
      const epic = epicId === 'new' ? undefined : epics.find(e => e._id === epicId);
      
      if (epic || epicId === 'new') {
        lastOpenedId.current = epicId;
        openModal(
          <EpicModalContent 
            epic={epic}
            onSubmit={() => refetch()}
          />,
          { 
            maxWidth: '6xl',
            onClose: () => {
              lastOpenedId.current = undefined;
              navigate('/epics');
            }
          }
        );
      } else if (!loading) {
        navigate('/epics', { replace: true });
      }
    } else if (!epicId && isModalOpen) {
      closeModal();
      lastOpenedId.current = undefined;
    }
  }, [epicId, epics, loading, navigate, openModal, closeModal, isModalOpen, refetch]);

  const handleCreateClick = () => {
    navigate('/epics/new');
  };

  const handleEpicClick = (epic: EpicWithProgress) => {
    navigate(`/epics/${epic._id}`);
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
        {epics.length > 0 ? (
          <>
            {renderSection('Blocked', blockedEpics)}
            {renderSection('In Progress', inProgressEpics)}
            {renderSection('To Do', toDoEpics)}
            {renderSection('Done', doneEpics)}
          </>
        ) : !loading && !error && (
          <EmptyState
            icon={<Layers size={48} />}
            title="No epics found"
            description="Epics represent high-level goals or project milestones. Create your first epic to start organizing your work into features and stories."
            actionText="Create your first Epic"
            onAction={handleCreateClick}
          />
        )}
      </div>
    </div>
  );
};

export default EpicsPage;
