import React, { useState, useEffect } from 'react';
import { Feature, FeatureWithProgress } from '../../types';
import { Trash2, Clock } from 'lucide-react';
import { useFeatureForm } from '../../hooks/useFeatureForm';
import { STATUS_CONFIG } from '../../constants/status';
import { useModal } from '../../hooks/useModal';
import ConfirmModalContent from '../ConfirmModalContent';

// Sub-components
import FeatureHeader from './FeatureHeader';
import FeatureStats from './FeatureStats';
import StatusSelect from '../EpicModal/StatusSelect';
import StoryList from './StoryList';
import EpicSelect from './EpicSelect';

import EpicModalContent from '../EpicModal/EpicModalContent';
import { useEpics } from '../../hooks/useEpics';

type FeatureModalContentProps = {
  onClose: () => void;
  onSubmit: () => void;
  feature?: Feature;
  initialEpicId?: string;
};

const FeatureModalContent: React.FC<FeatureModalContentProps> = ({ 
  onClose, 
  onSubmit, 
  feature, 
  initialEpicId 
}) => {
  const { openModal, setOptions, closeModal } = useModal();
  const { epics } = useEpics();
  
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
  } = useFeatureForm({ feature, onClose: closeModal, onSubmit, initialEpicId });

  const currentStatus = STATUS_CONFIG[status];

  useEffect(() => {
    setOptions({ ribbonColor: currentStatus.color });
  }, [currentStatus.color, setOptions]);

  const handleGoToEpic = () => {
    const epic = epics.find(e => e._id === epicId);
    if (epic) {
      openModal(
        <EpicModalContent 
          epic={epic}
          onClose={closeModal}
          onSubmit={onSubmit}
        />,
        { maxWidth: '6xl' }
      );
    }
  };

  const handleOpenDeleteConfirm = () => {
    openModal(
      <ConfirmModalContent
        onConfirm={handleDelete}
        title="Delete Feature"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone and will fail if there are user stories linked.`}
        confirmText="Delete Feature"
      />,
      { maxWidth: 'md' }
    );
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="px-8 pb-8 pt-2">
          <FeatureHeader 
            title={title}
            isEditingTitle={isEditingTitle}
            setTitle={setTitle}
            setIsEditingTitle={setIsEditingTitle}
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
            onClick={closeModal}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          {feature && (
            <button
              type="button"
              onClick={handleOpenDeleteConfirm}
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
  );
};

export default FeatureModalContent;
