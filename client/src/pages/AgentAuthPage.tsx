import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { agentAuthService } from '../services/agentAuthService';

type Phase = 'checking' | 'ready' | 'invalid' | 'approved' | 'denied';

const AgentAuthPage: React.FC = () => {
  const [params] = useSearchParams();
  const code = params.get('code') || '';
  const [phase, setPhase] = useState<Phase>(params.get('code') ? 'checking' : 'invalid');
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    const initial = params.get('code');
    if (!initial) return;
    agentAuthService
      .lookupCode(initial)
      .then((valid) => setPhase(valid ? 'ready' : 'invalid'))
      .catch(() => setPhase('invalid'));
  }, [params]);

  const decide = async (approve: boolean) => {
    try {
      setBusy(true);
      if (approve) await agentAuthService.approve(code);
      else await agentAuthService.deny(code);
      setPhase(approve ? 'approved' : 'denied');
    } catch {
      setPhase('invalid');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
      <Bot className="mx-auto text-indigo-600 mb-3" size={36} />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Authorize AI agent</h1>

      {phase === 'checking' && <p className="text-sm text-gray-500">Checking code...</p>}

      {phase === 'ready' && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            An agent is asking to act as you in Mjolnir for 8 hours. Confirm that this code matches the one your agent showed:
          </p>
          <div className="text-2xl font-mono font-bold tracking-widest text-gray-900 mb-4">{code}</div>
          <p className="flex items-center justify-center text-xs text-emerald-700 mb-6">
            <ShieldCheck size={14} className="mr-1" /> Limited access: read, create stories, update status. No deletes.
          </p>
          <div className="flex gap-3">
            <button
              disabled={busy}
              onClick={() => decide(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Deny
            </button>
            <button
              disabled={busy}
              onClick={() => decide(true)}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Allow
            </button>
          </div>
        </>
      )}

      {phase === 'approved' && (
        <p className="flex items-center justify-center text-emerald-700 text-sm">
          <CheckCircle2 size={18} className="mr-2" /> Approved. You can return to your agent.
        </p>
      )}
      {phase === 'denied' && (
        <p className="flex items-center justify-center text-gray-600 text-sm">
          <XCircle size={18} className="mr-2" /> Denied.
        </p>
      )}
      {phase === 'invalid' && (
        <p className="text-sm text-red-600">This code is invalid or expired. Ask your agent to start a new login.</p>
      )}
    </div>
  );
};

export default AgentAuthPage;
