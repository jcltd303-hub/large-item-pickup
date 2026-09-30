/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  ShieldCheck,
  PackageCheck,
  Truck,
  Phone,
} from 'lucide-react';
import { OFFICIAL_DENVER_GOV_TRASH_URL } from '../services/denverPickupService';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Denver Large Item Pickup Rules & Regulations
              </h3>
              <p className="text-xs text-slate-400">
                Official guidelines from City & County of Denver Solid Waste Management (DOTI)
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Key Rule Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-300 text-sm mb-1">
                The 9-Week Rotation Service Limit
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Denver residential collection accounts receive Large Item Pickup every <strong>9 weeks</strong> on their standard weekly collection day. Each service address is permitted up to <strong>5 large items</strong> and up to <strong>10 extra trash bags</strong> (up to 32 gallons and under 50 lbs each).
              </p>
            </div>
          </div>

          {/* Set-out Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
              <div className="font-semibold text-white text-xs mb-1 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>When & Where to Place Items</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Set out items by <strong>6:00 AM</strong> on scheduled service day.</li>
                <li>Items may be placed as early as 7:00 PM the evening before.</li>
                <li>Place at your normal cart collection point (street curb or alley).</li>
                <li>Keep at least 4 feet away from regular carts and parked vehicles.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
              <div className="font-semibold text-white text-xs mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Mattress Plastic Bagging Law</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                By Denver Municipal Code for health and worker safety, <strong>all mattresses and box springs must be fully encased in sealed plastic mattress disposal bags</strong> before collection. Unbagged mattresses will be tagged and skipped.
              </p>
            </div>
          </div>

          {/* Accepted vs Prohibited Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Accepted */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2.5">
                <CheckCircle className="w-4 h-4" />
                <span>Accepted Items (Up to 5)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>✓ Sofas, loveseats & recliners</li>
                <li>✓ Tables, chairs, desks & dressers</li>
                <li>✓ Plastic-bagged mattresses & box springs</li>
                <li>✓ Non-electric bicycles & large toys</li>
                <li>✓ Rolled carpets & rugs (bundled ≤ 4 ft)</li>
                <li>✓ Lawn furniture & grills (propane tanks removed)</li>
                <li>✓ Tree branches (tied in bundles ≤ 4 ft, under 50 lbs)</li>
                <li>✓ Up to 10 extra 32-gal trash bags</li>
              </ul>
            </div>

            {/* Prohibited */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2.5">
                <XCircle className="w-4 h-4" />
                <span>Not Accepted (Will Be Skipped)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>✗ Refrigerators, freezers & AC units (Freon)</li>
                <li>✗ TVs, computer monitors & electronics</li>
                <li>✗ Automotive tires & motor oil</li>
                <li>✗ Paint, chemicals & hazardous waste</li>
                <li>✗ Construction, demolition & remodeling debris</li>
                <li>✗ Concrete, bricks, soil & rocks</li>
                <li>✗ Unbagged mattresses or loose branches</li>
                <li>✗ Commercial or landlord bulk cleanouts</li>
              </ul>
            </div>
          </div>

          {/* Special Services Note: Appliance & Electronics */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
            <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-white block mb-0.5">
                Need to recycle refrigerators, AC units, or major appliances?
              </span>
              <span className="text-slate-400">
                Denver offers separate, free Appliance Collection for residents with trash service. Call <strong>311</strong> (720-913-1311) to schedule a dedicated appliance appointment.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <a
            href={OFFICIAL_DENVER_GOV_TRASH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"
          >
            <span>Visit DenverGov Solid Waste Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
