import React from 'react';
import { EpicWithProgress } from '../services/epicService';
import ProgressBar from './ProgressBar';

type EpicCardProps = {
  epic: EpicWithProgress;
  onClick: (epic: EpicWithProgress) => void;
};

const statusColors = {
  'To Do': 'bg-gray-100 text-gray-800 border-gray-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'Blocked': 'bg-red-100 text-red-800 border-red-200',
  'Done': 'bg-green-100 text-green-800 border-green-200',
};

const EpicCard: React.FC<EpicCardProps> = ({ epic, onClick }) => {
  return (
    <div
      onClick={() => onClick(epic)}
      className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{epic.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[epic.status]}`}>
          {epic.status}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-grow">
        {epic.description || 'No description provided.'}
      </p>

      <div className="mt-auto">
        <ProgressBar
          current={epic.completedStoryPoints}
          total={epic.totalStoryPoints}
          label="Overall Progress"
        />
      </div>
    </div>
  );
};

export default EpicCard;
