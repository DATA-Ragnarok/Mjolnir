import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFeatures } from '../hooks/useFeatures';
import { useEpics } from '../hooks/useEpics';
import { useModal } from '../hooks/useModal';
import FeatureCard from '../components/FeatureCard';
import FeatureModalContent from '../components/FeatureModal/FeatureModalContent';
import CollapsibleSection from '../components/CollapsibleSection';
import { FeatureWithProgress } from '../types';
import { Coffee, Plus, Filter, Layout } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ProgressBar from '../components/ProgressBar';

const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const { featureId } = useParams<{ featureId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const epicIdFilter = searchParams.get('epicId') || undefined;

  const { openModal, closeModal, isOpen: isModalOpen } = useModal();
  const { features, loading: loadingFeatures, error: featureError, refetch: refetchFeatures } = useFeatures(epicIdFilter);
  const { epics } = useEpics();
  const lastOpenedId = useRef<string | undefined>(undefined);

  const selectedEpic = useMemo(() => 
    epics.find(e => e._id === epicIdFilter),
    [epics, epicIdFilter]
  );

  useEffect(() => {
    if (featureId && features.length > 0 && featureId !== lastOpenedId.current) {
      const feature = featureId === 'new' ? undefined : features.find(f => f._id === featureId);
      
      if (feature || featureId === 'new') {
        lastOpenedId.current = featureId;
        openModal(
          <FeatureModalContent 
            feature={feature}
            onSubmit={() => refetchFeatures()}
            initialEpicId={epicIdFilter}
          />,
          { 
            maxWidth: '6xl',
            onClose: () => {
              lastOpenedId.current = undefined;
              navigate(`/features${epicIdFilter ? `?epicId=${epicIdFilter}` : ''}`);
            }
          }
        );
      } else if (!loadingFeatures) {
        navigate('/features', { replace: true });
      }
    } else if (!featureId && isModalOpen) {
      closeModal();
      lastOpenedId.current = undefined;
    }
  }, [featureId, features, loadingFeatures, navigate, openModal, closeModal, isModalOpen, refetchFeatures, epicIdFilter]);

  const handleCreateClick = () => {
    navigate(`/features/new${epicIdFilter ? `?epicId=${epicIdFilter}` : ''}`);
  };

  const handleFeatureClick = (feature: FeatureWithProgress) => {
    navigate(`/features/${feature._id}${epicIdFilter ? `?epicId=${epicIdFilter}` : ''}`);
  };

  const handleEpicFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      searchParams.delete('epicId');
    } else {
      searchParams.set('epicId', value);
    }
    setSearchParams(searchParams);
  };

  if (loadingFeatures && features.length === 0 && !epicIdFilter) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const blockedFeatures = features.filter((f) => f.status === 'Blocked');
  const inProgressFeatures = features.filter((f) => f.status === 'In Progress');
  const toDoFeatures = features.filter((f) => f.status === 'To Do');
  const doneFeatures = features.filter((f) => f.status === 'Done');

  const renderSection = (title: string, filteredFeatures: FeatureWithProgress[]) => (
    <CollapsibleSection title={title} count={filteredFeatures.length}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => (
          <FeatureCard 
            key={feature._id} 
            feature={feature} 
            onClick={handleFeatureClick} 
            hideEpicTag={!!epicIdFilter}
          />
        ))}
        {filteredFeatures.length === 0 && (
          <div className="col-span-full py-10 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:bg-gray-50">
            <Coffee className="text-gray-300 mb-3" size={32} />
            <p className="text-gray-400 text-sm font-medium">All clear in {title}</p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Features</h2>
          <p className="text-gray-500 mt-1">Break down epics into manageable chunks of work.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Filter size={16} />
            </div>
            <select
              value={epicIdFilter || 'all'}
              onChange={handleEpicFilterChange}
              className="pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Epics</option>
              {epics.map((epic) => (
                <option key={epic._id} value={epic._id}>{epic.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateClick}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="-ml-1 mr-2" size={18} />
            Create Feature
          </button>
        </div>
      </div>

      {/* Epic Context Bar */}
      {selectedEpic && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Layout size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-gray-900">{selectedEpic.title}</h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] uppercase font-bold tracking-widest border border-gray-200">
                  {selectedEpic.status}
                </span>
              </div>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Parent Epic Context</p>
            </div>
          </div>
          <div className="flex-grow max-w-md">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Progress</span>
              <span className="text-xs font-black text-indigo-600">{Math.round((selectedEpic.completedStoryPoints / selectedEpic.totalStoryPoints) * 100) || 0}%</span>
            </div>
            <ProgressBar 
              current={selectedEpic.completedStoryPoints} 
              total={selectedEpic.totalStoryPoints} 
              className="h-2 bg-gray-100"
              indicatorClassName="bg-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Status Board */}
      <div className="space-y-4">
        {features.length > 0 ? (
          <>
            {renderSection('Blocked', blockedFeatures)}
            {renderSection('In Progress', inProgressFeatures)}
            {renderSection('To Do', toDoFeatures)}
            {renderSection('Done', doneFeatures)}
          </>
        ) : !loadingFeatures && !featureError && (
          <EmptyState
            icon={<Layout size={48} />}
            title={epicIdFilter ? "No features in this Epic" : "No features found"}
            description={epicIdFilter 
              ? "This epic hasn't been broken down into features yet. Start by creating the first architectural chunk."
              : "Features represent major functional components of your project. Create your first feature to start planning user stories."
            }
            actionText="Create your first Feature"
            onAction={handleCreateClick}
          />
        )}
      </div>
    </div>
  );
};

export default FeaturesPage;
