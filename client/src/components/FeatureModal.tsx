import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Feature, FeatureWithProgress } from '../types';
import { Trash2, Clock } from 'lucide-react';
import { useFeatureForm } from '../hooks/useFeatureForm';
import { STATUS_CONFIG } from '../constants/status';

// Sub-components
import FeatureHeader from './FeatureModal/FeatureHeader';
import FeatureStats from './FeatureModal/FeatureStats';
import StatusSelect from './EpicModal/StatusSelect';
import StoryList from './FeatureModal/StoryList';
import EpicSelect from './FeatureModal/EpicSelect';
import ConfirmModal from './ConfirmModal';

type FeatureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  feature?: Feature;
  initialEpicId?: string;
};

const FeatureModal: React.FC<FeatureModalProps> = ({ isOpen, onClose, onSubmit, feature, initialEpicId }) => {
  const navigate = useNavigate();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    epicId,
    setEpicId,
    userStories,
    isSubmitting,
    isLoadingStories,
    isEditingTitle,
    setIsEditingTitle,
    isDirty,
    error,
    handleSubmit,
    handleDelete
  } = useFeatureForm({ feature, onClose, onSubmit, initialEpicId });

  const handleGoToEpic = async () => {
    if (isDirty) {
      const success = await handleSubmit(undefined, false);
      if (!success) return;
    }
    navigate(`/epics/${epicId}`);
  };

  if (!isOpen) return null;

  const currentStatus = STATUS_CONFIG[status];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-6xl transform transition-all">
            {/* Progress Ribbon */}
            <div className={`h-1.5 w-full ${currentStatus.color} transition-colors duration-500`}></div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-8">
                <FeatureHeader 
                  title={title}
                  isEditingTitle={isEditingTitle}
                  setTitle={setTitle}
                  setIsEditingTitle={setIsEditingTitle}
                  onClose={onClose}
                  feature={feature}
                  storyCount={userStories.length}
                />

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-700 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <div className="mr-3 p-1 bg-red-100 rounded-full">
                      <Trash2 size={14} className="text-red-600" />
                    </div>
                    {error}
                  </div>
                )}

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
                        placeholder="What is this feature trying to achieve? Define the scope and high-level requirements..."
                        className="w-full border-gray-200 rounded-xl shadow-sm py-4 px-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 leading-relaxed transition-all resize-none bg-gray-50/30"
                      />
                    </div>

                    <FeatureStats feature={feature as FeatureWithProgress} storyCount={userStories.length} />
                  </div>

                  {/* Right: Metadata and Stories */}
                  <div className="space-y-8">
                    <StatusSelect status={status} setStatus={setStatus} />
                    <EpicSelect selectedEpicId={epicId} onChange={setEpicId} onGoToEpic={handleGoToEpic} />
                    <StoryList stories={userStories} isLoading={isLoadingStories} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-8 py-5 flex flex-row-reverse items-center gap-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || (!isDirty && !!feature) || !epicId}
                  className={`flex-none px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 ${
                    isSubmitting || (!isDirty && !!feature) || !epicId ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700'
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
                {feature && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isSubmitting}
                    className="mr-auto p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Feature"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Feature"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone and will fail if there are user stories linked.`}
        confirmText="Delete Feature"
      />
    </>
  );
};

export default FeatureModal;
