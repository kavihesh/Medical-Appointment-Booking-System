import { ageInYears, toMinutes } from '@mab/shared';

const currency = new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });
const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatFee = (amount) => currency.format(amount);

/** A stored calendar date (ISO string or Date at midnight UTC) -> "Mon, 27 Oct 2026". */
export const formatDate = (value) => (value ? longDate.format(new Date(value)) : '-');

/** -> "27 Oct 2026" */
export const formatShortDate = (value) => (value ? shortDate.format(new Date(value)) : '-');

/** A record timestamp (createdAt) shown in local time -> "27 Oct 2026". */
export const formatTimestamp = (value) =>
  value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '-';

/** 510 -> "8:30 AM" */
function minutesToLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** "08:30" -> "8:30 AM" */
export const formatTime = (time) => minutesToLabel(toMinutes(time));

/** "08:00", "12:00" -> "8:00 AM - 12:00 PM" */
export const formatHours = (start, end) => `${formatTime(start)} - ${formatTime(end)}`;

/** ['Monday', 'Wednesday'] -> "Mon, Wed" */
export const formatDays = (days) => days.map((day) => day.slice(0, 3)).join(', ');

/** Stored date -> value for <input type="date">. */
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/** Stored birth date -> "41 years" */
export const formatAge = (value) => {
  if (!value) return '-';
  const years = ageInYears(toDateInput(value));
  return years === 1 ? '1 year' : `${years} years`;
};

export const doctorName = (doctor) => `Dr. ${doctor.fullName}`;

/** plural(1, 'patient') -> "1 patient"; plural(3, 'class', 'classes') -> "3 classes" */
export const plural = (count, noun, pluralNoun = `${noun}s`) => `${count} ${count === 1 ? noun : pluralNoun}`;
