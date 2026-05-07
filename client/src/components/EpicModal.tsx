import React from 'react';
import { Epic, EpicWithProgress } from '../types';
import { Trash2, Clock } from 'lucide-react';
import { useEpicForm } from '../hooks/useEpicForm';
import { STATUS_CONFIG } from '../constants/status';

// Sub-components
import EpicHeader from './EpicModal/EpicHeader';
import EpicStats from './EpicModal/EpicStats';
import StatusSelect from './EpicModal/StatusSelect';
import FeatureList from './EpicModal/FeatureList';

type EpicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  epic?: Epic;
};

const EpicModal: React.FC<EpicModalProps> = ({ isOpen, onClose, onSubmit, epic }) => {
  const {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    features,
    isSubmitting,
    isLoadingFeatures,
    isEditingTitle,
    setIsEditingTitle,
    isDirty,
    handleSubmit,
    handleDelete
  } = useEpicForm({ epic, onClose, onSubmit });

  if (!isOpen) return null;

  const currentStatus = STATUS_CONFIG[status];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-6xl transform transition-all">
          {/* Progress Ribbon */}
          <div className={`h-1.5 w-full ${currentStatus.color} transition-colors duration-500`}></div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-8">
              <EpicHeader 
                title={title}
                isEditingTitle={isEditingTitle}
                setTitle={setTitle}
                setIsEditingTitle={setIsEditingTitle}
                onClose={onClose}
                epic={epic}
                featureCount={features.length}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Description and Main content */}
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-3 text-gray-500">
                      <Clock size={16} />
                      <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest">Description</label>
                    </div>
                    <textarea
                      id="description"
                      rows={12}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this epic trying to achieve? Define the high-level goals and acceptance criteria..."
                      className="w-full border-gray-200 rounded-xl shadow-sm py-4 px-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 leading-relaxed transition-all resize-none bg-gray-50/30"
                    />
                  </div>

                  <EpicStats epic={epic as EpicWithProgress} featureCount={features.length} />
                </div>

                {/* Right: Metadata and Features */}
                <div className="space-y-8">
                  <StatusSelect status={status} setStatus={setStatus} />
                  <FeatureList features={features} isLoading={isLoadingFeatures} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-5 flex flex-row-reverse items-center gap-3 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting || (!isDirty && !!epic)}
                className={`flex-none px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 ${
                  isSubmitting || (!isDirty && !!epic) ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              {epic && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="mr-auto p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete Epic"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EpicModal;
