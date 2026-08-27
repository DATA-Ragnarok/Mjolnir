import React, { useState } from 'react';
import { Copy, CheckCircle, ExternalLink, Terminal, Globe, Code, Sparkles, Cpu } from 'lucide-react';

type HostPlatform =
  | 'Gemini Web (Custom Gem)'
  | 'Claude Web (Custom Connector)'
  | 'Claude Desktop & Code'
  | 'Gemini CLI / REST API'
  | 'Cursor & Windsurf';

const MCPQuickstart: React.FC = () => {
  const [selectedHost, setSelectedHost] = useState<HostPlatform>('Gemini Web (Custom Gem)');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://api.mjolnir.dev').replace(/\/+$/, '');
  const mcpSseUrl = `${rawApiUrl}/mcp/sse`;
  const openApiJsonUrl = `${rawApiUrl}/openapi.json`;
  const openApiYamlUrl = `${rawApiUrl}/openapi.yaml`;

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        mjolnir: {
          command: 'npx',
          args: ['-y', '@mjolnir/mcp-server'],
          env: {
            MJOLNIR_API_KEY: 'YOUR_API_KEY_HERE',
            MJOLNIR_API_URL: rawApiUrl,
          },
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        mjolnir: {
          command: 'npx',
          args: ['-y', '@mjolnir/mcp-server'],
          env: {
            MJOLNIR_API_KEY: 'YOUR_API_KEY_HERE',
            MJOLNIR_API_URL: rawApiUrl,
          },
        },
      },
    },
    null,
    2
  );

  const curlExample = `# 1. List Epics
curl -X GET "${rawApiUrl}/agent/tasks/epic" \\
  -H "x-api-key: YOUR_API_KEY_HERE"

# 2. List Features
curl -X GET "${rawApiUrl}/agent/tasks/feature" \\
  -H "x-api-key: YOUR_API_KEY_HERE"

# 3. List User Stories / Tasks
curl -X GET "${rawApiUrl}/agent/tasks/us?status=In%20Progress" \\
  -H "x-api-key: YOUR_API_KEY_HERE"

# 4. Create a Task (User Story)
curl -X POST "${rawApiUrl}/agent/tasks/us" \\
  -H "x-api-key: YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Build AI Agent Integration",
    "featureId": "<FEATURE_ID>",
    "storyPoints": 5,
    "description": "Connect Gemini and Claude to Mjolnir board."
  }'

# 5. Update Task Status (Cascades activation to parent/epic)
curl -X PATCH "${rawApiUrl}/agent/tasks/us/<TASK_ID>/status" \\
  -H "x-api-key: YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "In Progress" }'`;

  const geminiPromptExample = `You are an agile project manager connected to Mjolnir board.
Use your Mjolnir tools to:
- List epics with listEpics
- List features with listFeatures
- Query and filter user stories with listTasks
- Create user stories for active sprints with createTask
- Update task status (To Do, In Progress, Blocked, Waiting for MR, Done) with updateTaskStatus`;

  return (
    <div className="space-y-8">
      {/* Host Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Choose your AI platform or client:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(
            [
              { id: 'Gemini Web (Custom Gem)', label: 'Gemini Web', icon: Sparkles, badge: 'Custom Gem' },
              { id: 'Claude Web (Custom Connector)', label: 'Claude Web', icon: Globe, badge: 'Connector' },
              { id: 'Claude Desktop & Code', label: 'Claude Desktop', icon: Cpu, badge: 'MCP stdio' },
              { id: 'Gemini CLI / REST API', label: 'Gemini CLI / REST', icon: Terminal, badge: 'cURL / SDK' },
              { id: 'Cursor & Windsurf', label: 'Cursor / Windsurf', icon: Code, badge: 'IDE MCP' },
            ] as const
          ).map((host) => {
            const Icon = host.icon;
            const isSelected = selectedHost === host.id;
            return (
              <button
                key={host.id}
                onClick={() => setSelectedHost(host.id as HostPlatform)}
                className={`p-3 rounded-lg border-2 transition-all text-left font-medium flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-semibold">{host.label}</span>
                </div>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded w-fit ${
                    isSelected ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {host.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PLATFORM 1: GEMINI WEB */}
      {selectedHost === 'Gemini Web (Custom Gem)' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Gemini Web Integration (Connected App & Custom Gem)
            </h3>
            <p className="text-sm text-blue-900 mb-4 leading-relaxed">
              Google Gemini connects to Mjolnir via <strong>Custom Connected App (Remote MCP)</strong> or <strong>Custom Gems (OpenAPI)</strong>.
            </p>

            <div className="space-y-4">
              {/* Option A: Custom Connected App (MCP URL) */}
              <div className="bg-white/80 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    ⚡ Remote MCP Server URL (For "Custom connected app"):
                  </label>
                  <span className="text-[11px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-medium">
                    Recommended for Connected Apps
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Paste this URL into Gemini's <em>"Add a custom app link"</em> field:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={mcpSseUrl}
                    className="flex-1 bg-white border border-blue-300 text-blue-950 px-3 py-2 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(mcpSseUrl, 'gemini-mcp-url')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'gemini-mcp-url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedKey === 'gemini-mcp-url' ? 'Copied' : 'Copy MCP URL'}
                  </button>
                </div>
              </div>

              {/* Option B: OpenAPI URL */}
              <div className="bg-white/80 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                    📄 OpenAPI 3.0 Specification URL (For Custom Gems & Actions):
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={openApiJsonUrl}
                    className="flex-1 bg-white border border-blue-300 text-blue-950 px-3 py-2 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(openApiJsonUrl, 'gemini-url')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'gemini-url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedKey === 'gemini-url' ? 'Copied' : 'Copy URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">How to Connect to Gemini:</h4>
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-3">
                <p className="text-sm font-bold text-gray-900">Method 1: Custom Connected App (Settings → Connected Apps)</p>
                <ol className="mt-1 space-y-1 text-sm text-gray-600 list-decimal list-inside">
                  <li>In Gemini, go to <strong>Settings → Connected Apps → Add custom connected app</strong>.</li>
                  <li>In the <strong>"Add a custom app link"</strong> input, paste: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono text-xs">{mcpSseUrl}</code>.</li>
                  <li>Click <strong>Next / Save</strong>. Gemini will connect to Mjolnir's live MCP Server!</li>
                </ol>
              </div>

              <div className="border-l-4 border-blue-500 pl-3">
                <p className="text-sm font-bold text-gray-900">Method 2: Custom Gem (Gem Manager)</p>
                <ol className="mt-1 space-y-1 text-sm text-gray-600 list-decimal list-inside">
                  <li>Open <strong>Gem Manager → New Gem</strong> and name it (e.g. <em>"Mjolnir Assistant"</em>).</li>
                  <li>Under <strong>Custom Actions / Tools</strong>, paste the <strong>OpenAPI URL</strong> above.</li>
                  <li>Set Auth Header: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono text-xs">x-api-key: YOUR_API_KEY</code> and save.</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Recommended Instructions for Gemini Gem:
              </label>
              <button
                onClick={() => copyToClipboard(geminiPromptExample, 'gemini-prompt')}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                {copiedKey === 'gemini-prompt' ? 'Copied Prompt!' : 'Copy Instructions'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap">
              {geminiPromptExample}
            </pre>
          </div>
        </div>
      )}

      {/* PLATFORM 2: CLAUDE WEB */}
      {selectedHost === 'Claude Web (Custom Connector)' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-amber-950 flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-amber-600" />
              Claude Web (Projects & Custom Connectors) Setup
            </h3>
            <p className="text-sm text-amber-900 mb-4 leading-relaxed">
              Connect Claude Web (Claude Enterprise, Projects, or Custom Connectors) using Mjolnir's OpenAPI 3.0 specification.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">
                  OpenAPI Spec URL (JSON):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={openApiJsonUrl}
                    className="flex-1 bg-white border border-amber-300 text-amber-950 px-3 py-2 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(openApiJsonUrl, 'claude-web-url')}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'claude-web-url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedKey === 'claude-web-url' ? 'Copied' : 'Copy URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Setup in Claude Web:</h4>
            <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
              <li>
                Open your <strong>Claude Project</strong> or <strong>Custom Tools settings</strong>.
              </li>
              <li>
                Select <strong>Add Custom Tool / Integration</strong> and choose <strong>Import OpenAPI</strong>.
              </li>
              <li>
                Paste the OpenAPI URL: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{openApiJsonUrl}</code>.
              </li>
              <li>
                Set Auth Header: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">x-api-key: YOUR_API_KEY</code> or Bearer token.
              </li>
              <li>
                Claude will automatically discover <code className="text-indigo-600 font-mono">listEpics</code>, <code className="text-indigo-600 font-mono">listFeatures</code>, <code className="text-indigo-600 font-mono">listTasks</code>, <code className="text-indigo-600 font-mono">createTask</code>, and <code className="text-indigo-600 font-mono">updateTaskStatus</code>.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* PLATFORM 3: CLAUDE DESKTOP & CODE */}
      {selectedHost === 'Claude Desktop & Code' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                Claude Desktop Configuration (<code className="text-xs bg-gray-100 px-1 rounded">claude_desktop_config.json</code>)
              </h4>
              <button
                onClick={() => copyToClipboard(claudeDesktopConfig, 'claude-desktop')}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium flex items-center gap-1.5"
              >
                {copiedKey === 'claude-desktop' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'claude-desktop' ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {claudeDesktopConfig}
            </pre>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              Claude Code CLI Setup
            </h4>
            <p className="text-sm text-indigo-800 mb-3">
              You can also register Mjolnir directly with Claude Code CLI:
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
{`claude mcp add mjolnir npx -y @mjolnir/mcp-server --env MJOLNIR_API_KEY="YOUR_KEY" --env MJOLNIR_API_URL="${rawApiUrl}"`}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(
                    `claude mcp add mjolnir npx -y @mjolnir/mcp-server --env MJOLNIR_API_KEY="YOUR_KEY" --env MJOLNIR_API_URL="${rawApiUrl}"`,
                    'claude-cli'
                  )
                }
                className="absolute top-2 right-2 px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
              >
                {copiedKey === 'claude-cli' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM 4: GEMINI CLI / REST API */}
      {selectedHost === 'Gemini CLI / REST API' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Direct cURL Examples (for CLIs & Scripts)</h4>
              <button
                onClick={() => copyToClipboard(curlExample, 'curl-examples')}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium flex items-center gap-1.5"
              >
                {copiedKey === 'curl-examples' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'curl-examples' ? 'Copied' : 'Copy cURL'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed max-h-96 overflow-y-auto">
              {curlExample}
            </pre>
          </div>
        </div>
      )}

      {/* PLATFORM 5: CURSOR & WINDSURF */}
      {selectedHost === 'Cursor & Windsurf' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Cursor & Windsurf MCP Config</h4>
              <button
                onClick={() => copyToClipboard(cursorConfig, 'cursor-config')}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium flex items-center gap-1.5"
              >
                {copiedKey === 'cursor-config' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'cursor-config' ? 'Copied' : 'Copy Config'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {cursorConfig}
            </pre>
            <p className="text-xs text-gray-500 mt-3">
              Save in <code className="bg-gray-100 px-1 rounded">~/.cursor/mcp.json</code> or <code className="bg-gray-100 px-1 rounded">~/.codeium/windsurf/mcp_config.json</code>.
            </p>
          </div>
        </div>
      )}

      {/* Available Tools Summary */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Complete Tool & Action Inventory (5 Operations):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-3">
            <p className="font-mono text-xs font-bold text-indigo-700">mjolnir_list_epics</p>
            <p className="text-xs text-gray-600 mt-0.5">Fetch all epics and statuses</p>
            <span className="text-[10px] text-gray-400 font-mono">GET /agent/tasks/epic</span>
          </div>

          <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-3">
            <p className="font-mono text-xs font-bold text-indigo-700">mjolnir_list_features</p>
            <p className="text-xs text-gray-600 mt-0.5">Fetch all features on the board</p>
            <span className="text-[10px] text-gray-400 font-mono">GET /agent/tasks/feature</span>
          </div>

          <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-3">
            <p className="font-mono text-xs font-bold text-indigo-700">mjolnir_list_tasks</p>
            <p className="text-xs text-gray-600 mt-0.5">Query tasks (status, limit, sortBy)</p>
            <span className="text-[10px] text-gray-400 font-mono">GET /agent/tasks/us</span>
          </div>

          <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-3">
            <p className="font-mono text-xs font-bold text-indigo-700">mjolnir_create_task</p>
            <p className="text-xs text-gray-600 mt-0.5">Create user story (title, featureId, points)</p>
            <span className="text-[10px] text-gray-400 font-mono">POST /agent/tasks/us</span>
          </div>

          <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-3">
            <p className="font-mono text-xs font-bold text-indigo-700">mjolnir_update_task_status</p>
            <p className="text-xs text-gray-600 mt-0.5">Update status with cascade inheritance</p>
            <span className="text-[10px] text-gray-400 font-mono">PATCH /agent/tasks/us/:id/status</span>
          </div>

          <div className="border border-gray-200 bg-indigo-50/40 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <p className="font-mono text-xs font-bold text-indigo-900">OpenAPI 3.0 Schemas</p>
              <p className="text-xs text-indigo-700 mt-0.5">Interactive JSON & YAML endpoints</p>
            </div>
            <div className="flex gap-2 mt-2">
              <a
                href={openApiJsonUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-mono"
              >
                openapi.json <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={openApiYamlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-mono"
              >
                openapi.yaml <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPQuickstart;
