import React, { useState, useEffect } from 'react';
import { Epic, Status, Feature, EpicWithProgress } from '../types';
import { epicService } from '../services/epicService';
import { featureService } from '../services/featureService';
import { 
  X, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Layers,
  Calendar,
  ChevronRight
} from 'lucide-react';

type EpicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  epic?: Epic;
};

const statusConfig = {
  'To Do': { color: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', icon: Clock },
  'In Progress': { color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: TrendingUp },
  'Blocked': { color: 'bg-red-500', light: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: AlertCircle },
  'Done': { color: 'bg-green-500', light: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', icon: CheckCircle2 },
};

const EpicModal: React.FC<EpicModalProps> = ({ isOpen, onClose, onSubmit, epic }) => {
  const [title, setTitle] = useState(epic?.title || '');
  const [description, setDescription] = useState(epic?.description || '');
  const [status, setStatus] = useState<Status>(epic?.status || 'To Do');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (epic) {
      fetchFeatures(epic._id);
    }
  }, []);

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

  const currentStatus = statusConfig[status];
  const progressPercent = epic ? Math.round(((epic as EpicWithProgress).completedStoryPoints / (epic as EpicWithProgress).totalStoryPoints) * 100) || 0 : 0;

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
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-6xl transform transition-all">
          {/* Progress Ribbon */}
          <div className={`h-1.5 w-full ${currentStatus.color} transition-colors duration-500`}></div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-8">
              {/* Header */}
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
                        <span className="text-xs">{features.length} Features linked</span>
                      </div>
                    </div>
                  )}
                </div>
                <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

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

                  {/* Quick Stats Grid */}
                  {epic && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Progress</p>
                        <p className="text-lg font-black text-indigo-700">{progressPercent}%</p>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Points</p>
                        <p className="text-lg font-black text-emerald-700">{(epic as EpicWithProgress).completedStoryPoints} <span className="text-xs font-medium text-emerald-500">/ {(epic as EpicWithProgress).totalStoryPoints}</span></p>
                      </div>
                      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                        <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">Features</p>
                        <p className="text-lg font-black text-amber-700">{features.length}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Metadata and Features */}
                <div className="space-y-8">
                  <div>
                    <label htmlFor="status" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Status</label>
                    <div className="relative">
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Status)}
                        className={`w-full appearance-none border-2 rounded-xl py-3 pl-12 pr-10 focus:outline-none transition-all duration-300 font-bold ${
                          status === 'To Do' ? 'border-gray-200 bg-gray-50 text-gray-700' :
                          status === 'In Progress' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                          status === 'Blocked' ? 'border-red-200 bg-red-50 text-red-700' :
                          'border-green-200 bg-green-50 text-green-700'
                        }`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Done">Done</option>
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {React.createElement(currentStatus.icon, { size: 18, className: currentStatus.text })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Child Features</label>
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{features.length}</span>
                    </div>
                    
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                      {isLoadingFeatures ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-300 border-t-indigo-500 rounded-full" />
                          <span className="text-xs font-medium">Syncing features...</span>
                        </div>
                      ) : features.length > 0 ? (
                        features.map((feature) => (
                          <div key={feature._id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-default">
                            <div className="flex items-center space-x-3 truncate">
                              <div className={`w-2 h-2 rounded-full ${statusConfig[feature.status].color}`} />
                              <span className="text-sm font-semibold text-gray-700 truncate">{feature.title}</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                          <Layers className="mx-auto text-gray-200 mb-2" size={32} />
                          <p className="text-xs text-gray-400 italic">No features linked yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
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
