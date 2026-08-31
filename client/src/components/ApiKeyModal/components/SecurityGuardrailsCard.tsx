import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export const SecurityGuardrailsCard: React.FC = () => {
  return (
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
  );
};
