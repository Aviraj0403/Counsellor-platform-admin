// Small helpers for the appointments screens. India has one timezone (IST, UTC+05:30, no daylight saving).
const IST = 'Asia/Kolkata';
const DAY = 24 * 60 * 60 * 1000;
const IST_MS = 330 * 60 * 1000;

export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: IST, dateStyle: 'medium', timeStyle: 'short' }) : '');
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit' });
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { timeZone: IST, dateStyle: 'medium' });

/** Midnight (IST) of the day containing `d`, as a Date. */
export const istDayStart = (d = new Date()) => new Date(Math.floor((new Date(d).getTime() + IST_MS) / DAY) * DAY - IST_MS);
export const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
/** "2026-11-20" typed in a date box -> midnight IST of that day. */
export const dateInputToIst = (value) => new Date(`${value}T00:00:00+05:30`);
export const istDateInputValue = (d = new Date()) => new Date(new Date(d).getTime() + IST_MS).toISOString().slice(0, 10);

export const STATUS_TONE = { booked: 'blue', confirmed: 'green', completed: 'green', cancelled: 'gray', no_show: 'red', rescheduled: 'amber' };
export const statusLabel = (s) => ({ no_show: 'No-show' })[s] || (s ? s[0].toUpperCase() + s.slice(1) : '');
export const MODE_LABEL = { phone: 'Phone call', video: 'Video call', in_person: 'In person' };
export const DAYS = [
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
  { day: 0, label: 'Sunday' },
];
