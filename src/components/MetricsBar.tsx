/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Clock, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import { PickupScheduleItem } from '../types';

interface MetricsBarProps {
  rankedSchedules: PickupScheduleItem[];
  selectedDistrict: number | null;
  onSelectDistrict: (d: number | null) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  rankedSchedules,
  selectedDistrict,
  onSelectDistrict,
}) => {
  const earliest = rankedSchedules[0];
  const thisWeekCount = rankedSchedules.filter((s) => s.daysRemaining <= 6).length;
  const nextWeekCount = rankedSchedules.filter(
    (s) => s.daysRemaining > 6 && s.daysRemaining <= 13
  ).length;

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Next Pickup */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Earliest Pickup
            </div>
            <div className="text-sm font-bold text-white truncate">
              {earliest ? earliest.relativeTimeLabel : 'Calculating...'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {earliest ? `${earliest.formattedDate.split(',')[0]} (${earliest.districtName.split(' - ')[0]})` : ''}
            </div>
          </div>
        </div>

        {/* Metric 2: Pickups This Week */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              This Week Active
            </div>
            <div className="text-sm font-bold text-white">
              {thisWeekCount} Collection Days
            </div>
            <div className="text-[11px] text-slate-400">
              {nextWeekCount} days scheduled next week
            </div>
          </div>
        </div>

        {/* Metric 3: Citywide Coverage */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Denver Coverage
            </div>
            <div className="text-sm font-bold text-white">
              9 Solid Waste Districts
            </div>
            <div className="text-[11px] text-slate-400">
              Rotating every 9 weeks (63 days)
            </div>
          </div>
        </div>

        {/* Metric 4: Resident Service Limits */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Denver Service Limits
            </div>
            <div className="text-sm font-bold text-emerald-400">
              5 Items + 10 Extra Bags
            </div>
            <div className="text-[11px] text-slate-400">
              Set out by 6:00 AM on service day
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
