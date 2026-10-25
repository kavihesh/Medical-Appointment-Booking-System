import { LIMITS, localDaysFromToday, localToday } from '@mab/shared';
import { Icon } from '../../components/Icon.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatTime } from '../../lib/format.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when the slots endpoint accepts this date: today up to the booking limit. */
const isBookableDate = (date) =>
  ISO_DATE.test(date) && date >= localToday() && date <= localDaysFromToday(LIMITS.BOOKING_DAYS_AHEAD);

/**
 * The doctor's time slots on one day as buttons: free ones can be picked, booked and past ones are crossed out.
 * `ownSlot` ({ date, time }) is the appointment being edited, so its own slot counts as free.
 */
export function SlotPicker({ doctorId, date, value, onChange, error, ownSlot }) {
  const canLoad = Boolean(doctorId) && isBookableDate(date);
  const { data, error: loadError } = useApi(canLoad ? `/doctors/${doctorId}/slots?date=${date}` : null);
  const messageId = 'field-time-message';

  let body;
  if (!doctorId || !date) {
    body = <p className="muted">Choose a doctor and a date to see the free times.</p>;
  } else if (!canLoad) {
    body = <p className="muted">Choose a date from today up to {LIMITS.BOOKING_DAYS_AHEAD} days ahead.</p>;
  } else if (loadError) {
    body = <p className="field-error">{loadError.message}</p>;
  } else if (!data) {
    body = <p className="muted">Loading times...</p>;
  } else if (!data.available) {
    body = (
      <p className="preview preview-warning">
        <Icon name="alert" size={16} />
        {data.reason} Choose another date.
      </p>
    );
  } else {
    const slots = data.slots.map((slot) =>
      ownSlot && ownSlot.date === date && ownSlot.time === slot.time ? { ...slot, status: 'free' } : slot,
    );
    const freeCount = slots.filter((s) => s.status === 'free').length;
    body = (
      <>
        <p className="muted">
          {data.day}: {freeCount === 0 ? 'fully booked. Choose another date.' : `${freeCount} of ${slots.length} times free.`}
        </p>
        <ul className="slot-grid">
          {slots.map((slot, index) => {
            const isFree = slot.status === 'free';
            const label = `${formatTime(slot.time)}${isFree ? '' : slot.status === 'booked' ? ', booked' : ', passed'}`;
            return (
              <li key={slot.time}>
                <button
                  type="button"
                  id={index === 0 ? 'field-time' : undefined}
                  className="slot-btn"
                  disabled={!isFree}
                  aria-pressed={value === slot.time}
                  aria-label={label}
                  onClick={() => onChange(slot.time)}
                >
                  {formatTime(slot.time)}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="slot-legend" aria-hidden="true">
          <span>Free</span>
          <span className="legend-selected">Selected</span>
          <span className="legend-taken">Booked or passed</span>
        </p>
      </>
    );
  }

  return (
    <fieldset className={`field field-wide${error ? ' field-invalid' : ''}`} aria-describedby={error ? messageId : undefined}>
      <legend>Time</legend>
      {body}
      {error && (
        <p id={messageId} className="field-error">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </fieldset>
  );
}
