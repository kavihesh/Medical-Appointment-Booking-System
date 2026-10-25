import { localToday } from '@mab/shared';

/** "2026-10-26" -> Date at midnight UTC, the form appointment dates are stored in. */
export const toDateValue = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`);

/** Stored Date -> "2026-10-26". */
export const toIsoDate = (date) => date.toISOString().slice(0, 10);

/** Today's local calendar day as a stored Date value. */
export const todayValue = () => toDateValue(localToday());
