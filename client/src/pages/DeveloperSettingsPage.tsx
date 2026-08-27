import React, { useEffect, useState } from 'react';
import { useModal } from '../hooks/useModal';
import { Key, Code2 } from 'lucide-react';
import ApiKeyTable from '../components/ApiKeyTable';
import GenerateKeyModal from '../components/GenerateKeyModal';
import MCPQuickstart from '../components/MCPQuickstart';
import api from '../services/api';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

const DeveloperSettingsPage: React.FC = () => {
  const { openModal } = useModal();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/keys');
      setApiKeys(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleGenerateKey = () => {
    openModal(
      <GenerateKeyModal onSuccess={fetchApiKeys} />,
      { maxWidth: 'md' }
    );
  };

  const handleRevokeKey = async (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      try {
        await api.delete(`/keys/${keyId}`);
        await fetchApiKeys();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to revoke API key');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Code2 className="w-10 h-10" />
            Developer Settings
          </h1>
          <p className="text-gray-600">
            Manage API keys and configure integrations with external tools
          </p>
        </div>

        {/* API Key Management Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">API Keys</h2>
            </div>
            <button
              onClick={handleGenerateKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate New Key
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-gray-600 mt-2">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No API keys yet</p>
              <button
                onClick={handleGenerateKey}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first key →
              </button>
            </div>
          ) : (
            <ApiKeyTable
              keys={apiKeys}
              onRevoke={handleRevokeKey}
            />
          )}
        </div>

        {/* MCP Quickstart Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <Code2 className="w-6 h-6 text-blue-600" />
            MCP Integration
          </h2>
          <MCPQuickstart />
        </div>
      </div>
    </div>
  );
};

export default DeveloperSettingsPage;
