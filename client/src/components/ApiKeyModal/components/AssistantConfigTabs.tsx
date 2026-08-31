import React, { useState } from 'react';
import { Sparkles, Code2, Terminal, Copy, Check, Info } from 'lucide-react';
import { AssistantTab, FormatMode } from '../types';

type AssistantConfigTabsProps = {
  mcpUrl: string;
  keyDisplay: string;
};

export const AssistantConfigTabs: React.FC<AssistantConfigTabsProps> = ({
  mcpUrl,
  keyDisplay
}) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>('gemini');
  const [formatMode, setFormatMode] = useState<FormatMode>('cli');
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);

  const handleCopySnippet = (key: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedConfig(key);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

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

  const currentSnippet = formatMode === 'cli' ? currentCli : currentJson;

  return (
    <div className="space-y-4">
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
            onClick={() => handleCopySnippet(`${activeTab}-${formatMode}`, currentSnippet)}
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
          <code>{currentSnippet}</code>
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
  );
};
