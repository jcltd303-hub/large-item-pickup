/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  PickupScheduleItem,
  DistrictInfo,
} from './types';
import {
  getRankedPickupSchedules,
  getAllDistrictsInfo,
  OFFICIAL_DENVER_GOV_TRASH_URL,
} from './services/denverPickupService';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { MapView } from './components/MapView';
import { RankingList } from './components/RankingList';
import { AddressLookupModal } from './components/AddressLookupModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { DistrictDetailDrawer } from './components/DistrictDetailDrawer';
import {
  Truck,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Info,
  Layers,
  Phone,
} from 'lucide-react';

export default function App() {
  // Reference date: current local time
  const referenceDate = useMemo(() => new Date(), []);

  // Compute Denver's ranked schedules and district info
  const rankedSchedules = useMemo(
    () => getRankedPickupSchedules(referenceDate),
    [referenceDate]
  );
  const districtsInfo = useMemo(
    () => getAllDistrictsInfo(referenceDate),
    [referenceDate]
  );

  // Active state
  const [selectedDistrictNumber, setSelectedDistrictNumber] = useState<number | null>(
    null
  );
  const [focusedSchedule, setFocusedSchedule] = useState<PickupScheduleItem | null>(
    null
  );
  const [isAddressLookupOpen, setIsAddressLookupOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  // Selected district info object
  const selectedDistrictInfo = useMemo(() => {
    if (selectedDistrictNumber === null) return null;
    return (
      districtsInfo.find((d) => d.districtNumber === selectedDistrictNumber) ||
      null
    );
  }, [selectedDistrictNumber, districtsInfo]);

  const handleSelectDistrict = useCallback((dNum: number | null) => {
    setSelectedDistrictNumber(dNum);
    setFocusedSchedule(null);
  }, []);

  const handleFocusSchedule = useCallback((item: PickupScheduleItem) => {
    setFocusedSchedule(item);
    setSelectedDistrictNumber(item.districtNumber);
  }, []);

  const activeDistrictThisWeek = useMemo(() => {
    const active = districtsInfo.find((d) => d.activeThisWeek);
    return active ? active.districtNumber : 3;
  }, [districtsInfo]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header */}
      <Header
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onOpenAddressLookup={() => setIsAddressLookupOpen(true)}
        rankedSchedules={rankedSchedules}
        activeWeekDistrictNumber={activeDistrictThisWeek}
      />

      {/* Metrics Highlights Bar */}
      <MetricsBar
        rankedSchedules={rankedSchedules}
        selectedDistrict={selectedDistrictNumber}
        onSelectDistrict={handleSelectDistrict}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        {/* Map & Ranking Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[600px]">
          {/* Left Column: Interactive Map Overlay */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="flex-1 min-h-[460px] lg:min-h-full">
              <MapView
                districtsInfo={districtsInfo}
                rankedSchedules={rankedSchedules}
                selectedDistrict={selectedDistrictNumber}
                onSelectDistrict={handleSelectDistrict}
                focusedSchedule={focusedSchedule}
              />
            </div>

            {/* Selected District Details Card below map if active */}
            {selectedDistrictInfo && (
              <DistrictDetailDrawer
                district={selectedDistrictInfo}
                onClose={() => setSelectedDistrictNumber(null)}
                onFocusSchedule={handleFocusSchedule}
              />
            )}
          </div>

          {/* Right Column: Chronological Ranking List */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[650px] lg:h-auto">
            <RankingList
              rankedSchedules={rankedSchedules}
              districtsInfo={districtsInfo}
              selectedDistrict={selectedDistrictNumber}
              onSelectDistrict={handleSelectDistrict}
              onFocusSchedule={handleFocusSchedule}
            />
          </div>
        </div>

        {/* Quick Informational Notice Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-200">
                Denver Large Item Pickup (LIP) Schedule
              </span>
              <p className="text-[11px] text-slate-400">
                Large item & extra trash collection takes place every 9 weeks on your regular weekly trash day.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={() => setIsAddressLookupOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-medium underline cursor-pointer"
            >
              Check My Address
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="text-slate-300 hover:text-white font-medium underline cursor-pointer"
            >
              Collection Limits
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 text-xs text-slate-500 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>City and County of Denver • Department of Transportation & Infrastructure (DOTI)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              Denver 311 (720-913-1311)
            </span>
            <a
              href={OFFICIAL_DENVER_GOV_TRASH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>DenverGov.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddressLookupModal
        isOpen={isAddressLookupOpen}
        onClose={() => setIsAddressLookupOpen(false)}
        onFocusDistrict={(dNum) => handleSelectDistrict(dNum)}
      />

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
}
