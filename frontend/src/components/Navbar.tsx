'use client';

import React from 'react';
import { useResQ } from '../lib/resqContext';
import { UserRole, NetworkState } from '../types/resq';
import {
  ShieldCheck,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  Layers,
  SlidersHorizontal,
  Compass,
  Truck,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  onOpenEdgeCases: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenEdgeCases }) => {
  const {
    activeRole,
    setActiveRole,
    networkState,
    setNetworkState,
    isMobileFrame,
    setIsMobileFrame,
    currentDemoStep,
    setDemoStep
  } = useResQ();

  const roles: { id: UserRole; label: string; icon: any }[] = [
    { id: 'driver', label: '1. Driver Mobile', icon: Truck },
    { id: 'field_officer', label: '2. Field Officer App', icon: Compass },
    { id: 'district_officer', label: '3. District Dashboard', icon: Radio }
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Pilot Corridor Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-white text-base">NER ResQ</span>
              <span className="text-[10px] font-bold bg-blue-900/80 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full uppercase">
                Pilot Corridor
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Shillong → Sohra, Meghalaya, India (SH-5)
            </div>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setActiveRole(r.id);
                    if (r.id === 'driver' || r.id === 'field_officer') {
                      setIsMobileFrame(true);
                    } else {
                      setIsMobileFrame(false);
                    }
                    if (typeof window !== 'undefined') {
                      try {
                        sessionStorage.setItem('ner_resq_tab_role', r.id);
                        window.history.replaceState(null, '', `/?role=${r.id}`);
                      } catch {}
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick 2-Tabs Popups */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 text-[11px]">
            <span className="text-slate-400 font-medium">Open Tab:</span>
            <a
              href="/?role=driver"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-emerald-300 font-bold flex items-center gap-1"
              title="Open Driver Mobile screen in a separate browser tab"
            >
              🚗 Driver Tab
            </a>
            <a
              href="/?role=district_officer"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-purple-300 font-bold flex items-center gap-1"
              title="Open District Officer Dashboard in a separate browser tab"
            >
              🏢 DEOC Tab
            </a>
          </div>
        </div>


        {/* Right Tools: Frame Toggle, Network State, Edge Cases */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Mobile Frame Toggle (only active for driver/field) */}
          {(activeRole === 'driver' || activeRole === 'field_officer') && (
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
              title={isMobileFrame ? 'Switch to Full Screen View' : 'Switch to Phone Mockup View'}
            >
              {isMobileFrame ? <Monitor className="w-4 h-4 text-blue-400" /> : <Smartphone className="w-4 h-4 text-blue-400" />}
              <span className="hidden sm:inline">{isMobileFrame ? 'Phone Frame' : 'Full Screen'}</span>
            </button>
          )}

          {/* Network Simulator */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            {networkState === 'offline' ? (
              <WifiOff className="w-3.5 h-3.5 text-red-400 mr-1.5" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            )}
            <select
              value={networkState}
              onChange={(e) => setNetworkState(e.target.value as NetworkState)}
              className="bg-transparent text-[11px] font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="online" className="bg-slate-900 text-white">Online</option>
              <option value="weak_2g" className="bg-slate-900 text-white">Weak 2G</option>
              <option value="offline" className="bg-slate-900 text-white">Offline</option>
            </select>
          </div>

          {/* Edge Cases Trigger Button */}
          <button
            onClick={onOpenEdgeCases}
            className="px-2.5 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">10 Edge Cases</span>
          </button>
        </div>
      </div>
    </header>
  );
};
