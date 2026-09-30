/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Truck, MapPin, Calendar, HelpCircle, Download, Search } from 'lucide-react';
import { PickupScheduleItem } from '../types';
import { exportSchedulesToCSV } from '../services/exportService';

interface HeaderProps {
  onOpenGuidelines: () => void;
  onOpenAddressLookup: () => void;
  rankedSchedules: PickupScheduleItem[];
  activeWeekDistrictNumber: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGuidelines,
  onOpenAddressLookup,
  rankedSchedules,
  activeWeekDistrictNumber,
}) => {
  const nextPickup = rankedSchedules[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-inner flex items-center justify-center text-white">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Denver Large Item Pickup
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  9-Week Cycle
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official City & County of Denver Solid Waste schedule, map overlay & date ranking
              </p>
            </div>
          </div>

          {/* Quick Active Status Badge & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {nextPickup && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Next active:</span>
                <span className="font-semibold text-emerald-400">
                  {nextPickup.relativeTimeLabel} ({nextPickup.dayOfWeek}, {nextPickup.districtName.split(' - ')[0]})
                </span>
              </div>
            )}

            {/* Address Lookup Button */}
            <button
              onClick={onOpenAddressLookup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup My Address</span>
            </button>

            {/* Guidelines Button */}
            <button
              onClick={onOpenGuidelines}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Pickup Rules & Limits</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={() => exportSchedulesToCSV(rankedSchedules)}
              title="Download entire Denver schedule as CSV"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
