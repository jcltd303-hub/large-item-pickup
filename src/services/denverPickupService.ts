/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DayOfWeekCode,
  DayOfWeekName,
  DistrictInfo,
  PickupScheduleItem,
  UrgencyTier,
  AddressLookupResult,
} from '../types';
import districtsGeoJsonData from '../data/denver_districts.json';

export const DENVER_SOLID_WASTE_ARCGIS_URL =
  'https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/ArcGIS/rest/services/Solid_Waste_Districts/FeatureServer/0';

export const DENVER_COLLECTION_AREAS_URL =
  'https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/ArcGIS/rest/services/ODC_ADMN_SOLIDWASTECOLLECTION_A/FeatureServer/311';

export const OFFICIAL_DENVER_GOV_TRASH_URL =
  'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Transportation-and-Infrastructure/Programs-Services/Trash-Recycling';

export const DAY_CODES: Record<DayOfWeekCode, { name: DayOfWeekName; dayIndex: number }> = {
  MO: { name: 'Monday', dayIndex: 1 },
  TU: { name: 'Tuesday', dayIndex: 2 },
  WE: { name: 'Wednesday', dayIndex: 3 },
  TH: { name: 'Thursday', dayIndex: 4 },
  FR: { name: 'Friday', dayIndex: 5 },
};

export const DISTRICT_METADATA: Record<
  number,
  {
    name: string;
    region: string;
    description: string;
    neighborhoods: string[];
    center: [number, number];
    bounds: [[number, number], [number, number]];
    color: string;
  }
> = {
  1: {
    name: 'District 1 - Northwest Denver',
    region: 'Northwest',
    description: 'Highland, Berkeley, Sunnyside, Sloan’s Lake, West Colfax & Jefferson Park corridor.',
    neighborhoods: [
      'Highland',
      'West Highland',
      'Berkeley',
      'Sunnyside',
      'Sloan’s Lake',
      'Jefferson Park',
      'West Colfax',
      'Regis',
      'Chaffee Park',
    ],
    center: [39.786, -105.0234],
    bounds: [
      [39.7404, -105.065],
      [39.7945, -104.9884],
    ],
    color: '#059669', // Emerald
  },
  2: {
    name: 'District 2 - North Central & RiNo',
    region: 'North Central',
    description: 'River North Arts District, Five Points, Globeville, Elyria-Swansea, Cole & Whittier.',
    neighborhoods: [
      'Five Points',
      'RiNo (River North)',
      'Globeville',
      'Elyria-Swansea',
      'Cole',
      'Clayton',
      'Whittier',
      'Skyland',
      'City Park West',
    ],
    center: [39.777, -104.9805],
    bounds: [
      [39.74, -105.0182],
      [39.7983, -104.9404],
    ],
    color: '#0284c7', // Sky Blue
  },
  3: {
    name: 'District 3 - Central & East Denver',
    region: 'Central / East',
    description: 'Capitol Hill, Cheesman Park, City Park, Congress Park, Park Hill & Central Park.',
    neighborhoods: [
      'Capitol Hill',
      'Cheesman Park',
      'Congress Park',
      'City Park',
      'Park Hill',
      'North Park Hill',
      'South Park Hill',
      'Central Park',
      'Hale',
    ],
    center: [39.7757, -104.8792],
    bounds: [
      [39.7402, -104.9405],
      [39.8128, -104.8469],
    ],
    color: '#2563eb', // Royal Blue
  },
  4: {
    name: 'District 4 - Far Northeast & Gateway',
    region: 'Far Northeast',
    description: 'Green Valley Ranch, Montbello, Gateway, and Denver International Airport corridor.',
    neighborhoods: [
      'Green Valley Ranch',
      'Montbello',
      'Gateway - Green Valley Ranch',
      'DIA Corridor',
      'First Creek',
      'Pena Station',
    ],
    center: [39.7878, -104.7945],
    bounds: [
      [39.7664, -104.8472],
      [39.8418, -104.7344],
    ],
    color: '#7c3aed', // Purple
  },
  5: {
    name: 'District 5 - West & Southwest Infill',
    region: 'West / Southwest',
    description: 'Barnum, Villa Park, Westwood, Athmar Park, Valverde, and Sun Valley.',
    neighborhoods: [
      'Barnum',
      'Barnum West',
      'Villa Park',
      'Westwood',
      'Athmar Park',
      'Valverde',
      'Sun Valley',
      'Morrison Rd Corridor',
    ],
    center: [39.7238, -105.0254],
    bounds: [
      [39.6967, -105.0556],
      [39.7406, -104.9874],
    ],
    color: '#d97706', // Amber
  },
  6: {
    name: 'District 6 - Central & South Central',
    region: 'Central / South',
    description: 'Washington Park, Baker, Speer, Cherry Creek, Platt Park, Belcaro, and Country Club.',
    neighborhoods: [
      'Washington Park',
      'Washington Park West',
      'Baker',
      'Speer',
      'Cherry Creek',
      'Platt Park',
      'Belcaro',
      'Country Club',
      'Alamo Placita',
    ],
    center: [39.7036, -104.9578],
    bounds: [
      [39.6829, -104.9875],
      [39.7403, -104.9386],
    ],
    color: '#ea580c', // Orange
  },
  7: {
    name: 'District 7 - East & Southeast Plains',
    region: 'East / Southeast',
    description: 'Lowry, East Colfax, Windsor, Hilltop, Montclair, and Washington Virginia Vale.',
    neighborhoods: [
      'Lowry',
      'East Colfax',
      'Windsor',
      'Hilltop',
      'Montclair',
      'Washington Virginia Vale',
      'Fairmount',
    ],
    center: [39.7042, -104.8887],
    bounds: [
      [39.6784, -104.9407],
      [39.7403, -104.866],
    ],
    color: '#e11d48', // Rose
  },
  8: {
    name: 'District 8 - Southwest Suburbs',
    region: 'Southwest',
    description: 'Harvey Park, Bear Valley, Fort Logan, Mar Lee, and Southwest Denver borders.',
    neighborhoods: [
      'Harvey Park',
      'Harvey Park South',
      'Bear Valley',
      'Fort Logan',
      'Mar Lee',
      'Brentwood',
      'Pinehurst Area',
    ],
    center: [39.647, -105.0511],
    bounds: [
      [39.6143, -105.11],
      [39.6972, -104.9874],
    ],
    color: '#4f46e5', // Indigo
  },
  9: {
    name: 'District 9 - South & Southeast Corridor',
    region: 'South / Southeast',
    description: 'University Hills, University of Denver, Hampden, Goldsmith, Southmoor Park & Virginia Village.',
    neighborhoods: [
      'University of Denver (DU)',
      'University Park',
      'University Hills',
      'Hampden',
      'Hampden South',
      'Goldsmith',
      'Southmoor Park',
      'Virginia Village',
      'Indian Creek',
    ],
    center: [39.6642, -104.8977],
    bounds: [
      [39.6241, -104.9876],
      [39.7011, -104.8473],
    ],
    color: '#0d9488', // Teal
  },
};

/**
 * Anchor date for the 9-week rotation schedule in Denver:
 * Cycle week repeats every 9 weeks (63 days).
 * District N is active on rotation week N.
 */
const ROTATION_ANCHOR_DATE = new Date('2026-01-05T00:00:00-07:00'); // First Monday of 2026

/**
 * Computes the next scheduled Large Item Pickup date for a given district & day of week.
 */
export function calculateNextPickupDate(
  districtNumber: number,
  dayCode: DayOfWeekCode,
  referenceDate: Date = new Date()
): {
  date: Date;
  isoDate: string;
  formattedDate: string;
  daysRemaining: number;
  relativeTimeLabel: string;
  urgencyTier: UrgencyTier;
  subsequentPickups: string[];
} {
  const dayOffset = DAY_CODES[dayCode].dayIndex - 1; // 0 for MO, 4 for FR

  // Calculate milliseconds since anchor
  const nowMs = referenceDate.getTime();
  const anchorMs = ROTATION_ANCHOR_DATE.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  const msPerWeek = 7 * msPerDay;
  const msPerCycle = 9 * msPerWeek;

  // Find occurrences of this district's active week
  // The district's first active week in the cycle corresponds to cycleIndex = (districtNumber - 1)
  const cycleWeekOffset = districtNumber - 1; // 0..8
  const baseDistrictMondayMs = anchorMs + cycleWeekOffset * msPerWeek;

  // Step through cycles until we find the next date >= referenceDate (midnight)
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  let targetPickupMs = baseDistrictMondayMs + dayOffset * msPerDay;

  // Fast forward or rewind to the immediate cycle
  while (targetPickupMs < refMidnight) {
    targetPickupMs += msPerCycle;
  }

  const nextPickupDate = new Date(targetPickupMs);
  const diffMs = targetPickupMs - refMidnight;
  const daysRemaining = Math.round(diffMs / msPerDay);

  let relativeTimeLabel = '';
  let urgencyTier: UrgencyTier = 'distant';

  if (daysRemaining === 0) {
    relativeTimeLabel = 'Today';
    urgencyTier = 'active';
  } else if (daysRemaining === 1) {
    relativeTimeLabel = 'Tomorrow';
    urgencyTier = 'active';
  } else if (daysRemaining <= 6) {
    relativeTimeLabel = `In ${daysRemaining} days (This Week)`;
    urgencyTier = 'active';
  } else if (daysRemaining <= 13) {
    relativeTimeLabel = `In ${daysRemaining} days (Next Week)`;
    urgencyTier = 'upcoming';
  } else if (daysRemaining <= 28) {
    const weeks = Math.round(daysRemaining / 7);
    relativeTimeLabel = `In ${weeks} weeks`;
    urgencyTier = 'medium';
  } else {
    const weeks = Math.round(daysRemaining / 7);
    relativeTimeLabel = `In ${weeks} weeks`;
    urgencyTier = 'distant';
  }

  const formattedDate = nextPickupDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isoDate = nextPickupDate.toISOString().split('T')[0];

  // Calculate the next 3 future pickup dates (every 9 weeks = 63 days)
  const subsequentPickups: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(targetPickupMs + i * msPerCycle);
    subsequentPickups.push(
      futureDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    );
  }

  return {
    date: nextPickupDate,
    isoDate,
    formattedDate,
    daysRemaining,
    relativeTimeLabel,
    urgencyTier,
    subsequentPickups,
  };
}

/**
 * Builds the complete ranked list of all 45 Denver Large Item Pickup schedules
 * (9 Districts x 5 weekdays), sorted chronologically from earliest to latest.
 */
export function getRankedPickupSchedules(
  referenceDate: Date = new Date()
): PickupScheduleItem[] {
  const items: PickupScheduleItem[] = [];

  const dayCodes: DayOfWeekCode[] = ['MO', 'TU', 'WE', 'TH', 'FR'];

  for (let d = 1; d <= 9; d++) {
    const meta = DISTRICT_METADATA[d];

    for (const code of dayCodes) {
      const schedule = calculateNextPickupDate(d, code, referenceDate);

      items.push({
        id: `dist-${d}-${code}`,
        districtNumber: d,
        districtName: meta.name,
        regionName: meta.region,
        dayOfWeek: DAY_CODES[code].name,
        dayOfWeekCode: code,
        nextPickupDate: schedule.isoDate,
        formattedDate: schedule.formattedDate,
        daysRemaining: schedule.daysRemaining,
        relativeTimeLabel: schedule.relativeTimeLabel,
        urgencyTier: schedule.urgencyTier,
        cycleArea: d,
        neighborhoods: meta.neighborhoods,
        center: meta.center,
        bounds: meta.bounds,
      });
    }
  }

  // Rank strictly by daysRemaining ascending (earliest pickup date first)
  items.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return items;
}

/**
 * Gets aggregated district details with earliest upcoming pickup date
 */
export function getAllDistrictsInfo(
  referenceDate: Date = new Date()
): DistrictInfo[] {
  const dayCodes: DayOfWeekCode[] = ['MO', 'TU', 'WE', 'TH', 'FR'];
  const districts: DistrictInfo[] = [];

  for (let d = 1; d <= 9; d++) {
    const meta = DISTRICT_METADATA[d];
    const dailySchedules = dayCodes.map((code) => {
      const calc = calculateNextPickupDate(d, code, referenceDate);
      return {
        day: DAY_CODES[code].name,
        code,
        date: calc.isoDate,
        formattedDate: calc.formattedDate,
        daysRemaining: calc.daysRemaining,
        relativeTimeLabel: calc.relativeTimeLabel,
      };
    });

    // Find the earliest upcoming day in this district
    dailySchedules.sort((a, b) => a.daysRemaining - b.daysRemaining);
    const earliest = dailySchedules[0];

    districts.push({
      districtNumber: d,
      name: meta.name,
      region: meta.region,
      description: meta.description,
      neighborhoods: meta.neighborhoods,
      center: meta.center,
      bounds: meta.bounds,
      color: meta.color,
      earliestPickupDate: earliest.formattedDate,
      daysUntilEarliest: earliest.daysRemaining,
      activeThisWeek: earliest.daysRemaining <= 6,
      dailySchedules,
    });
  }

  // Sort districts by earliest upcoming collection date
  districts.sort((a, b) => a.daysUntilEarliest - b.daysUntilEarliest);

  return districts;
}

/**
 * Loads the Denver Solid Waste Districts GeoJSON
 */
export function getDistrictsGeoJson() {
  return districtsGeoJsonData;
}

/**
 * Finds the closest district given a latitude/longitude coordinate in Denver.
 * Uses Euclidean approximation with bounding box and centroid distance.
 */
export function findDistrictByCoordinates(
  lat: number,
  lng: number
): number {
  let closestDistrict = 1;
  let minDistance = Infinity;

  for (let d = 1; d <= 9; d++) {
    const meta = DISTRICT_METADATA[d];
    const [cLat, cLng] = meta.center;
    const dist = Math.hypot(lat - cLat, lng - cLng);

    // Give priority if point falls within bounds
    const [[minLat, minLng], [maxLat, maxLng]] = meta.bounds;
    const insideBounds =
      lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;

    const weightedDist = insideBounds ? dist * 0.7 : dist;

    if (weightedDist < minDistance) {
      minDistance = weightedDist;
      closestDistrict = d;
    }
  }

  return closestDistrict;
}

/**
 * Lookup Denver Large Item Pickup info for a given address query
 */
export async function lookupAddressPickup(
  addressQuery: string
): Promise<AddressLookupResult | null> {
  const query = addressQuery.trim();
  if (!query) return null;

  try {
    // Geocode with OpenStreetMap Nominatim restricted to Denver, CO
    const encoded = encodeURIComponent(
      query.toLowerCase().includes('denver') ? query : `${query}, Denver, CO`
    );
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DenverLargeItemPickupDashboard/1.0',
        },
      }
    );

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const districtNum = findDistrictByCoordinates(lat, lng);
        const meta = DISTRICT_METADATA[districtNum];

        // Choose the standard collection day based on address parity or Monday default
        const streetNumber = parseInt(query.replace(/\D/g, '').slice(-1) || '0', 10);
        const dayCodes: DayOfWeekCode[] = ['MO', 'TU', 'WE', 'TH', 'FR'];
        const chosenDay = dayCodes[streetNumber % 5];

        const schedule = calculateNextPickupDate(districtNum, chosenDay);

        return {
          query,
          matchedAddress: item.display_name,
          lat,
          lng,
          districtNumber: districtNum,
          districtName: meta.name,
          collectionDay: DAY_CODES[chosenDay].name,
          collectionDayCode: chosenDay,
          nextPickupDate: schedule.isoDate,
          formattedDate: schedule.formattedDate,
          daysRemaining: schedule.daysRemaining,
          relativeTimeLabel: schedule.relativeTimeLabel,
          cycleArea: districtNum,
          subsequentPickups: schedule.subsequentPickups,
        };
      }
    }
  } catch (err) {
    console.warn('Address geocoding lookup failed:', err);
  }

  // Fallback: match by neighborhood name or district number in query
  const lower = query.toLowerCase();
  for (let d = 1; d <= 9; d++) {
    const meta = DISTRICT_METADATA[d];
    const match = meta.neighborhoods.some((n) => lower.includes(n.toLowerCase()));
    if (match || lower.includes(`district ${d}`) || lower.includes(`d${d}`)) {
      const chosenDay: DayOfWeekCode = 'MO';
      const schedule = calculateNextPickupDate(d, chosenDay);
      return {
        query,
        matchedAddress: `${meta.name}, Denver, CO`,
        lat: meta.center[0],
        lng: meta.center[1],
        districtNumber: d,
        districtName: meta.name,
        collectionDay: DAY_CODES[chosenDay].name,
        collectionDayCode: chosenDay,
        nextPickupDate: schedule.isoDate,
        formattedDate: schedule.formattedDate,
        daysRemaining: schedule.daysRemaining,
        relativeTimeLabel: schedule.relativeTimeLabel,
        cycleArea: d,
        subsequentPickups: schedule.subsequentPickups,
      };
    }
  }

  return null;
}

/**
 * Returns color hex according to urgency tier
 */
export function getUrgencyColor(tier: UrgencyTier): string {
  switch (tier) {
    case 'active':
      return '#10b981'; // Vibrant Emerald
    case 'upcoming':
      return '#06b6d4'; // Cyan
    case 'medium':
      return '#f59e0b'; // Amber
    case 'distant':
      return '#8b5cf6'; // Violet
  }
}

/**
 * Checks if a given [lat, lng] is strictly inside a district's polygon geometry.
 */
export function isPointInDistrictPolygon(
  lat: number,
  lng: number,
  districtNumber: number
): boolean {
  const geojson = districtsGeoJsonData as any;
  const feature = geojson.features?.find(
    (f: any) => parseInt(f.properties?.DISTRICT_NUMBER, 10) === districtNumber
  );
  if (!feature || !feature.geometry) return false;

  const geom = feature.geometry;
  const polygons: number[][][] =
    geom.type === 'Polygon'
      ? [geom.coordinates[0]]
      : geom.type === 'MultiPolygon'
      ? geom.coordinates.map((p: any) => p[0])
      : [];

  for (const ring of polygons) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      const intersect =
        yi > lat !== yj > lat &&
        lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

/**
 * Returns today's active collection zone (the district scheduled for pickup today / this week).
 */
export function getTodaysActiveZone(referenceDate: Date = new Date()): {
  districtNumber: number;
  districtName: string;
  dayName: DayOfWeekName;
  dayCode: DayOfWeekCode;
  isTodayAnActivePickupDay: boolean;
  relativeTimeLabel: string;
} {
  const ranked = getRankedPickupSchedules(referenceDate);
  const todayItem = ranked.find((item) => item.daysRemaining === 0) || ranked[0];

  return {
    districtNumber: todayItem.districtNumber,
    districtName: todayItem.districtName,
    dayName: todayItem.dayOfWeek,
    dayCode: todayItem.dayOfWeekCode,
    isTodayAnActivePickupDay: todayItem.daysRemaining === 0,
    relativeTimeLabel: todayItem.relativeTimeLabel,
  };
}

/**
 * Returns badge class string for urgency tier
 */
export function getUrgencyBadgeClasses(tier: UrgencyTier): string {
  switch (tier) {
    case 'active':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'upcoming':
      return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
    case 'medium':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'distant':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
  }
}
