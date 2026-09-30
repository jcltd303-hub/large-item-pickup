/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayOfWeekCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR';

export type DayOfWeekName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday';

export type UrgencyTier = 'active' | 'upcoming' | 'medium' | 'distant';

export interface PickupScheduleItem {
  id: string;
  districtNumber: number;
  districtName: string;
  regionName: string;
  dayOfWeek: DayOfWeekName;
  dayOfWeekCode: DayOfWeekCode;
  nextPickupDate: string; // ISO format: YYYY-MM-DD
  formattedDate: string;
  daysRemaining: number;
  relativeTimeLabel: string;
  urgencyTier: UrgencyTier;
  cycleArea: number;
  neighborhoods: string[];
  center: [number, number]; // [lat, lng]
  bounds: [[number, number], [number, number]];
}

export interface DistrictInfo {
  districtNumber: number;
  name: string;
  region: string;
  description: string;
  neighborhoods: string[];
  center: [number, number];
  bounds: [[number, number], [number, number]];
  earliestPickupDate: string;
  daysUntilEarliest: number;
  activeThisWeek: boolean;
  color: string;
  dailySchedules: {
    day: DayOfWeekName;
    code: DayOfWeekCode;
    date: string;
    formattedDate: string;
    daysRemaining: number;
    relativeTimeLabel: string;
  }[];
}

export interface AddressLookupResult {
  query: string;
  matchedAddress: string;
  lat: number;
  lng: number;
  districtNumber: number;
  districtName: string;
  collectionDay: DayOfWeekName;
  collectionDayCode: DayOfWeekCode;
  nextPickupDate: string;
  formattedDate: string;
  daysRemaining: number;
  relativeTimeLabel: string;
  cycleArea: number;
  subsequentPickups: string[];
}

export interface FilterOptions {
  searchQuery: string;
  dayOfWeek: 'ALL' | DayOfWeekCode;
  district: 'ALL' | number;
  urgency: 'ALL' | 'this_week' | 'next_2_weeks' | 'next_month';
  sortBy: 'date_asc' | 'date_desc' | 'district_asc';
}
