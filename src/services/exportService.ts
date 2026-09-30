/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PickupScheduleItem } from '../types';

/**
 * Downloads an .ics (iCalendar) file for a Large Item Pickup date so residents
 * can import it directly to Apple Calendar, Google Calendar, Outlook, or phone calendar.
 */
export function exportToICalendar(item: PickupScheduleItem) {
  const pickupDate = new Date(item.nextPickupDate + 'T06:00:00');
  const endDate = new Date(item.nextPickupDate + 'T17:00:00');

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//City of Denver//Large Item Pickup Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:denver-lip-${item.id}-${Date.now()}@denvergov.org`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(pickupDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Denver Large Item Pickup - ${item.districtName}`,
    `DESCRIPTION:Scheduled Denver Large Item Pickup (LIP / Extra Trash).\\n- District: ${item.districtName}\\n- Day: ${item.dayOfWeek}\\n- Set out by 6:00 AM at normal trash location (street or alley).\\n- Limits: Up to 5 large items + 10 extra bags.\\n- Mattresses must be enclosed in plastic bags.\\n- Branches bundled under 4ft.\\nMore info: https://denvergov.org/trash`,
    'LOCATION:Denver, CO',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT12H', // Reminder 12 hours before (previous evening at 6 PM)
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Set out up to 5 large items & 10 extra bags tonight for tomorrow morning pickup!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Denver_Large_Item_Pickup_${item.districtNumber}_${item.dayOfWeekCode}_${item.nextPickupDate}.ics`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports ranked schedules to CSV
 */
export function exportSchedulesToCSV(items: PickupScheduleItem[]) {
  const headers = [
    'RANK',
    'DISTRICT',
    'REGION',
    'DAY_OF_WEEK',
    'NEXT_PICKUP_DATE',
    'DAYS_REMAINING',
    'STATUS',
    'CYCLE_AREA',
    'NEIGHBORHOODS',
  ];

  const rows = items.map((item, idx) => [
    idx + 1,
    `"${item.districtName}"`,
    `"${item.regionName}"`,
    item.dayOfWeek,
    item.nextPickupDate,
    item.daysRemaining,
    `"${item.relativeTimeLabel}"`,
    item.cycleArea,
    `"${item.neighborhoods.join(', ')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `denver_large_item_pickup_schedule_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
