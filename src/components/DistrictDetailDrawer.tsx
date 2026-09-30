/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Download,
  Info,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DistrictInfo, PickupScheduleItem } from '../types';
import { exportToICalendar } from '../services/exportService';
import { getUrgencyBadgeClasses } from '../services/denverPickupService';

interface DistrictDetailDrawerProps {
  district: DistrictInfo | null;
  onClose: () => void;
  onFocusSchedule: (item: PickupScheduleItem) => void;
}

export const DistrictDetailDrawer: React.FC<DistrictDetailDrawerProps> = ({
  district,
  onClose,
  onFocusSchedule,
}) => {
  if (!district) return null;

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: district.color }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md"
          >
            D{district.districtNumber}
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {district.name}
            </div>
            <div className="text-xs text-slate-400">
              {district.region} Denver Solid Waste Service Area
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description & Overview */}
      <p className="text-xs text-slate-300 leading-relaxed">
        {district.description}
      </p>

      {/* Next Pickup Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-slate-800/90 border border-emerald-500/40 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Earliest Upcoming Pickup
          </span>
          <span className="text-sm font-black text-white">
            {district.earliestPickupDate}
          </span>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {district.dailySchedules[0]?.relativeTimeLabel || 'Scheduled'}
        </span>
      </div>

      {/* Daily Schedule Breakdown */}
      <div>
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>Weekly Pickup Dates by Route Day:</span>
          <span className="text-[10px] text-slate-500">Every 9 Weeks</span>
        </div>

        <div className="space-y-1.5">
          {district.dailySchedules.map((dayItem) => {
            const urgencyTier =
              dayItem.daysRemaining <= 6
                ? 'active'
                : dayItem.daysRemaining <= 13
                ? 'upcoming'
                : dayItem.daysRemaining <= 28
                ? 'medium'
                : 'distant';
            const badgeClass = getUrgencyBadgeClasses(urgencyTier);

            return (
              <div
                key={dayItem.code}
                className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 text-center font-bold text-slate-300 bg-slate-700/60 py-0.5 rounded text-[11px]">
                    {dayItem.code}
                  </span>
                  <div>
                    <span className="font-semibold text-white mr-1.5">
                      {dayItem.day}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {dayItem.formattedDate.split(', ')[1]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}
                  >
                    {dayItem.relativeTimeLabel}
                  </span>
                  <button
                    onClick={() => {
                      const mockItem: PickupScheduleItem = {
                        id: `dist-${district.districtNumber}-${dayItem.code}`,
                        districtNumber: district.districtNumber,
                        districtName: district.name,
                        regionName: district.region,
                        dayOfWeek: dayItem.day,
                        dayOfWeekCode: dayItem.code,
                        nextPickupDate: dayItem.date,
                        formattedDate: dayItem.formattedDate,
                        daysRemaining: dayItem.daysRemaining,
                        relativeTimeLabel: dayItem.relativeTimeLabel,
                        urgencyTier,
                        cycleArea: district.districtNumber,
                        neighborhoods: district.neighborhoods,
                        center: district.center,
                        bounds: district.bounds,
                      };
                      exportToICalendar(mockItem);
                    }}
                    title="Export iCalendar (.ics)"
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Neighborhoods Tags */}
      <div>
        <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
          Neighborhoods in District {district.districtNumber}:
        </span>
        <div className="flex flex-wrap gap-1">
          {district.neighborhoods.map((n) => (
            <span
              key={n}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
