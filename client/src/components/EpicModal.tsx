import React, { useState, useEffect } from 'react';
import { Epic, Status, Feature } from '../types';
import { epicService } from '../services/epicService';
import { featureService } from '../services/featureService';

type EpicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  epic?: Epic;
};

const EpicModal: React.FC<EpicModalProps> = ({ isOpen, onClose, onSubmit, epic }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('To Do');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (epic) {
      setTitle(epic.title);
      setDescription(epic.description || '');
      setStatus(epic.status);
      fetchFeatures(epic._id);
    } else {
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setFeatures([]);
    }
  }, [epic, isOpen]);

  const isDirty = title !== (epic?.title || '') || 
                  description !== (epic?.description || '') || 
                  status !== (epic?.status || 'To Do');

  const fetchFeatures = async (epicId: string) => {
    setIsLoadingFeatures(true);
    try {
      const data = await featureService.getFeatures(epicId);
      setFeatures(data);
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setIsLoadingFeatures(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (epic) {
        await epicService.updateEpic(epic._id, { title, description, status });
      } else {
        await epicService.createEpic({ title, description, status });
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to save epic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!epic || !window.confirm('Are you sure you want to delete this epic?')) return;
    
    setIsSubmitting(true);
    try {
      await epicService.deleteEpic(epic._id);
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to delete epic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
              <div className="mb-8">
                {isEditingTitle ? (
                  <input
                    type="text"
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-indigo-500 focus:outline-none w-full bg-transparent"
                  />
                ) : (
                  <h2 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors py-1 px-2 -ml-2 rounded hover:bg-gray-50"
                  >
                    {title || 'New Epic'}
                  </h2>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Description */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea
                      id="description"
                      rows={18}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a detailed description for this epic..."
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Column: Status and Features */}
                <div className="space-y-8">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Status</label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Status)}
                      className={`mt-1 block w-fit min-w-[140px] border rounded-md shadow-sm py-2 px-3 focus:outline-none transition-all duration-200 font-semibold sm:text-sm ${
                        status === 'To Do' ? 'border-gray-300 bg-gray-50 text-gray-800 focus:ring-gray-400 shadow-[0_0_10px_-2px_rgba(156,163,175,0.4)]' :
                        status === 'In Progress' ? 'border-blue-300 bg-blue-50 text-blue-800 focus:ring-blue-400 shadow-[0_0_10px_-2px_rgba(96,165,250,0.4)]' :
                        status === 'Blocked' ? 'border-red-300 bg-red-50 text-red-800 focus:ring-red-400 shadow-[0_0_10px_-2px_rgba(248,113,113,0.4)]' :
                        'border-green-300 bg-green-50 text-green-800 focus:ring-green-400 shadow-[0_0_10px_-2px_rgba(74,222,128,0.4)]'
                      }`}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Child Features</label>
                    <div className="bg-gray-50 rounded-lg p-6 min-h-[300px] max-h-[450px] overflow-y-auto border border-gray-100">
                      {isLoadingFeatures ? (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Loading features...</span>
                        </div>
                      ) : features.length > 0 ? (
                        <ul className="space-y-3">
                          {features.map((feature) => (
                            <li key={feature._id} className="text-sm font-medium text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors">
                              {feature.title}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-gray-400 italic">No features linked to this epic yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting || (!isDirty && !!epic)}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2.5 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-all ${
                  isSubmitting || (!isDirty && !!epic) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-2.5 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
              >
                Cancel
              </button>
              {epic && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-6 py-2.5 bg-red-50 text-base font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:mr-auto sm:w-auto sm:text-sm transition-all"
                >
                  Delete Epic
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
