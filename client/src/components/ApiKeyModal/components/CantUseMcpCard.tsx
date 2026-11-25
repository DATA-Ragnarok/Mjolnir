import React, { useCallback, useEffect, useState } from 'react';
import { Download, HelpCircle, Trash2 } from 'lucide-react';
import { agentAuthService, AgentSessionInfo } from '../../../services/agentAuthService';

type CantUseMcpCardProps = {
  backendBase: string;
};

export const CantUseMcpCard: React.FC<CantUseMcpCardProps> = ({ backendBase }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [sessions, setSessions] = useState<AgentSessionInfo[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      setSessions(await agentAuthService.listSessions());
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (open) loadSessions();
  }, [open, loadSessions]);

  const handleRevoke = async (id: string) => {
    await agentAuthService.revokeSession(id);
    await loadSessions();
  };

  return (
    <div className="mt-8 border border-gray-200 rounded-xl p-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900"
      >
        <HelpCircle size={16} className="mr-2" /> Can&apos;t use MCP?
      </button>

      {open && (
        <div className="mt-4 text-sm text-gray-700 space-y-4">
          <p>If your organization blocks external MCP servers, your agent can use Mjolnir over plain HTTP with a skill file:</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Download the skill file and add it to your agent&apos;s instructions or skills.</li>
            <li>
              Set the environment variable <code className="bg-gray-100 px-1 rounded">MJOLNIR_URL={backendBase}</code>
            </li>
            <li>Ask your agent to use the Mjolnir skill. It opens a browser for you to approve (8-hour access).</li>
          </ol>
          <a
            href={`${backendBase}/api/agent/bootstrap-skill`}
            download="mjolnir-agent-skill.md"
            className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Download size={14} className="mr-2" /> Download mjolnir-agent-skill.md
          </a>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Connected agents</h3>
            {sessions.length === 0 ? (
              <p className="text-gray-500">No active agent sessions.</p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-3 py-2">
                    <span>
                      Started {new Date(s.createdAt).toLocaleString()}
                      {s.lastUsedAt ? `, last used ${new Date(s.lastUsedAt).toLocaleString()}` : ''}
                    </span>
                    <button
                      onClick={() => handleRevoke(s.id)}
                      className="flex items-center text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={14} className="mr-1" /> Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
