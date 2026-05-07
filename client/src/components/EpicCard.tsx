import React from 'react';
import { EpicWithProgress } from '../services/epicService';
import { Status } from '../types';
import ProgressBar from './ProgressBar';
import { Layers, Calendar } from 'lucide-react';

type EpicCardProps = {
  epic: EpicWithProgress;
  onClick: (epic: EpicWithProgress) => void;
};

const statusColors: Record<Status, string> = {
  'To Do': 'bg-gray-100 text-gray-800 border-gray-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'Blocked': 'bg-red-100 text-red-800 border-red-200',
  'Done': 'bg-green-100 text-green-800 border-green-200',
};

const EpicCard: React.FC<EpicCardProps> = ({ epic, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={() => onClick(epic)}
      className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors truncate pr-2">
          {epic.title}
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${statusColors[epic.status]}`}>
          {epic.status}
        </span>
      </div>
      
      <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">
        {epic.description || 'No description provided.'}
      </p>

      <div className="flex items-center space-x-4 mb-6 text-gray-400">
        <div className="flex items-center space-x-1.5">
          <Layers size={14} />
          <span className="text-xs font-medium">{epic.featureCount} Features</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Calendar size={14} />
          <span className="text-xs font-medium">{formatDate(epic.updatedAt)}</span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-50">
        <ProgressBar
          current={epic.completedStoryPoints}
          total={epic.totalStoryPoints}
        />
      </div>
    </div>
  );
};

export default EpicCard;
