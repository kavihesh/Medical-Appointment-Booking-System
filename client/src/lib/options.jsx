import { SLOT_LENGTHS } from '@mab/shared';

/** Appointment lengths as { value, label } options, e.g. { value: '15', label: '15 minutes' }. */
export const SLOT_OPTIONS = SLOT_LENGTHS.map((minutes) => ({ value: String(minutes), label: `${minutes} minutes` }));

/** <option> elements from plain values or { value, label } pairs. */
export const toOptions = (options) =>
  options.map((option) => {
    const { value, label } = typeof option === 'object' ? option : { value: option, label: option };
    return (
      <option key={value} value={value}>
        {label}
      </option>
    );
  });
