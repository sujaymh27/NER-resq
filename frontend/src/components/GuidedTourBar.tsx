'use client';

import React, { useState } from 'react';
import { useResQ } from '../lib/resqContext';
import { 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles,
  Sliders,
  Play,
  Truck,
  Compass,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';

export const SCENARIO_STEPS = [
  {
    step: 1,
    title: 'Driver starts a medicine mission from Shillong to Sohra',
    product: 'Driver Mobile App',
    role: 'driver',
    actor: 'Driver Bah Daplin Nongrum',
    desc: 'Mission M-001 active: critical delivery of insulin & antibiotics departing Shillong Logistics Gate on Primary Route A.'
  },
  {
    step: 2,
    title: 'Field officer saves a landslide report offline',
    product: 'Field Officer Mobile App',
    role: 'field_officer',
    actor: 'Field Officer FO-021',
    desc: 'Network is offline in mountain gorge. Officer records critical landslide on R-004 with photo & truck-blocked tag; saved in local queue.'
  },
  {
    step: 3,
    title: 'Report synchronizes after network restoration',
    product: 'Field Officer Mobile App',
    role: 'field_officer',
    actor: 'System / FO-021',
    desc: 'Network coverage restored. Queued landslide report automatically synchronizes with central command database.'
  },
  {
    step: 4,
    title: 'AI calculates high risk',
    product: 'District Officer Web Dashboard',
    role: 'district_officer',
    actor: 'AI Risk Engine',
    desc: 'Explainable AI computes Critical Risk score (86/100) on segment R-004 factoring heavy rainfall, steep gorge, and ground report.'
  },
  {
    step: 5,
    title: 'District officer reviews the report and evidence',
    product: 'District Officer Web Dashboard',
    role: 'district_officer',
    actor: 'District Emergency Officer',
    desc: 'Duty officer opens the incoming report queue and inspects ground-truth photo evidence and field observations on R-004.'
  },
  {
    step: 6,
    title: 'District officer verifies truck blockage',
    product: 'District Officer Web Dashboard',
    role: 'district_officer',
    actor: 'District Emergency Officer',
    desc: 'Officer confirms truck lanes are buried. Status verified: Blocked for heavy trucks, open for emergency motorcycles.'
  },
  {
    step: 7,
    title: 'System selects an alternative route',
    product: 'District Officer Web Dashboard',
    role: 'district_officer',
    actor: 'Route Optimization Engine',
    desc: 'Routing engine rejects blocked Route A and selects safer Route B via Umtyngar-Laitryngew Bypass (+25 min delay).'
  },
  {
    step: 8,
    title: 'Driver receives a short alert',
    product: 'Driver Mobile App',
    role: 'driver',
    actor: 'District Emergency Officer',
    desc: 'High-visibility red alert pops up on driver in-cab screen: "ROAD BLOCKED AHEAD (2.4 KM). TAKE ROUTE B. DELAY: +25 MIN".'
  },
  {
    step: 9,
    title: 'Driver acknowledges the alert',
    product: 'Driver Mobile App',
    role: 'driver',
    actor: 'Driver Bah Daplin Nongrum',
    desc: 'Driver taps [ACKNOWLEDGE] button. Navigation trajectory re-routes onto Route B via Umtyngar Bypass.'
  },
  {
    step: 10,
    title: 'District officer sees the updated mission',
    product: 'District Officer Web Dashboard',
    role: 'district_officer',
    actor: 'District Emergency Officer',
    desc: 'Live corridor dashboard confirms driver acknowledged alert. Truck V-001 tracked advancing safely along Route B.'
  },
  {
    step: 11,
    title: 'Driver completes the medicine delivery',
    product: 'Driver Mobile App',
    role: 'driver',
    actor: 'Driver Bah Daplin Nongrum',
    desc: 'Vehicle arrives at Sohra Community Health Facility. Driver taps [DELIVERY COMPLETED]; cold-chain medicine received.'
  },
  {
    step: 12,
    title: 'Timeline records the complete process',
    product: 'District Officer Web Dashboard',
    role: 'district_officer',
    actor: 'Audit & Compliance Registry',
    desc: 'Full immutable audit log displays all 12 scenario milestones from departure to delivery with exact timestamps and roles.'
  }
];

export const GuidedTourBar: React.FC = () => {
  const { currentDemoStep, setDemoStep, nextDemoStep, prevDemoStep, resetCorridorState, networkState, backendOnline } = useResQ();
  const [expanded, setExpanded] = useState(false);

  const cur = SCENARIO_STEPS[currentDemoStep - 1] || SCENARIO_STEPS[0];

  const getProductIcon = (product: string) => {
    if (product.includes('Driver')) return <Truck className="w-3.5 h-3.5 text-emerald-400" />;
    if (product.includes('Field')) return <Compass className="w-3.5 h-3.5 text-blue-400" />;
    return <Radio className="w-3.5 h-3.5 text-purple-400" />;
  };

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 shadow-xl px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Step Indicator & Title */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs px-3 py-1.5 rounded-lg flex-shrink-0 shadow-md flex items-center gap-1.5">
            <span>SCENARIO STEP</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded font-mono">{cur.step} / 12</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                {cur.title}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                {getProductIcon(cur.product)}
                <span>{cur.product}</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[550px] mt-0.5">
              {cur.desc}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
          {/* Backend Status indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-[10px] font-semibold text-slate-300">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>API: {backendOnline ? 'FastAPI 8000' : 'Local Queue'}</span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>12 Steps</span>
          </button>

          <button
            onClick={prevDemoStep}
            disabled={currentDemoStep === 1}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-slate-200 transition"
            title="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={nextDemoStep}
            disabled={currentDemoStep === 12}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-bold text-white shadow-md transition flex items-center gap-1 active:scale-95"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={resetCorridorState}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
            title="Reset scenario to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded 12-Step Jumper Grid */}
      {expanded && (
        <div className="max-w-7xl mx-auto pt-3 mt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
          {SCENARIO_STEPS.map((s) => (
            <button
              key={s.step}
              onClick={() => {
                setDemoStep(s.step);
                setExpanded(false);
              }}
              className={`p-2 rounded-xl text-left transition border ${
                currentDemoStep === s.step
                  ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-80 mb-1">
                <span className="font-mono font-bold">STEP {s.step}</span>
                <span className="truncate">{s.product.replace(' App', '').replace(' Web Dashboard', '')}</span>
              </div>
              <div className="font-semibold text-xs truncate">{s.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
