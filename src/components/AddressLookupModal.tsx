/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Truck,
  ExternalLink,
  Download,
} from 'lucide-react';
import { AddressLookupResult, PickupScheduleItem } from '../types';
import { lookupAddressPickup } from '../services/denverPickupService';
import { exportToICalendar } from '../services/exportService';

interface AddressLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusDistrict: (districtNum: number) => void;
}

const EXAMPLE_ADDRESSES = [
  '1437 Bannock St (Civic Center)',
  '3200 Tejon St (Highland)',
  '2801 E Colfax Ave (Congress Park)',
  '4900 Green Valley Ranch Blvd',
  '1000 S University Blvd (Wash Park)',
  '1390 S Federal Blvd (Ruby Hill)',
];

export const AddressLookupModal: React.FC<AddressLookupModalProps> = ({
  isOpen,
  onClose,
  onFocusDistrict,
}) => {
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AddressLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (addressToSearch?: string) => {
    const query = addressToSearch || addressInput;
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await lookupAddressPickup(query);
      if (res) {
        setResult(res);
      } else {
        setError(
          'Address not found in Denver solid waste boundary. Please check spelling or enter a Denver street address.'
        );
      }
    } catch (e) {
      setError('Lookup failed. Please check network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalendarExport = () => {
    if (!result) return;
    const mockScheduleItem: PickupScheduleItem = {
      id: `lookup-${result.districtNumber}-${result.collectionDayCode}`,
      districtNumber: result.districtNumber,
      districtName: result.districtName,
      regionName: 'Denver',
      dayOfWeek: result.collectionDay,
      dayOfWeekCode: result.collectionDayCode,
      nextPickupDate: result.nextPickupDate,
      formattedDate: result.formattedDate,
      daysRemaining: result.daysRemaining,
      relativeTimeLabel: result.relativeTimeLabel,
      urgencyTier: result.daysRemaining <= 6 ? 'active' : 'upcoming',
      cycleArea: result.cycleArea,
      neighborhoods: [],
      center: [result.lat, result.lng],
      bounds: [
        [result.lat - 0.02, result.lng - 0.02],
        [result.lat + 0.02, result.lng + 0.02],
      ],
    };
    exportToICalendar(mockScheduleItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Denver Address Schedule Lookup
              </h3>
              <p className="text-xs text-slate-400">
                Find your exact solid waste district, collection day & upcoming large item dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Enter street address (e.g. 1437 Bannock St, Denver)..."
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Lookup</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Examples */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Try an example:</span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_ADDRESSES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    const clean = ex.split(' (')[0];
                    setAddressInput(clean);
                    handleSearch(clean);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 transition cursor-pointer"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Lookup Result Box */}
          {result && (
            <div className="bg-slate-800/80 border border-emerald-500/40 rounded-2xl p-4 space-y-4 shadow-lg">
              {/* Address Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Eligible Denver Solid Waste Address</span>
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">
                    {result.matchedAddress}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold whitespace-nowrap">
                  District {result.districtNumber}
                </span>
              </div>

              {/* Next Pickup Highlight Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-emerald-300">
                    Next Large Item Pickup (LIP)
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    {result.relativeTimeLabel}
                  </span>
                </div>
                <div className="text-lg font-black text-white">
                  {result.formattedDate}
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span>Regular Trash Day: <strong>{result.collectionDay}</strong></span>
                  <span>•</span>
                  <span>Set out by: <strong>6:00 AM</strong></span>
                </div>
              </div>

              {/* Subsequent Pickups in 2026 */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Subsequent Scheduled Dates (9-Week Rotation):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {result.subsequentPickups.map((subDate, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-center"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Cycle +{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200 block mt-0.5">
                        {subDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resident Limits & Reminders */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/80 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white">Denver Curbside Service Limits:</div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Maximum 5 large items (furniture, bikes, boxed items)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Maximum 10 extra bags of trash (up to 32 gal / 50 lbs each)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Mattresses & box springs MUST be bagged & sealed in plastic</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCalendarExport}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add Reminder to Calendar (.ics)</span>
                </button>
                <button
                  onClick={() => {
                    onFocusDistrict(result.districtNumber);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  View District on Map
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
