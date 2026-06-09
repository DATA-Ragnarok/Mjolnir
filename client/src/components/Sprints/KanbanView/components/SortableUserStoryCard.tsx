import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle } from 'lucide-react';
import { UserStory, User } from '../../../../types';

interface SortableUserStoryCardProps {
  story: UserStory;
  users?: User[];
  onClick: () => void;
  wipWarning: boolean;
}

const SortableUserStoryCard: React.FC<SortableUserStoryCardProps> = ({ story, users = [], onClick, wipWarning }) => {
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
         {story.assignedUserId && (() => {
           const user = users.find(u => u._id === story.assignedUserId);
           if (!user) return null; // hide coin when there's no matching user (treat as unassigned)
           return (
             <UserInitialsWithTooltip user={user} />
           );
         })()}
      </div>

      {wipWarning && (
        <div className={`absolute -top-2 -right-2 p-1 rounded-full shadow-sm ${warningType === 'red' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
           <AlertCircle size={12} />
        </div>
      )}
    </div>
  );
};

export default SortableUserStoryCard;

// Small helper component placed here to keep file-local logic concise.
const UserInitialsWithTooltip: React.FC<{ user: User }> = ({ user }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    // show tooltip only after 1 second
    timerRef.current = window.setTimeout(() => setShowTooltip(true), 250);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(false);
  };

  const parts = user.name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

  return (
    <div className="relative flex items-center">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] border border-white shadow-sm cursor-default"
      >
        {initials}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs rounded-md px-2 py-1 shadow-lg z-10">
          {user.name}
        </div>
      )}
    </div>
  );
};

