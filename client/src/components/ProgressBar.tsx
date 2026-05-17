import React from 'react';

type ProgressBarProps = {
  current: number;
  total: number;
  label?: string;
  className?: string;
  indicatorClassName?: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  label, 
  className = "h-2 bg-gray-200", 
  indicatorClassName 
}) => {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;
  
  const defaultIndicatorClass = percentage === 100 ? 'bg-green-500' : 'bg-indigo-600';
  const finalIndicatorClass = indicatorClassName || defaultIndicatorClass;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
        <span className="text-xs font-medium text-gray-500">{percentage}% ({current}/{total} pts)</span>
      </div>
      <div className={`w-full rounded-full ${className}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${finalIndicatorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
