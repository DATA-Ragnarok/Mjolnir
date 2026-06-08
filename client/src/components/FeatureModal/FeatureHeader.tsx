import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import { Feature } from '../../types';

type FeatureHeaderProps = {
  title: string;
  isEditingTitle: boolean;
  setTitle: (title: string) => void;
  setIsEditingTitle: (isEditing: boolean) => void;
  feature?: Feature;
  storyCount: number;
};

const FeatureHeader: React.FC<FeatureHeaderProps> = ({
  title,
  isEditingTitle,
  setTitle,
  setIsEditingTitle,
  feature,
  storyCount
}) => {
  return (
    <div className="flex justify-between items-start mb-8">
      <div className="flex-grow">
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            className="text-4xl font-extrabold text-gray-900 border-b-2 border-indigo-500 focus:outline-none w-full bg-transparent py-1"
          />
        ) : (
          <h2 
            onClick={() => setIsEditingTitle(true)}
            className="text-4xl font-extrabold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors py-1 -ml-1 rounded hover:bg-gray-50 px-2 inline-block"
          >
            {title || 'New Feature'}
          </h2>
        )}
        {feature && (
          <div className="flex items-center mt-2 text-gray-400 space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span className="text-xs">Updated {new Date(feature.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Tag size={14} />
              <span className="text-xs">{storyCount} User Stories linked</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureHeader;
