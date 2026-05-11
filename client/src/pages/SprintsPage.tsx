import React, { useState, useMemo } from 'react';
import { useSprints } from '../hooks/useSprints';
import { useUserStories } from '../hooks/useUserStories';
import { useModal } from '../hooks/useModal';
import { Plus, Layout, List, Calendar } from 'lucide-react';
import UserStoryModalContent from '../components/UserStoryModal/UserStoryModalContent';
import SprintModalContent from '../components/SprintModal/SprintModalContent';
import BacklogView from '../components/Sprints/BacklogView/BacklogView';
import KanbanView from '../components/Sprints/KanbanView/KanbanView';

const SprintsPage: React.FC = () => {
  const [view, setView] = useState<'backlog' | 'kanban'>('kanban');
  const { sprints, loading: loadingSprints, refetch: refetchSprints } = useSprints();
  const { userStories, loading: loadingStories, refetch: refetchStories } = useUserStories();
  const { openModal } = useModal();
  const [selectedSprintId, setSelectedSprintId] = useState<string | 'current'>('current');

  const activeSprint = useMemo(() => {
    const now = new Date();
    return sprints.find(s => new Date(s.startDate) <= now && new Date(s.endDate) >= now) || sprints[0];
  }, [sprints]);

  const currentSprintId = useMemo(() => {
    if (selectedSprintId === 'current') return activeSprint?._id;
    return selectedSprintId;
  }, [selectedSprintId, activeSprint]);

  const handleOpenUserStory = (storyId?: string, initialSprintId?: string) => {
    const story = storyId ? userStories.find(s => s._id === storyId) : undefined;
    openModal(
      <UserStoryModalContent 
        userStory={story}
        initialSprintId={initialSprintId}
        onSubmit={() => {
          refetchStories();
          refetchSprints();
        }}
      />,
      { maxWidth: '6xl' }
    );
  };

  const handleCreateSprint = () => {
    openModal(
      <SprintModalContent 
        onSubmit={refetchSprints}
      />,
      { maxWidth: '2xl' }
    );
  };

  if (loadingSprints || loadingStories) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sprints</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your team's velocity and sprint execution.</p>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              view === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layout size={16} />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setView('backlog')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              view === 'backlog' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={16} />
            <span>Backlog</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateSprint}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Calendar size={18} />
            <span>New Sprint</span>
          </button>
          <button
            onClick={() => handleOpenUserStory(undefined, currentSprintId)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={18} />
            <span>New Story</span>
          </button>
        </div>
      </div>

      {view === 'backlog' ? (
        <div className="max-w-7xl mx-auto w-full">
          <BacklogView 
            sprints={sprints} 
            userStories={userStories} 
            onOpenStory={handleOpenUserStory} 
          />
        </div>
      ) : (
        <KanbanView 
          sprints={sprints} 
          userStories={userStories} 
          selectedSprintId={selectedSprintId}
          setSelectedSprintId={setSelectedSprintId}
          onOpenStory={handleOpenUserStory}
          activeSprint={activeSprint}
          onStoriesUpdate={refetchStories}
        />
      )}
    </div>
  );
};

export default SprintsPage;
