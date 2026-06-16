import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent, 
  DragOverEvent,
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Sprint, UserStory } from '../../../types';
import { UserStoryStatusType } from '../../../constants/status';
import { userStoryService } from '../../../services/userStoryService';
import EmptyState from '../../EmptyState';
import KanbanColumn from './components/KanbanColumn';

interface KanbanViewProps {
  sprints: Sprint[];
  userStories: UserStory[];
  selectedSprintId: string;
  setSelectedSprintId: (id: string) => void;
  onOpenStory: (id?: string, sprintId?: string) => void;
  activeSprint: Sprint | undefined;
  onStoriesUpdate: () => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ 
  sprints, 
  userStories, 
  selectedSprintId, 
  setSelectedSprintId, 
  onOpenStory, 
  activeSprint, 
  onStoriesUpdate 
}) => {
  const columns: UserStoryStatusType[] = ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'];
  const currentSprintId = selectedSprintId === 'current' ? activeSprint?._id : selectedSprintId;
  
  const [localColumns, setLocalColumns] = useState<Record<UserStoryStatusType, UserStory[]>>(() => {
    const initial: Record<string, UserStory[]> = {};
    columns.forEach(col => {
      initial[col] = userStories.filter(s => s.sprintId === currentSprintId && s.status === col);
    });
    return initial as Record<UserStoryStatusType, UserStory[]>;
  });

  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<UserStoryStatusType | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local columns with props, but only when not dragging and not updating
  useEffect(() => {
    if (!activeStoryId && !isUpdating) {
      const updated: Record<string, UserStory[]> = {};
      columns.forEach(col => {
        updated[col] = userStories.filter(s => s.sprintId === currentSprintId && s.status === col);
      });
      setLocalColumns(updated as Record<UserStoryStatusType, UserStory[]>);
    }
  }, [userStories, currentSprintId, activeStoryId, isUpdating]);

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

  const handleDragStart = (event: DragStartEvent) => {
    const storyId = event.active.id as string;
    setActiveStoryId(storyId);
    setOriginalStatus(findContainer(storyId) as UserStoryStatusType);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setLocalColumns((prev) => {
      const activeItems = prev[activeContainer as UserStoryStatusType];
      const overItems = prev[overContainer as UserStoryStatusType];
      const activeIndex = activeItems.findIndex(i => i._id === activeId);
      const overIndex = overItems.findIndex(i => i._id === overId);

      let newIndex;
      if (columns.includes(overId as UserStoryStatusType)) {
        newIndex = overItems.length;
      } else {
        const isBelowLastItem = over && overIndex === overItems.length - 1;
        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
      }

      const draggedItem = activeItems[activeIndex];
      if (!draggedItem) return prev;

      const updatedItem = { ...draggedItem, status: overContainer as UserStoryStatusType };

      return {
        ...prev,
        [activeContainer]: activeItems.filter((item) => item._id !== activeId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          updatedItem,
          ...overItems.slice(newIndex)
        ],
      };
    });
  };

  const findContainer = (id: string) => {
    if (columns.includes(id as UserStoryStatusType)) return id;
    
    for (const key of Object.keys(localColumns)) {
      if (localColumns[key as UserStoryStatusType].find(s => s._id === id)) {
        return key;
      }
    }
    return null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    
    if (!over) {
      setActiveStoryId(null);
      setOriginalStatus(null);
      return;
    }

    const overId = over.id as string;
    const currentContainer = findContainer(activeId) as UserStoryStatusType;

    if (originalStatus && currentContainer && originalStatus !== currentContainer) {
      try {
        setIsUpdating(true);
        setActiveStoryId(null); // Clear overlay immediately
        await userStoryService.updateUserStory(activeId, { status: currentContainer });
        await onStoriesUpdate();
      } catch (err) {
        console.error('Failed to move story:', err);
        await onStoriesUpdate(); // Refetch anyway to ensure state consistency
      } finally {
        setIsUpdating(false);
        setOriginalStatus(null);
      }
    } else {
      if (originalStatus === currentContainer) {
        const activeItems = localColumns[currentContainer];
        const overIndex = activeItems.findIndex(i => i._id === overId);
        const activeIndex = activeItems.findIndex(i => i._id === activeId);

        if (activeIndex !== overIndex && overIndex !== -1) {
          setLocalColumns((prev) => ({
            ...prev,
            [currentContainer]: arrayMove(prev[currentContainer], activeIndex, overIndex),
          }));
        }
      }
      setActiveStoryId(null);
      setOriginalStatus(null);
    }
  };

  // WIP logic
  const userInProgressCount: Record<string, number> = {};
  const userWaitingMRCount: Record<string, number> = {};

  Object.values(localColumns).flat().forEach(story => {
    if (story.assignedUser) {
      const userId = typeof story.assignedUser === 'object' ? story.assignedUser._id : story.assignedUser;
      if (story.status === 'In Progress') {
        userInProgressCount[userId] = (userInProgressCount[userId] || 0) + 1;
      }
      if (story.status === 'Waiting for MR') {
        userWaitingMRCount[userId] = (userWaitingMRCount[userId] || 0) + 1;
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

  const activeStory = activeStoryId ? Object.values(localColumns).flat().find(s => s._id === activeStoryId) : null;

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto w-full flex items-center space-x-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <Calendar size={20} className="text-gray-400" />
        <select
          value={selectedSprintId}
          onChange={(e) => setSelectedSprintId(e.target.value)}
          className="bg-transparent border-none text-lg font-bold text-gray-900 focus:ring-0 cursor-pointer"
        >
          <option value="current">Current Active Sprint</option>
          {sprints.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
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
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex justify-center space-x-6 overflow-x-auto pb-6 px-4 scrollbar-hide">
          {columns.map(status => (
            <KanbanColumn 
              key={status}
              status={status}
              stories={localColumns[status] || []}
              onOpenStory={onOpenStory}
              userInProgressCount={userInProgressCount}
              userWaitingMRCount={userWaitingMRCount}
            />
          ))}
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

export default KanbanView;
