import React from 'react';
import { USER_STORY_STATUS_CONFIG } from '../../../../constants/status';
import { UserStory } from '../../../../types';
import { getInitialsFromName } from '../../../../utils/initials';

interface HashIconProps {
  size?: number;
  className?: string;
}

const HashIcon: React.FC<HashIconProps> = ({ size = 16, className = "" }) => (
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

interface StoryListRowProps {
  story: UserStory;
  onClick: () => void;
}

const StoryListRow: React.FC<StoryListRowProps> = ({ story, onClick }) => {
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
                <HashIcon size={10} className="mr-1" />
                {story.storyPoints} Points
             </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
         {story.assignedUser && (
           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border-2 border-white shadow-sm">
             {getInitialsFromName(typeof story.assignedUser === 'string' ? (story.assignedUser as string) : (story.assignedUser as any)?.name)}
           </div>
         )}
      </div>
    </div>
  );
};

export default StoryListRow;
