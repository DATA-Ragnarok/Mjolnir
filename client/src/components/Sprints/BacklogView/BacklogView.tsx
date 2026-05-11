import React from 'react';
import { List, Calendar } from 'lucide-react';
import { Sprint, UserStory } from '../../../types';
import StoryListRow from './components/StoryListRow';

interface BacklogViewProps {
  sprints: Sprint[];
  userStories: UserStory[];
  onOpenStory: (id?: string, sprintId?: string) => void;
}

const BacklogView: React.FC<BacklogViewProps> = ({ sprints, userStories, onOpenStory }) => {
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

export default BacklogView;
