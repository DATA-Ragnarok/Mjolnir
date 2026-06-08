import React from 'react';
import { Layers, Search, ExternalLink } from 'lucide-react';
import { Feature } from '../../types';

type FeatureSelectProps = {
  features: Feature[];
  selectedFeatureId: string;
  onChange: (featureId: string) => void;
  onGoToFeature?: () => void;
  loading?: boolean;
};

const FeatureSelect: React.FC<FeatureSelectProps> = ({ 
  features, 
  selectedFeatureId, 
  onChange, 
  onGoToFeature,
  loading 
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-gray-500">
        <Layers size={16} />
        <label htmlFor="featureSelect" className="text-xs font-bold uppercase tracking-widest">Parent Feature</label>
      </div>
      <div className="relative">
        <select
          id="featureSelect"
          value={selectedFeatureId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
        >
          <option value="" disabled>Select a Feature</option>
          {features.map((feature) => (
            <option key={feature._id} value={feature._id}>
              {feature.title}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
      </div>
      <div className="flex justify-between items-center px-1">
        {loading && features.length === 0 ? (
          <p className="text-[10px] text-gray-400 animate-pulse font-medium">Loading available features...</p>
        ) : (
          <div /> // Spacer
        )}
        
        {selectedFeatureId && onGoToFeature && (
          <button
            type="button"
            onClick={onGoToFeature}
            className="flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider group"
          >
            <span>Go to Feature</span>
            <ExternalLink size={10} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FeatureSelect;
