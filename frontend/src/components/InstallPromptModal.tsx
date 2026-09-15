'use client';

import React, { useState } from 'react';
import { Download, Smartphone, Globe, X, Shield, ArrowRight } from 'lucide-react';

interface InstallPromptModalProps {
  onContinueInBrowser: () => void;
  onInstallApp: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  onContinueInBrowser,
  onInstallApp
}) => {
  const [installed, setInstalled] = useState(false);

  const handleInstall = () => {
    setInstalled(true);
    setTimeout(() => {
      onInstallApp();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg">
          <Shield className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Offline-First Emergency PWA
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2">
            NER ResQ Mobile
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Install on your device for offline landslide reporting, instant driver alerts, and background GPS tracking along the Shillong–Sohra corridor.
          </p>
        </div>

        {installed ? (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600 animate-bounce" />
            <span>App Installed! Launching mobile view...</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            <button
              onClick={handleInstall}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              Install App (Recommended)
            </button>

            <button
              onClick={onContinueInBrowser}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Globe className="w-4 h-4" />
              Continue in Browser
            </button>
          </div>
        )}

        <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
          Prototype Pilot Corridor • East Khasi Hills, Meghalaya
        </div>
      </div>
    </div>
  );
};
