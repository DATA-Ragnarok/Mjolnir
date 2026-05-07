import React from 'react';

type ProgressBarProps = {
  current: number;
  total: number;
  label?: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
        <span className="text-xs font-medium text-gray-500">{percentage}% ({current}/{total} pts)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            percentage === 100 ? 'bg-green-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
