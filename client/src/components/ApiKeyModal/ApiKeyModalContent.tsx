import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiKeyService } from '../../services/apiKeyService';
import { ApiKeyInfo } from '../../types';
import { useModal } from '../../hooks/useModal';
import { ApiKeyCard } from './components/ApiKeyCard';
import { SecurityGuardrailsCard } from './components/SecurityGuardrailsCard';
import { AssistantConfigTabs } from './components/AssistantConfigTabs';

export const ApiKeyModalContent: React.FC = () => {
  const { setOptions } = useModal();
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOptions({ ribbonColor: 'bg-indigo-600' });
  }, [setOptions]);

  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
    .replace(/\/api\/?$/, '');
  const mcpUrl = `${backendBase}/api/mcp/sse`;

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiKeyService.getApiKey();
      setApiKeyInfo(data);
    } catch (err: unknown) {
      console.error('Failed to load API key:', err);
      const msg = err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.message
        ? (err as any).response.data.message
        : 'Failed to load API key';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setGenerating(true);
      setError(null);
      const data = await apiKeyService.generateApiKey();
      setApiKeyInfo(data);
    } catch (err: unknown) {
      console.error('Failed to generate API key:', err);
      const msg = err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.message
        ? (err as any).response.data.message
        : 'Failed to generate API key. Please check your permissions.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const keyDisplay = apiKeyInfo?.key || 'mj_live_YOUR_PERSONAL_API_KEY';

  return (
    <div className="relative">
      <div className="px-8 pb-8 pt-2">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">
              AI Integration & Protocol
            </span>
            <span className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck size={13} className="mr-1" /> PoLP Enforced
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>AI Agent Integration</span>
                <span className="text-sm font-normal text-gray-400">/ MCP Gateway</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Zero-publish connection for Google Gemini CLI, Antigravity, GitHub Copilot, and Claude Desktop.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center text-gray-500">
            <RefreshCw className="animate-spin mb-3 text-indigo-600" size={28} />
            <span className="text-sm font-medium">Loading API key settings...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <ApiKeyCard
                apiKeyInfo={apiKeyInfo}
                generating={generating}
                onGenerateKey={handleGenerateKey}
              />
              <SecurityGuardrailsCard />
            </div>

            <div className="lg:col-span-7">
              <AssistantConfigTabs
                mcpUrl={mcpUrl}
                keyDisplay={keyDisplay}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeyModalContent;
