import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { UserStory } from '../../../../types';
import { UserStoryStatusType } from '../../../../constants/status';
import SortableUserStoryCard from './SortableUserStoryCard';

interface KanbanColumnProps {
  status: UserStoryStatusType;
  stories: UserStory[];
  onOpenStory: (id?: string) => void;
  userInProgressCount: Record<string, number>;
  userWaitingMRCount: Record<string, number>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, stories, onOpenStory, userInProgressCount, userWaitingMRCount }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const points = stories.reduce((acc, s) => acc + s.storyPoints, 0);
  
  return (
    <div className="flex-none w-80">
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
        <div 
          ref={setNodeRef}
          className="space-y-4 min-h-[500px] bg-gray-50/50 p-3 rounded-2xl border-2 border-dashed border-gray-200/50"
        >
          {stories.map(story => (
            <SortableUserStoryCard 
              key={story._id} 
              story={story} 
              onClick={() => onOpenStory(story._id)}
              wipWarning={
                (story.status === 'In Progress' && !!story.assignedUser && userInProgressCount[story.assignedUser.id] > 1) ||
                (story.status === 'Waiting for MR' && !!story.assignedUser && userWaitingMRCount[story.assignedUser.id] > 1)
              }
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
