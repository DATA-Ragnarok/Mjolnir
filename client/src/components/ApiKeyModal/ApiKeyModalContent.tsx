import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Terminal, 
  Code2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Clock, 
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { apiKeyService } from '../../services/apiKeyService';
import { ApiKeyInfo } from '../../types';
import { useModal } from '../../hooks/useModal';

export const ApiKeyModalContent: React.FC = () => {
  const { setOptions } = useModal();
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gemini' | 'copilot' | 'claude'>('gemini');
  const [formatMode, setFormatMode] = useState<'cli' | 'json'>('cli');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState<boolean>(false);

  // Set the ribbon color at the top of the modal
  useEffect(() => {
    setOptions({ ribbonColor: 'bg-indigo-600' });
  }, [setOptions]);

  // Compute the MCP SSE endpoint URL
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
    } catch (err: any) {
      console.error('Failed to load API key:', err);
      setError(err?.response?.data?.message || 'Failed to load API key');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setGenerating(true);
      setError(null);
      setShowConfirmRegenerate(false);
      const data = await apiKeyService.generateApiKey();
      setApiKeyInfo(data);
      setShowKey(true);
    } catch (err: any) {
      console.error('Failed to generate API key:', err);
      setError(err?.response?.data?.message || 'Failed to generate API key. Please check your permissions.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKeyInfo?.key) return;
    navigator.clipboard.writeText(apiKeyInfo.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopySnippet = (key: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedConfig(key);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  const keyDisplay = apiKeyInfo?.key || 'mj_live_YOUR_PERSONAL_API_KEY';

  // CLI Commands
  const geminiCli = `gemini mcp add --transport sse mjolnir "${mcpUrl}?apiKey=${keyDisplay}"`;
  const copilotCli = `copilot mcp add mjolnir "${mcpUrl}" --header "x-api-key: ${keyDisplay}"`;
  const claudeCli = `claude mcp add mjolnir "${mcpUrl}" --header "x-api-key: ${keyDisplay}"`;

  const geminiConfig = JSON.stringify(
    {
      mcpServers: {
        mjolnir: {
          url: mcpUrl,
          headers: {
            'x-api-key': keyDisplay
          }
        }
      }
    },
    null,
    2
  );

  const copilotConfig = JSON.stringify(
    {
      'github.copilot.chat.mcpServers': {
        mjolnir: {
          url: mcpUrl,
          headers: {
            'x-api-key': keyDisplay
          }
        }
      }
    },
    null,
    2
  );

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        mjolnir: {
          url: mcpUrl,
          headers: {
            'x-api-key': keyDisplay
          }
        }
      }
    },
    null,
    2
  );

  const currentCli =
    activeTab === 'gemini'
      ? geminiCli
      : activeTab === 'copilot'
      ? copilotCli
      : claudeCli;

  const currentJson = 
    activeTab === 'gemini' 
      ? geminiConfig 
      : activeTab === 'copilot' 
      ? copilotConfig 
      : claudeConfig;

  const currentFilePath = 
    activeTab === 'gemini' 
      ? '~/.gemini/settings.json' 
      : activeTab === 'copilot' 
      ? '.vscode/settings.json' 
      : 'claude_desktop_config.json';

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
            {/* Left Column: Key Management & PoLP Rules (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* API Key Card */}
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
                            onClick={handleGenerateKey}
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
                      onClick={handleGenerateKey}
                      disabled={generating}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      <span>{generating ? 'Generating Key...' : 'Generate Personal API Key'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Least Privilege PoLP Summary Card */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-indigo-600" />
                  <span>Security & PoLP Guardrails</span>
                </h4>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Read access:</strong> Epics, Features, Sprints, Team, & Stories.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Create stories:</strong> Mandatory story points & feature binding.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Update status:</strong> Triggers Status Inheritance automatically.</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-400">
                    <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                    <span><strong>Blocked:</strong> Deleting tasks, editing points/titles, modifying epics/sprints.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Zero-Publish Configuration Tabs (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-gray-200 pb-3 gap-2">
                <div className="flex space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('gemini')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                      activeTab === 'gemini'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Sparkles size={14} />
                    <span>Google Gemini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('copilot')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                      activeTab === 'copilot'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Code2 size={14} />
                    <span>VS Code Copilot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('claude')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                      activeTab === 'claude'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Terminal size={14} />
                    <span>Claude Desktop</span>
                  </button>
                </div>

                {/* Format Toggle */}
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormatMode('cli')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      formatMode === 'cli'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    CLI Command
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatMode('json')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      formatMode === 'json'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    JSON Config
                  </button>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-800">
                <div className="flex justify-between items-center px-4 py-2.5 bg-gray-950/60 border-b border-gray-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                    <span className="text-[11px] font-mono text-gray-400 ml-2">
                      {formatMode === 'cli' ? 'Terminal One-Liner' : currentFilePath}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet(
                      `${activeTab}-${formatMode}`,
                      formatMode === 'cli' ? currentCli : currentJson
                    )}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-sans text-xs font-semibold transition"
                  >
                    {copiedConfig === `${activeTab}-${formatMode}` ? (
                      <>
                        <Check size={13} className="text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>{formatMode === 'cli' ? 'Copy Command' : 'Copy Config'}</span>
                      </>
                    )}
                  </button>
                </div>
                
                <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed max-h-[280px]">
                  <code>{formatMode === 'cli' ? currentCli : currentJson}</code>
                </pre>
              </div>

              {/* Quick Setup Hint */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
                <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-1">
                  <p className="font-semibold">Quick Setup Tip:</p>
                  <p className="text-indigo-800/90 leading-relaxed">
                    {formatMode === 'cli' ? (
                      <>Run the command above in your terminal. It will automatically add the Mjolnir MCP connection to your client profile.</>
                    ) : (
                      <>Paste the snippet into your settings file. Once configured, your AI assistant will automatically discover the 9 least-privileged Mjolnir tools over the live Server-Sent Events stream.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeyModalContent;
