'use client';

import React from 'react';
import { useResQ } from '../lib/resqContext';
import { Clock, ShieldCheck, CheckCircle2, User, Database, X } from 'lucide-react';

interface DecisionTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionTimelineModal: React.FC<DecisionTimelineModalProps> = ({ isOpen, onClose }) => {
  const { decisionEvents } = useResQ();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1800] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col font-sans text-slate-900 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Immutable Audit Trail (decision_events.csv)
              </div>
              <h2 className="text-lg font-black text-white">Corridor Decision History</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Events List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="text-xs text-slate-500 mb-2">
            Chronological log of AI evaluations, ground-truth field reports, officer overrides, and driver acknowledgements for Mission <b>M-001</b>:
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
            {decisionEvents.map((evt, idx) => (
              <div key={evt.event_id} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center"></div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900 uppercase">{evt.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{evt.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {evt.event_description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Actor: <b className="text-slate-700 capitalize">{evt.actor_role.replace('_', ' ')}</b></span>
                    <span className="font-mono text-slate-400">{evt.event_id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Data Provenance: <b>officer_verified_demo / synthetic_demo</b></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
