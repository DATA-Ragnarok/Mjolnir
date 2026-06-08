import React from 'react';
import { Tag, Search, ExternalLink } from 'lucide-react';
import { useEpics } from '../../hooks/useEpics';

type EpicSelectProps = {
  selectedEpicId: string;
  onChange: (epicId: string) => void;
  onGoToEpic?: () => void;
};

const EpicSelect: React.FC<EpicSelectProps> = ({ selectedEpicId, onChange, onGoToEpic }) => {
  const { epics, loading } = useEpics();

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-gray-500">
        <Tag size={16} />
        <label htmlFor="epicSelect" className="text-xs font-bold uppercase tracking-widest">Parent Epic</label>
      </div>
      <div className="relative">
        <select
          id="epicSelect"
          value={selectedEpicId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
        >
          <option value="" disabled>Select an Epic</option>
          {epics.map((epic) => (
            <option key={epic._id} value={epic._id}>
              {epic.title}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
      </div>
      <div className="flex justify-between items-center px-1">
        {loading && epics.length === 0 ? (
          <p className="text-[10px] text-gray-400 animate-pulse font-medium">Loading available epics...</p>
        ) : (
          <div /> // Spacer
        )}
        
        {selectedEpicId && onGoToEpic && (
          <button
            type="button"
            onClick={onGoToEpic}
            className="flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider group"
          >
            <span>Go to Epic</span>
            <ExternalLink size={10} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EpicSelect;
