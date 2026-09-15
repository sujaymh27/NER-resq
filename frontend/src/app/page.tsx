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
          <div className="flex-1 p-3 sm:p-6 md:p-8 flex items-center justify-center bg-slate-950">
            {isMobileFrame ? (
              <div className="relative mx-auto border-8 border-slate-800 rounded-[38px] shadow-2xl overflow-hidden max-w-[420px] w-full bg-slate-900">
                {/* Phone Speaker & Camera Notch */}
                <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-1 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
                </div>
                <DriverMobileView />
              </div>
            ) : (
              <div className="w-full max-w-xl mx-auto">
                <DriverMobileView />
              </div>
            )}
          </div>
        )}

        {/* Role 2: Field Officer / Volunteer Mobile App */}
        {selectedRole === 'field_officer' && (
          <div className="flex-1 p-3 sm:p-6 md:p-8 flex items-center justify-center bg-slate-950">
            {isMobileFrame ? (
              <div className="relative mx-auto border-8 border-slate-800 rounded-[38px] shadow-2xl overflow-hidden max-w-[420px] w-full bg-slate-900">
                {/* Phone Speaker & Camera Notch */}
                <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-1 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
                </div>
                <FieldOfficerMobileView />
              </div>
            ) : (
              <div className="w-full max-w-xl mx-auto">
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
