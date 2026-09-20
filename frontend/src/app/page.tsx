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
    <>
      {/* Role 1: Driver Mobile App */}
      {selectedRole === 'driver' && (
        <div className="h-screen w-screen max-h-screen max-w-full overflow-hidden bg-slate-950 flex flex-col font-sans text-slate-900 select-none">
          <main className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div
              className="relative mx-auto border-[8px] border-slate-800 rounded-[42px] shadow-2xl overflow-hidden w-full max-w-[410px] bg-slate-900 flex flex-col"
              style={{ height: 'min(790px, calc(100vh - 24px))' }}
            >
              {/* Phone Speaker & Camera Notch */}
              <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-1 flex items-center justify-center flex-shrink-0 z-20">
                <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <DriverMobileView />
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Role 2: Field Officer / Volunteer Mobile App */}
      {selectedRole === 'field_officer' && (
        <div className="h-screen w-screen max-h-screen max-w-full overflow-hidden bg-slate-950 flex flex-col font-sans text-slate-900 select-none">
          <main className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div
              className="relative mx-auto border-[8px] border-slate-800 rounded-[42px] shadow-2xl overflow-hidden w-full max-w-[410px] bg-slate-900 flex flex-col"
              style={{ height: 'min(790px, calc(100vh - 24px))' }}
            >
              {/* Phone Speaker & Camera Notch */}
              <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-1 flex items-center justify-center flex-shrink-0 z-20">
                <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <FieldOfficerMobileView />
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Role 3: District Officer Web Dashboard */}
      {selectedRole === 'district_officer' && (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
          <DistrictOfficerView />
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <ResQProvider>
      <ResQMainApp />
    </ResQProvider>
  );
}
