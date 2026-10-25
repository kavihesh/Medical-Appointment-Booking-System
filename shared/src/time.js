import { DAYS_OF_WEEK } from './constants.js';

/** A date as YYYY-MM-DD in the local time zone (UTC would be a day behind in Sri Lanka before 05:30). */
export function toLocalDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export const localToday = () => toLocalDate(new Date());

/** The local date `days` after today (negative for the past), as YYYY-MM-DD. */
export const localDaysFromToday = (days) => toLocalDate(new Date(Date.now() + days * 86_400_000));

/** "2026-10-26" -> "Monday" (the date is read as a calendar day, so no time zone shift). */
export function dayOfWeek(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
  return DAYS_OF_WEEK[(jsDay + 6) % 7];
}

/** "08:30" -> 510 */
export const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/** 510 -> "08:30" */
export const fromMinutes = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/** "22:00" -> "10:00 PM" (messages use the same 12-hour clock as the app). */
export function to12Hour(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** Every slot start time in a doctor's working hours, e.g. 08:00, 08:15, ... (the last one ends at endTime). */
export function slotTimes({ startTime, endTime, slotMinutes }) {
  const times = [];
  for (let t = toMinutes(startTime); t + slotMinutes <= toMinutes(endTime); t += slotMinutes) times.push(fromMinutes(t));
  return times;
}

/** Whole years between a YYYY-MM-DD birth date and today. */
export function ageInYears(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const [ty, tm, td] = localToday().split('-').map(Number);
  return ty - year - (tm < month || (tm === month && td < day) ? 1 : 0);
}
