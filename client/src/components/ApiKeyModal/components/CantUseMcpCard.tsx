import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Download, HelpCircle, Trash2 } from 'lucide-react';
import { agentAuthService, AgentSessionInfo } from '../../../services/agentAuthService';

type CantUseMcpCardProps = {
  backendBase: string;
};

type SkillTarget = 'copilot' | 'gemini' | 'claude';

const SKILL_DIRS: Record<SkillTarget, { label: string; dir: string }> = {
  copilot: { label: 'GitHub Copilot', dir: '~/.copilot/skills/mjolnir' },
  gemini: { label: 'Gemini / Antigravity', dir: '~/.gemini/skills/mjolnir' },
  claude: { label: 'Claude', dir: '~/.claude/skills/mjolnir' },
};

export const CantUseMcpCard: React.FC<CantUseMcpCardProps> = ({ backendBase }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [sessions, setSessions] = useState<AgentSessionInfo[]>([]);
  const [target, setTarget] = useState<SkillTarget>('copilot');
  const [copied, setCopied] = useState<string | null>(null);

  const skillUrl = `${backendBase}/api/agent/bootstrap-skill`;
  const { dir } = SKILL_DIRS[target];
  const installCommand = `mkdir -p ${dir} && curl -fsSL ${skillUrl} -o ${dir}/SKILL.md`;
  const agentPrompt = `Install the Mjolnir skill: download ${skillUrl} and save it as SKILL.md inside a "mjolnir" folder in your personal skills directory (for example ${dir}/SKILL.md). Then use it to show my Mjolnir tasks.`;

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

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton: React.FC<{ id: string; text: string }> = ({ id, text }) => (
    <button
      onClick={() => handleCopy(id, text)}
      className="shrink-0 flex items-center text-xs text-indigo-700 hover:text-indigo-900"
    >
      {copied === id ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
      {copied === id ? 'Copied' : 'Copy'}
    </button>
  );

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
          <p>
            If your organization blocks external MCP servers, your agent can use Mjolnir over plain HTTP. Install the skill
            once; every new session loads it automatically. You approve in the browser about once every 8 hours.
          </p>

          <div className="flex gap-2">
            {(Object.keys(SKILL_DIRS) as SkillTarget[]).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`px-3 py-1 rounded-lg border text-xs ${
                  target === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'
                }`}
              >
                {SKILL_DIRS[t].label}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-900">1. Run this once in a terminal</span>
              <CopyButton id="cmd" text={installCommand} />
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
              {installCommand}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-900">Or paste this to your agent and let it install itself</span>
              <CopyButton id="prompt" text={agentPrompt} />
            </div>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs whitespace-pre-wrap">{agentPrompt}</pre>
          </div>

          <a
            href={skillUrl}
            download="SKILL.md"
            className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download size={14} className="mr-2" /> Download SKILL.md manually
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
