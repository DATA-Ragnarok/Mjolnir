import React from 'react';
import { Calendar, Layers, X } from 'lucide-react';
import { Epic } from '../../types';

type EpicHeaderProps = {
  title: string;
  isEditingTitle: boolean;
  setTitle: (title: string) => void;
  setIsEditingTitle: (isEditing: boolean) => void;
  onClose: () => void;
  epic?: Epic;
  featureCount: number;
};

const EpicHeader: React.FC<EpicHeaderProps> = ({
  title,
  isEditingTitle,
  setTitle,
  setIsEditingTitle,
  onClose,
  epic,
  featureCount
}) => {
  return (
    <div className="flex justify-between items-start mb-8">
      <div className="flex-grow mr-4">
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
            {title || 'New Epic'}
          </h2>
        )}
        {epic && (
          <div className="flex items-center mt-2 text-gray-400 space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span className="text-xs">Updated {new Date(epic.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Layers size={14} />
              <span className="text-xs">{featureCount} Features linked</span>
            </div>
          </div>
        )}
      </div>
      <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
        <X size={24} />
      </button>
    </div>
  );
};

export default EpicHeader;
