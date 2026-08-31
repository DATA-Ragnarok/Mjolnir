import React, { useState } from 'react';
import { Key, Copy, Check, RefreshCw, Sparkles, Eye, EyeOff, Clock } from 'lucide-react';
import { ApiKeyInfo } from '../../../types';

type ApiKeyCardProps = {
  apiKeyInfo: ApiKeyInfo | null;
  generating: boolean;
  onGenerateKey: () => Promise<void>;
};

export const ApiKeyCard: React.FC<ApiKeyCardProps> = ({
  apiKeyInfo,
  generating,
  onGenerateKey
}) => {
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState<boolean>(false);

  const handleCopyKey = () => {
    if (!apiKeyInfo?.key) return;
    navigator.clipboard.writeText(apiKeyInfo.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConfirmRegenerate = async () => {
    setShowConfirmRegenerate(false);
    await onGenerateKey();
    setShowKey(true);
  };

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Key size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Personal Live Key</h3>
            <p className="text-xs text-gray-400">Scoped to your approved user account</p>
          </div>
        </div>
        {apiKeyInfo ? (
          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[11px] font-semibold">
            Active
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-semibold">
            Not Generated
          </span>
        )}
      </div>

      {apiKeyInfo ? (
        <div className="space-y-3">
          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              readOnly
              value={apiKeyInfo.key}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-3 pr-20 font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-all"
            />
            <div className="absolute right-2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                onClick={handleCopyKey}
                className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50 transition"
                title="Copy API key"
              >
                {copiedKey ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Created {new Date(apiKeyInfo.createdAt).toLocaleDateString()}
            </span>
            {apiKeyInfo.lastUsedAt && (
              <span>Last used {new Date(apiKeyInfo.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>

          {showConfirmRegenerate ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs text-amber-800 font-medium">
                Regenerating will revoke your existing key. Any active agents will need the new key.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmRegenerate}
                  disabled={generating}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {generating ? 'Regenerating...' : 'Confirm Regenerate'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmRegenerate(false)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmRegenerate(true)}
              disabled={generating}
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              <span>Regenerate API Key</span>
            </button>
          )}
        </div>
      ) : (
        <div className="py-4 text-center space-y-4">
          <p className="text-xs text-gray-500">
            Generate a personal API key to allow AI assistants to interact with your Mjolnir workspace.
          </p>
          <button
            type="button"
            onClick={async () => {
              await onGenerateKey();
              setShowKey(true);
            }}
            disabled={generating}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{generating ? 'Generating Key...' : 'Generate Personal API Key'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
