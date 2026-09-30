/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  PickupScheduleItem,
  DayOfWeekCode,
  DistrictInfo,
  UrgencyTier,
} from '../types';
import {
  getUrgencyBadgeClasses,
  getUrgencyColor,
} from '../services/denverPickupService';
import { exportToICalendar } from '../services/exportService';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  Download,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

interface RankingListProps {
  rankedSchedules: PickupScheduleItem[];
  districtsInfo: DistrictInfo[];
  selectedDistrict: number | null;
  onSelectDistrict: (d: number | null) => void;
  onFocusSchedule: (item: PickupScheduleItem) => void;
}

export const RankingList: React.FC<RankingListProps> = ({
  rankedSchedules,
  districtsInfo,
  selectedDistrict,
  onSelectDistrict,
  onFocusSchedule,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState<'ALL' | DayOfWeekCode>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'this_week' | 'next_2_weeks' | 'next_month'>('ALL');
  const [viewMode, setViewMode] = useState<'all_pickups' | 'by_district'>('all_pickups');

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return rankedSchedules.filter((item) => {
      // District filter
      if (selectedDistrict !== null && item.districtNumber !== selectedDistrict) {
        return false;
      }

      // Day filter
      if (dayFilter !== 'ALL' && item.dayOfWeekCode !== dayFilter) {
        return false;
      }

      // Urgency filter
      if (urgencyFilter === 'this_week' && item.daysRemaining > 6) {
        return false;
      }
      if (urgencyFilter === 'next_2_weeks' && item.daysRemaining > 13) {
        return false;
      }
      if (urgencyFilter === 'next_month' && item.daysRemaining > 30) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDistrict = item.districtName.toLowerCase().includes(q);
        const matchDay = item.dayOfWeek.toLowerCase().includes(q);
        const matchNeigh = item.neighborhoods.some((n) => n.toLowerCase().includes(q));
        const matchRegion = item.regionName.toLowerCase().includes(q);
        if (!matchDistrict && !matchDay && !matchNeigh && !matchRegion) {
          return false;
        }
      }

      return true;
    });
  }, [rankedSchedules, selectedDistrict, dayFilter, urgencyFilter, searchQuery]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full shadow-xl overflow-hidden">
      {/* List Header & Controls */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Ranked Pickup Dates
                <span className="text-xs px-2 py-0.5 rounded-full font-normal bg-slate-800 text-slate-300 border border-slate-700">
                  {filteredSchedules.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sorted chronologically by nearest collection date
              </p>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('all_pickups')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'all_pickups'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => setViewMode('by_district')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'by_district'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Districts (9)
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search neighborhood (e.g. Highland, Park Hill, Lowry)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          {/* Day of Week Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Day:</span>
            {(['ALL', 'MO', 'TU', 'WE', 'TH', 'FR'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDayFilter(d)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  dayFilter === d
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-slate-800 mx-1 hidden sm:block" />

          {/* Timeframe Urgency Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setUrgencyFilter(urgencyFilter === 'this_week' ? 'ALL' : 'this_week')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                urgencyFilter === 'this_week'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() =>
                setUrgencyFilter(urgencyFilter === 'next_2_weeks' ? 'ALL' : 'next_2_weeks')
              }
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                urgencyFilter === 'next_2_weeks'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10'
              }`}
            >
              Next 14 Days
            </button>
          </div>
        </div>

        {/* Selected District Filter Bar */}
        {selectedDistrict !== null && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
            <span className="text-emerald-300 font-medium">
              Filtered to <span className="font-bold">District {selectedDistrict}</span>
            </span>
            <button
              onClick={() => onSelectDistrict(null)}
              className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
            >
              Show All Districts
            </button>
          </div>
        )}
      </div>

      {/* Ranked Schedule List Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
        {viewMode === 'all_pickups' ? (
          filteredSchedules.length > 0 ? (
            filteredSchedules.map((item, idx) => {
              const badgeClass = getUrgencyBadgeClasses(item.urgencyTier);
              const isSelected = selectedDistrict === item.districtNumber;

              return (
                <div
                  key={item.id}
                  className={`pt-2.5 first:pt-0 group p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Rank Badge & District Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex flex-col items-center justify-center">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold mt-1">
                          D{item.districtNumber}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition">
                            {item.dayOfWeek}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            • {item.formattedDate}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-300 truncate">
                          {item.districtName}
                        </div>

                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.neighborhoods.slice(0, 4).join(', ')}
                          {item.neighborhoods.length > 4 ? '...' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Countdown Badge & Actions */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap shadow-sm ${badgeClass}`}
                      >
                        {item.relativeTimeLabel}
                      </span>

                      <div className="flex items-center gap-1">
                        {/* Map Focus */}
                        <button
                          onClick={() => {
                            onSelectDistrict(item.districtNumber);
                            onFocusSchedule(item);
                          }}
                          title="Focus district on map"
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs transition cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>

                        {/* Add to Calendar */}
                        <button
                          onClick={() => exportToICalendar(item)}
                          title="Download calendar reminder (.ics)"
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-300 hover:text-white text-xs transition cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No pickup dates match your current filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDayFilter('ALL');
                  setUrgencyFilter('ALL');
                  onSelectDistrict(null);
                }}
                className="mt-2 text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )
        ) : (
          /* View Mode: By District */
          districtsInfo.map((dist, dIdx) => {
            const isSelected = selectedDistrict === dist.districtNumber;
            const earliest = dist.dailySchedules[0];

            return (
              <div
                key={dist.districtNumber}
                onClick={() =>
                  onSelectDistrict(isSelected ? null : dist.districtNumber)
                }
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: dist.color }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md"
                    >
                      D{dist.districtNumber}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{dist.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Earliest pickup: <span className="font-semibold text-slate-200">{dist.earliestPickupDate}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {dist.neighborhoods.slice(0, 5).join(', ')}...
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400">
                      {earliest?.relativeTimeLabel || 'Scheduled'}
                    </span>
                  </div>
                </div>

                {/* Daily Schedule Row */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-5 gap-1 text-center">
                  {dist.dailySchedules.map((sc) => (
                    <div
                      key={sc.code}
                      className="p-1 rounded bg-slate-900/60 border border-slate-800 text-[10px]"
                    >
                      <div className="font-bold text-slate-300">{sc.code}</div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {sc.daysRemaining === 0
                          ? 'Today'
                          : sc.daysRemaining === 1
                          ? 'Tmrw'
                          : `${sc.daysRemaining}d`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Notice */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          Set items out by 6:00 AM on collection day
        </span>
        <span className="text-slate-400">Denver DOTI SWM</span>
      </div>
    </div>
  );
};
