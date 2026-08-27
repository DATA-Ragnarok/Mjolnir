import React, { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

const MCPQuickstart: React.FC = () => {
  const [selectedHost, setSelectedHost] = useState<'Claude Desktop' | 'Cursor' | 'Windsurf'>(
    'Claude Desktop'
  );
  const [copied, setCopied] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.mjolnir.dev';

  const getConfigPath = (host: string): string => {
    // Determine the platform-specific path
    if (host === 'Claude Desktop') {
      return 'Check Claude Desktop documentation for your OS';
    }
    if (host === 'Cursor') {
      return 'Check Cursor documentation for your OS';
    }
    if (host === 'Windsurf') {
      return 'Check Windsurf documentation for your OS';
    }
    return '';
  };

  const getConfigContent = (): string => {
    const baseConfig = {
      mcpServers: {
        mjolnir: {
          command: 'npx',
          args: ['-y', '@mjolnir/mcp-server'],
          env: {
            MJOLNIR_API_KEY: 'YOUR_API_KEY_HERE',
            MJOLNIR_API_URL: apiUrl,
          },
        },
      },
    };

    return JSON.stringify(baseConfig, null, 2);
  };

  const config = getConfigContent();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Host Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Select your AI editor/IDE:
        </label>
        <div className="grid grid-cols-3 gap-4">
          {(['Claude Desktop', 'Cursor', 'Windsurf'] as const).map((host) => (
            <button
              key={host}
              onClick={() => setSelectedHost(host)}
              className={`p-4 rounded-lg border-2 transition-all text-left font-medium ${
                selectedHost === host
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              }`}
            >
              {host}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Block */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Configuration ({getConfigPath(selectedHost)})
        </label>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed max-h-96 overflow-y-auto">
            {config}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Setup Instructions:</h3>
        <ol className="space-y-3 text-sm text-blue-900 list-decimal list-inside">
          <li>
            <strong>Generate an API Key</strong> using the button above and copy it.
          </li>
          <li>
            <strong>Locate the config file</strong> for {selectedHost} (path shown above).
          </li>
          <li>
            <strong>Paste this configuration</strong> into your config file (create if it doesn't
            exist).
          </li>
          <li>
            <strong>Replace</strong> <code className="bg-blue-100 px-1 rounded">YOUR_API_KEY_HERE</code> with your actual API key.
          </li>
          <li>
            <strong>Restart</strong> {selectedHost} to activate the MCP server.
          </li>
        </ol>
      </div>

      {/* Available Tools */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Available MCP Tools:</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="font-mono text-sm text-blue-600">mjolnir_list_tasks</p>
            <p className="text-sm text-gray-600 mt-1">
              Fetch existing tasks from the Mjolnir agile board with optional status filtering
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Parameters: <code>status?</code>, <code>limit?</code>
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <p className="font-mono text-sm text-blue-600">mjolnir_create_task</p>
            <p className="text-sm text-gray-600 mt-1">
              Create a new task on the Mjolnir agile board
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Parameters: <code>title</code> (required), <code>description?</code>,{' '}
              <code>storyPoints?</code>, <code>featureId</code> (required)
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <p className="font-mono text-sm text-blue-600">mjolnir_list_features</p>
            <p className="text-sm text-gray-600 mt-1">Fetch existing features from Mjolnir</p>
            <p className="text-xs text-gray-500 mt-2">No parameters required</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPQuickstart;
