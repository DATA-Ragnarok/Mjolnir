import React from 'react';
import { Hash, Zap, Rocket, Flame, Target, Trophy } from 'lucide-react';

const DevilIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <span style={{ fontSize: size }} className={className}>😈</span>
);

type StoryPointsSelectProps = {
  value: number;
  onChange: (points: number) => void;
};

const POINT_OPTIONS = [
  { value: 1, label: '1 Point', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
  { value: 3, label: '3 Points', icon: Rocket, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { value: 5, label: '5 Points', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
  { value: 8, label: '8 Points', icon: Target, color: 'text-purple-500', bg: 'bg-purple-50' },
  { value: 13, label: '13 Points', icon: Trophy, color: 'text-red-500', bg: 'bg-red-50' },
  { value: 666, label: '666 Points 😈', icon: DevilIcon, color: 'text-red-600', bg: 'bg-red-50' },
];

const StoryPointsSelect: React.FC<StoryPointsSelectProps> = ({ value, onChange }) => {
  const currentOption = POINT_OPTIONS.find(opt => opt.value === value) || POINT_OPTIONS[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-gray-500">
        <Hash size={16} />
        <label htmlFor="storyPoints" className="text-xs font-bold uppercase tracking-widest">Story Points</label>
      </div>
      <div className="relative">
        <select
          id="storyPoints"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full appearance-none border-2 rounded-xl py-3 pl-12 pr-10 focus:outline-none transition-all duration-300 font-bold border-gray-100 bg-gray-50/30 text-gray-700 hover:border-indigo-200 focus:border-indigo-500 focus:bg-white`}
        >
          {POINT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {(() => {
            const Icon = currentOption.icon as any;
            return <Icon size={18} className={currentOption.color} />;
          })()}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StoryPointsSelect;
