import React from 'react';
import { Calendar, Search } from 'lucide-react';
import { Sprint } from '../../types';

type SprintSelectProps = {
  sprints: Sprint[];
  selectedSprintId: string;
  onChange: (sprintId: string) => void;
  loading?: boolean;
};

const SprintSelect: React.FC<SprintSelectProps> = ({ 
  sprints, 
  selectedSprintId, 
  onChange, 
  loading 
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-gray-500">
        <Calendar size={16} />
        <label htmlFor="sprintSelect" className="text-xs font-bold uppercase tracking-widest">Sprint</label>
      </div>
      <div className="relative">
        <select
          id="sprintSelect"
          value={selectedSprintId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
        >
          <option value="">Backlog (No Sprint)</option>
          {sprints.map((sprint) => (
            <option key={sprint._id} value={sprint._id}>
              {sprint.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
      </div>
      {loading && sprints.length === 0 && (
        <p className="text-[10px] text-gray-400 animate-pulse font-medium px-1">Loading available sprints...</p>
      )}
    </div>
  );
};

export default SprintSelect;
