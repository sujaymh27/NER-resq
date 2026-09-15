'use client';

import React, { useState } from 'react';
import { useResQ } from '../lib/resqContext';
import {
  AlertTriangle,
  WifiOff,
  Navigation2,
  Clock,
  GitCompare,
  Truck,
  Image,
  BellOff,
  ShieldAlert,
  Copy,
  HelpCircle,
  X,
  Play
} from 'lucide-react';

const EDGE_CASES = [
  {
    id: 1,
    title: '1. Offline Report',
    desc: 'Simulates network loss in gorge; saves report to local SQLite queue.',
    icon: WifiOff,
    badge: 'Offline Mode'
  },
  {
    id: 2,
    title: '2. GPS with Low Accuracy (±150m)',
    desc: 'Canyon multipath degrades GPS; activates manual checkpoint fallback.',
    icon: Navigation2,
    badge: 'Fallback Checkpoint'
  },
  {
    id: 3,
    title: '3. Stale Road Data (>2h Old)',
    desc: 'Telemetry loss at Mylliem AWS marks segment grey ("Unknown / Stale").',
    icon: Clock,
    badge: 'Stale Warning'
  },
  {
    id: 4,
    title: '4. Conflicting Report vs AI',
    desc: 'Field report states "Open" while AI predicts "High Risk Rain". Retained for human review.',
    icon: GitCompare,
    badge: 'Human Review Flag'
  },
  {
    id: 5,
    title: '5. Truck Blocked, Motorcycle Open',
    desc: 'Landslide shoulder slip closes 2-lane truck path; 1.5m motorcycle path open.',
    icon: Truck,
    badge: 'Vehicle Constraint'
  },
  {
    id: 6,
    title: '6. Photo Upload Pending',
    desc: 'Low bandwidth 2G: metadata uploaded immediately, photo queued in buffer.',
    icon: Image,
    badge: '2-Stage Sync'
  },
  {
    id: 7,
    title: '7. Unacknowledged Alert Timeout',
    desc: 'Driver does not acknowledge after reminder; activates high-priority audio alert & DEOC command escalation.',
    icon: BellOff,
    badge: 'DEOC Escalation'
  },
  {
    id: 8,
    title: '8. All Truck Routes Blocked',
    desc: 'Corridor impassable for trucks; triggers Safe-Hub cargo transfer protocol.',
    icon: ShieldAlert,
    badge: 'Safe-Hub Staging'
  },
  {
    id: 9,
    title: '9. Duplicate Field Reports',
    desc: 'Two reports within 15m radius identified as duplicate candidates.',
    icon: Copy,
    badge: 'Duplicate Filter'
  },
  {
    id: 10,
    title: '10. Unknown Road Segment',
    desc: 'Unmapped bypass encountered; marked unknown with mandatory officer verification.',
    icon: HelpCircle,
    badge: 'Strict Fallback'
  }
];

interface EdgeCasesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EdgeCasesDrawer: React.FC<EdgeCasesDrawerProps> = ({ isOpen, onClose }) => {
  const { triggerEdgeCase } = useResQ();
  const [activeTriggered, setActiveTriggered] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleTrigger = (id: number) => {
    setActiveTriggered(id);
    triggerEdgeCase(id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1500] flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col font-sans text-slate-900 border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Scenario Sandbox
            </div>
            <h2 className="text-lg font-black text-white">10 Critical Edge Cases</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edge Cases List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          <div className="text-xs text-slate-500 mb-2">
            Click any edge case to inject synthetic corridor conditions and test the fallback workflow:
          </div>

          {EDGE_CASES.map((ec) => {
            const Icon = ec.icon;
            const isSelected = activeTriggered === ec.id;
            return (
              <div
                key={ec.id}
                className={`p-3.5 rounded-xl border transition flex flex-col gap-2 ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{ec.title}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                    {ec.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ec.desc}
                </p>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleTrigger(ec.id)}
                    className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Inject Scenario
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
          Demonstration protocol conforming to NER ResQ study-area rule
        </div>
      </div>
    </div>
  );
};
