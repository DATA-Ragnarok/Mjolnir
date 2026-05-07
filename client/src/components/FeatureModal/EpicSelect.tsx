import React from 'react';
import { Tag, Search } from 'lucide-react';
import { useEpics } from '../../hooks/useEpics';

type EpicSelectProps = {
  selectedEpicId: string;
  onChange: (epicId: string) => void;
};

const EpicSelect: React.FC<EpicSelectProps> = ({ selectedEpicId, onChange }) => {
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
      {loading && epics.length === 0 && (
        <p className="text-[10px] text-gray-400 animate-pulse font-medium">Loading available epics...</p>
      )}
    </div>
  );
};

export default EpicSelect;
