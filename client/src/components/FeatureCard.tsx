import React from 'react';
import { FeatureWithProgress } from '../types';
import ProgressBar from './ProgressBar';
import { ClipboardList, Calendar, Tag } from 'lucide-react';
import { STATUS_CONFIG } from '../constants/status';

type FeatureCardProps = {
  feature: FeatureWithProgress;
  onClick: (feature: FeatureWithProgress) => void;
  hideEpicTag?: boolean;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onClick, hideEpicTag }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const statusStyle = STATUS_CONFIG[feature.status];

  return (
    <div
      onClick={() => onClick(feature)}
      className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-base text-gray-900 group-hover:text-indigo-600 transition-colors truncate pr-2">
          {feature.title}
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold border ${statusStyle.cardBg} ${statusStyle.text} ${statusStyle.border}`}>
          {feature.status}
        </span>
      </div>
      
      {!hideEpicTag && (
        <div className="flex items-center space-x-1 mb-3">
          <Tag size={10} className="text-indigo-400" />
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">{feature.epicTitle}</span>
        </div>
      )}

      <p className="text-gray-500 text-xs mb-4 line-clamp-2 flex-grow leading-relaxed">
        {feature.description || 'No description provided.'}
      </p>

      <div className="flex items-center space-x-4 mb-4 text-gray-400">
        <div className="flex items-center space-x-1.5">
          <ClipboardList size={12} />
          <span className="text-[10px] font-semibold">{feature.userStoryCount} Stories</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Calendar size={12} />
          <span className="text-[10px] font-semibold">{formatDate(feature.updatedAt)}</span>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-50">
        <ProgressBar
          current={feature.completedStoryPoints}
          total={feature.totalStoryPoints}
        />
      </div>
    </div>
  );
};

export default FeatureCard;
