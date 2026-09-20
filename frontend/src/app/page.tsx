'use client';

import React, { useState } from 'react';
import { ResQProvider, useResQ } from '../lib/resqContext';
import { RoleSelectionScreen } from '../components/RoleSelectionScreen';
import { DriverMobileView } from '../components/DriverMobileView';
import { FieldOfficerMobileView } from '../components/FieldOfficerMobileView';
import { DistrictOfficerView } from '../components/DistrictOfficerView';

function ResQMainApp() {
  const {
    selectedRole,
    isMobileFrame
  } = useResQ();

  // If no role is selected yet, display the clean Role Selection Screen
  if (!selectedRole) {
    return <RoleSelectionScreen />;
  }

  // Once a role is selected, immediately display that role's respective functional dashboard
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-900">
      <main className="flex-1 flex flex-col">
        {/* Role 1: Driver Mobile App */}
        {selectedRole === 'driver' && (
          <div className="flex-1 p-2 sm:p-4 md:p-6 flex items-center justify-center bg-slate-950 overflow-hidden">
            {isMobileFrame ? (
              <div className="relative mx-auto border-8 border-slate-800 rounded-[44px] shadow-2xl overflow-hidden w-full max-w-[410px] h-[820px] max-h-[calc(100vh-32px)] bg-slate-900 flex flex-col">
                {/* Phone Speaker & Camera Notch */}
                <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-1 flex items-center justify-center flex-shrink-0 z-20">
                  <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <DriverMobileView />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl mx-auto h-[820px] max-h-[calc(100vh-32px)] flex flex-col">
                <DriverMobileView />
              </div>
            )}
          </div>
        )}

        {/* Role 2: Field Officer / Volunteer Mobile App */}
        {selectedRole === 'field_officer' && (
          <div className="flex-1 p-2 sm:p-4 md:p-6 flex items-center justify-center bg-slate-950 overflow-hidden">
            {isMobileFrame ? (
              <div className="relative mx-auto border-8 border-slate-800 rounded-[44px] shadow-2xl overflow-hidden w-full max-w-[410px] h-[820px] max-h-[calc(100vh-32px)] bg-slate-900 flex flex-col">
                {/* Phone Speaker & Camera Notch */}
                <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-1 flex items-center justify-center flex-shrink-0 z-20">
                  <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <FieldOfficerMobileView />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl mx-auto h-[820px] max-h-[calc(100vh-32px)] flex flex-col">
                <FieldOfficerMobileView />
              </div>
            )}
          </div>
        )}

        {/* Role 3: District Officer Web Dashboard */}
        {selectedRole === 'district_officer' && (
          <div className="flex-1 bg-slate-100">
            <DistrictOfficerView />
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ResQProvider>
      <ResQMainApp />
    </ResQProvider>
  );
}
