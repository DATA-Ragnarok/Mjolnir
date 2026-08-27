import React, { useState } from 'react';
import api from '../services/api';
import { Copy, CheckCircle } from 'lucide-react';

interface GenerateKeyModalProps {
  onSuccess: () => void;
}

interface GenerateKeyResponse {
  apiKey: string;
  prefix: string;
  name: string;
  id: string;
}

const GenerateKeyModal: React.FC<GenerateKeyModalProps> = ({ onSuccess }) => {
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<GenerateKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setError('Key name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/keys', {
        name: keyName.trim(),
        scopes: ['read:tasks', 'write:tasks', 'read:features'],
      });
      setGeneratedKey(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (generatedKey?.apiKey) {
      await navigator.clipboard.writeText(generatedKey.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (generatedKey) {
      onSuccess();
    }
  };

  if (generatedKey) {
    return (
      <div className="p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">API Key Generated</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-2">
                ⚠️ Copy this key now. You will not be able to view it again.
              </p>
              <p className="text-sm text-blue-800">
                Store it securely in your password manager or configuration file.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={generatedKey.apiKey}
              className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm cursor-pointer"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <p className="text-gray-900">{generatedKey.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefix (for reference)
            </label>
            <p className="text-gray-900 font-mono">{generatedKey.prefix}</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Generate New API Key</h3>

      <form onSubmit={handleGenerate}>
        <div className="mb-6">
          <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
            Key Name
          </label>
          <input
            id="keyName"
            type="text"
            placeholder="e.g., Cursor MCP, Local Agent, CI/CD"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-600">
            Choose a descriptive name to remember where this key is used
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700 font-medium mb-2">Default Scopes</p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" />
              read:tasks
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" />
              write:tasks
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" />
              read:features
            </li>
          </ul>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !keyName.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Generating...' : 'Generate Key'}
        </button>
      </form>
    </div>
  );
};

export default GenerateKeyModal;
