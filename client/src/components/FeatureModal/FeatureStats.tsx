import React from 'react';
import { FeatureWithProgress } from '../../types';

type FeatureStatsProps = {
  feature?: FeatureWithProgress;
  storyCount: number;
};

const FeatureStats: React.FC<FeatureStatsProps> = ({ feature, storyCount }) => {
  if (!feature) return null;

  const progressPercent = Math.round((feature.completedStoryPoints / feature.totalStoryPoints) * 100) || 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Progress</p>
        <p className="text-lg font-black text-indigo-700">{progressPercent}%</p>
      </div>
      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Points</p>
        <p className="text-lg font-black text-emerald-700">
          {feature.completedStoryPoints} <span className="text-xs font-medium text-emerald-500">/ {feature.totalStoryPoints}</span>
        </p>
      </div>
      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
        <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">Stories</p>
        <p className="text-lg font-black text-amber-700">{storyCount}</p>
      </div>
    </div>
  );
};

export default FeatureStats;
