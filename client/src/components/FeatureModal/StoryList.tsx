import React from 'react';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { UserStory } from '../../types';
import { STATUS_CONFIG } from '../../constants/status';

type StoryListProps = {
  stories: UserStory[];
  isLoading: boolean;
};

const StoryList: React.FC<StoryListProps> = ({ stories, isLoading }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">User Stories</label>
        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {stories.length}
        </span>
      </div>
      
      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-300 border-t-indigo-500 rounded-full" />
            <span className="text-xs font-medium">Syncing stories...</span>
          </div>
        ) : stories.length > 0 ? (
          stories.map((story) => (
            <div 
              key={story._id} 
              className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-default"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[story.status === 'Waiting for MR' ? 'Blocked' : story.status as any]?.color || 'bg-gray-400'}`} />
                <span className="text-sm font-semibold text-gray-700 truncate">{story.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-gray-400">{story.storyPoints} pts</span>
                <ChevronRight 
                  size={16} 
                  className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" 
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
            <ClipboardList className="mx-auto text-gray-200 mb-2" size={32} />
            <p className="text-xs text-gray-400 italic">No user stories linked yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryList;
