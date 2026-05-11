import React, { useState, useMemo } from 'react';
import { useSprints } from '../hooks/useSprints';
import { useUserStories } from '../hooks/useUserStories';
import { useModal } from '../hooks/useModal';
import { Plus, Layout, List, Calendar, AlertCircle } from 'lucide-react';
import UserStoryModalContent from '../components/UserStoryModal/UserStoryModalContent';
import SprintModalContent from '../components/SprintModal/SprintModalContent';
import EmptyState from '../components/EmptyState';
import { USER_STORY_STATUS_CONFIG, UserStoryStatusType } from '../constants/status';
import { userStoryService } from '../services/userStoryService';
import { Sprint, UserStory } from '../types';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <BacklogView 
          sprints={sprints} 
          userStories={userStories} 
          onOpenStory={handleOpenUserStory} 
        />
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

const BacklogView: React.FC<{
  sprints: Sprint[];
  userStories: UserStory[];
  onOpenStory: (id?: string, sprintId?: string) => void;
}> = ({ sprints, userStories, onOpenStory }) => {
  const sortedSprints = [...sprints].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  const unassignedStories = userStories.filter(s => !s.sprintId);
  
  return (
    <div className="space-y-8">
      {/* Unassigned Backlog */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-200 rounded-lg">
              <List size={18} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Product Backlog</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{unassignedStories.length} Stories Unassigned</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {unassignedStories.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm italic">No unassigned stories</div>
          ) : (
            unassignedStories.map(story => (
              <StoryListRow key={story._id} story={story} onClick={() => onOpenStory(story._id)} />
            ))
          )}
        </div>
      </div>

      {/* Sprints */}
      {sortedSprints.map(sprint => {
        const sprintStories = userStories.filter(s => s.sprintId === sprint._id);
        const totalPoints = sprintStories.reduce((acc, s) => acc + s.storyPoints, 0);
        
        return (
          <div key={sprint._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-50/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{sprint.name}</h3>
                  <p className="text-xs text-indigo-600 uppercase tracking-wider font-semibold">
                    {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()} • {totalPoints} Points
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {sprintStories.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">No stories in this sprint</div>
              ) : (
                sprintStories.map(story => (
                  <StoryListRow key={story._id} story={story} onClick={() => onOpenStory(story._id)} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StoryListRow: React.FC<{ story: UserStory; onClick: () => void }> = ({ story, onClick }) => {
  const statusConfig = USER_STORY_STATUS_CONFIG[story.status];
  
  return (
    <div 
      onClick={onClick}
      className="px-6 py-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors group"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-2 h-10 rounded-full ${statusConfig.color}`} />
        <div>
          <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{story.title}</h4>
          <div className="flex items-center space-x-3 mt-1">
             <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusConfig.light} ${statusConfig.text}`}>
               {story.status}
             </span>
             <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                <Hash size={10} className="mr-1" />
                {story.storyPoints} Points
             </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
         {story.assignedUserId && (
           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border-2 border-white shadow-sm">
             {story.assignedUserId.slice(-2).toUpperCase()}
           </div>
         )}
      </div>
    </div>
  );
};

const KanbanView: React.FC<{
  sprints: Sprint[];
  userStories: UserStory[];
  selectedSprintId: string;
  setSelectedSprintId: (id: string) => void;
  onOpenStory: (id?: string, sprintId?: string) => void;
  activeSprint: Sprint | undefined;
  onStoriesUpdate: () => void;
}> = ({ sprints, userStories, selectedSprintId, setSelectedSprintId, onOpenStory, activeSprint, onStoriesUpdate }) => {
  const currentSprintId = selectedSprintId === 'current' ? activeSprint?._id : selectedSprintId;
  const filteredStories = userStories.filter(s => s.sprintId === currentSprintId);
  
  const columns: (keyof typeof USER_STORY_STATUS_CONFIG)[] = ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveStoryId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStoryId(null);

    if (!over) return;

    const storyId = active.id as string;
    const overId = over.id as string;

    // Determine if we dropped over a column or a card
    let newStatus = overId;
    if (!columns.includes(overId as UserStoryStatusType)) {
      const overStory = filteredStories.find(s => s._id === overId);
      if (overStory) newStatus = overStory.status;
    }

    const story = filteredStories.find(s => s._id === storyId);
    if (story && story.status !== newStatus) {
      try {
        await userStoryService.updateUserStory(storyId, { status: newStatus as UserStoryStatusType });
        onStoriesUpdate();
      } catch (err) {
        console.error('Failed to move story:', err);
      }
    }
  };

  // WIP logic
  const userInProgressCount: Record<string, number> = {};
  const userWaitingMRCount: Record<string, number> = {};

  filteredStories.forEach(story => {
    if (story.assignedUserId) {
      if (story.status === 'In Progress') {
        userInProgressCount[story.assignedUserId] = (userInProgressCount[story.assignedUserId] || 0) + 1;
      }
      if (story.status === 'Waiting for MR') {
        userWaitingMRCount[story.assignedUserId] = (userWaitingMRCount[story.assignedUserId] || 0) + 1;
      }
    }
  });

  if (!activeSprint && sprints.length === 0) {
    return (
      <EmptyState 
        title="No Sprints Found"
        description="Create your first sprint to start planning your work."
        icon={<Calendar className="text-indigo-400" size={48} />}
      />
    );
  }

  const activeStory = activeStoryId ? filteredStories.find(s => s._id === activeStoryId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <Calendar size={20} className="text-gray-400" />
        <select
          value={selectedSprintId}
          onChange={(e) => setSelectedSprintId(e.target.value)}
          className="bg-transparent border-none text-lg font-bold text-gray-900 focus:ring-0 cursor-pointer"
        >
          <option value="current">Current Active Sprint</option>
          {sprints.map(s => (
            <option key={s._id} value={s._id}>{s.name} ({new Date(s.startDate).toLocaleDateString()})</option>
          ))}
        </select>
        
        {activeSprint && currentSprintId === activeSprint._id && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Active Now
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
          {columns.map(status => {
            const stories = filteredStories.filter(s => s.status === status);
            const points = stories.reduce((acc, s) => acc + s.storyPoints, 0);
            
            return (
              <div key={status} className="flex-none w-80">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest">{status}</h3>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {stories.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{points} pts</span>
                </div>
                
                <SortableContext 
                  id={status}
                  items={stories.map(s => s._id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4 min-h-[500px] bg-gray-50/50 p-3 rounded-2xl border-2 border-dashed border-gray-200/50">
                    {stories.map(story => (
                      <SortableUserStoryCard 
                        key={story._id} 
                        story={story} 
                        onClick={() => onOpenStory(story._id)}
                        wipWarning={
                          (story.status === 'In Progress' && !!story.assignedUserId && userInProgressCount[story.assignedUserId] > 1) ||
                          (story.status === 'Waiting for MR' && !!story.assignedUserId && userWaitingMRCount[story.assignedUserId] > 1)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeStory ? (
            <div className="bg-white p-4 rounded-xl border border-indigo-400 shadow-xl w-80 rotate-3">
              <h4 className="font-bold text-gray-900 text-sm leading-tight mb-3">
                {activeStory.title}
              </h4>
              <div className="flex items-center justify-between">
                 <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase tracking-wider">
                   {activeStory.storyPoints} pts
                 </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

const SortableUserStoryCard: React.FC<{ 
  story: UserStory; 
  onClick: () => void;
  wipWarning: boolean;
}> = ({ story, onClick, wipWarning }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: story._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const warningType = story.status === 'In Progress' ? 'red' : 'yellow';

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${
        wipWarning 
          ? (warningType === 'red' ? 'border-red-400 ring-2 ring-red-100 ring-opacity-50' : 'border-yellow-400 ring-2 ring-yellow-100 ring-opacity-50') 
          : 'border-gray-100'
      }`}
    >
      <h4 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors mb-3">
        {story.title}
      </h4>
      
      <div className="flex items-center justify-between">
         <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase tracking-wider">
               {story.storyPoints} pts
            </span>
         </div>
         {story.assignedUserId && (
           <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] border border-white shadow-sm">
             {story.assignedUserId.slice(-2).toUpperCase()}
           </div>
         )}
      </div>

      {wipWarning && (
        <div className={`absolute -top-2 -right-2 p-1 rounded-full shadow-sm ${warningType === 'red' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
           <AlertCircle size={12} />
        </div>
      )}
    </div>
  );
};

const Hash: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);

export default SprintsPage;
