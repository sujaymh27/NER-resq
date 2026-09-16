'use client';

import React from 'react';
import { useResQ } from '../lib/resqContext';
import { ShieldCheck, Truck, Compass, Radio, ArrowRight } from 'lucide-react';

export const RoleSelectionScreen: React.FC = () => {
  const { setSelectedRole } = useResQ();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto flex flex-col items-center text-center space-y-8 py-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand & Emblem */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 shadow-2xl shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900/90 rounded-[22px] flex items-center justify-center">
              <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-400" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              NER ResQ
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-medium">
              Select your role
            </p>
          </div>
        </div>

        {/* Role Selection Buttons (Exactly Three Roles) */}
        <div className="w-full space-y-3 sm:space-y-4">
          
          {/* 1. Driver Button */}
          <button
            onClick={() => setSelectedRole('driver')}
            className="w-full group p-4 sm:p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/80 shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 flex items-center justify-between text-left active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-base sm:text-lg text-white group-hover:text-emerald-300 transition-colors">
                  Driver
                </div>
                <div className="text-xs sm:text-sm text-slate-400 font-normal">
                  Open the Driver Dashboard
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 2. Field Officer / Volunteer Button */}
          <button
            onClick={() => setSelectedRole('field_officer')}
            className="w-full group p-4 sm:p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/80 shadow-lg hover:shadow-blue-500/10 transition-all duration-200 flex items-center justify-between text-left active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-base sm:text-lg text-white group-hover:text-blue-300 transition-colors">
                  Field Officer / Volunteer
                </div>
                <div className="text-xs sm:text-sm text-slate-400 font-normal">
                  Open the Field Officer / Volunteer Dashboard
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 3. District Officer Button */}
          <button
            onClick={() => setSelectedRole('district_officer')}
            className="w-full group p-4 sm:p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/80 shadow-lg hover:shadow-purple-500/10 transition-all duration-200 flex items-center justify-between text-left active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-base sm:text-lg text-white group-hover:text-purple-300 transition-colors">
                  District Officer
                </div>
                <div className="text-xs sm:text-sm text-slate-400 font-normal">
                  Open the District Officer Dashboard
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

        </div>

        {/* 2-Tab Multi-Screen Live Sync Helper */}
        <div className="w-full bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-left space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Multi-Tab Live Interconnection (Side-by-Side)
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              BroadcastChannel + SQLite
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Open Tab 1 as <b>Driver</b> and Tab 2 as <b>District Officer</b>. When the Driver requests assistance or when the District Officer sends Route B bypass, both tabs communicate in real-time!
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="/?role=driver"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>🚗 Open Tab 1: Driver</span>
              <span className="text-[10px] text-slate-400">↗</span>
            </a>
            <a
              href="/?role=district_officer"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>🏢 Open Tab 2: DEOC</span>
              <span className="text-[10px] text-slate-400">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

