import React from 'react';
import { Sprint } from '../../types';
import { Trash2, Calendar, Edit3 } from 'lucide-react';
import { useSprintForm } from '../../hooks/useSprintForm';
import { useModal } from '../../hooks/useModal';
import ConfirmModalContent from '../ConfirmModalContent';

type SprintModalContentProps = {
  onSubmit: () => void;
  sprint?: Sprint;
};

const SprintModalContent: React.FC<SprintModalContentProps> = ({ onSubmit, sprint }) => {
  const { openModal, closeModal } = useModal();
  
  const {
    name,
    setName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isSubmitting,
    isDirty,
    error,
    handleSubmit,
    handleDelete
  } = useSprintForm({ sprint, onClose: closeModal, onSubmit });

  const handleOpenDeleteConfirm = () => {
    openModal(
      <ConfirmModalContent
        onConfirm={handleDelete}
        title="Delete Sprint"
        message={`Are you sure you want to delete "${name}"? This action cannot be undone and will fail if there are user stories linked.`}
        confirmText="Delete Sprint"
      />,
      { maxWidth: 'md' }
    );
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="px-8 pb-8 pt-2">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">
                Sprint
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Edit3 size={24} className="text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-3xl font-bold text-gray-800 w-full border-b-2 border-transparent focus:border-indigo-500 focus:outline-none bg-transparent py-1 transition-all"
                placeholder="Sprint Name (e.g., Sprint 1)..."
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3 text-gray-500">
                <Calendar size={16} />
                <label htmlFor="startDate" className="text-xs font-bold uppercase tracking-widest">Start Date</label>
              </div>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-gray-200 rounded-xl shadow-sm py-4 px-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 bg-gray-50/30"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-3 text-gray-500">
                <Calendar size={16} />
                <label htmlFor="endDate" className="text-xs font-bold uppercase tracking-widest">End Date</label>
              </div>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border-gray-200 rounded-xl shadow-sm py-4 px-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 bg-gray-50/30"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-5 flex flex-row-reverse items-center gap-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting || (!isDirty && !!sprint)}
            className={`flex-none px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 ${
              isSubmitting || (!isDirty && !!sprint) ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700'
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
          {sprint && (
            <button
              type="button"
              onClick={handleOpenDeleteConfirm}
              disabled={isSubmitting}
              className="mr-auto p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Delete Sprint"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SprintModalContent;
