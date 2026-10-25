import { z } from 'zod';
import {
  APPOINTMENT_STATUSES,
  BLOOD_GROUPS,
  CLINIC_HOURS,
  DAYS_OF_WEEK,
  DOCTOR_STATUSES,
  GENDERS,
  LIMITS,
  NAME_PATTERN,
  NIC_PATTERN,
  OBJECT_ID_PATTERN,
  PHONE_PATTERN,
  SLMC_PATTERN,
  SLOT_LENGTHS,
  SPECIALTIES,
  TEXT_PATTERN,
  TIME_PATTERN,
} from './constants.js';
import { ageInYears, localDaysFromToday, localToday, to12Hour, toMinutes } from './time.js';

const collapseSpaces = (value) => value.replace(/\s+/g, ' ');

const text = (label, { min, max, pattern, patternMessage }) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .overwrite(collapseSpaces)
    .min(1, `${label} is required`)
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .regex(pattern, patternMessage);

/** Optional text: an empty value is allowed and stored as ''; anything else must pass the same rules. */
const optionalText = (label, { min = 1, max, pattern = TEXT_PATTERN, patternMessage = `${label} contains characters that are not allowed` }) =>
  z
    .string()
    .trim()
    .overwrite(collapseSpaces)
    .max(max, `${label} must be at most ${max} characters`)
    .refine((value) => value === '' || value.length >= min, `${label} must be at least ${min} characters`)
    .refine((value) => value === '' || pattern.test(value), patternMessage)
    .optional();

const personName = (label) =>
  text(label, {
    min: LIMITS.NAME_MIN,
    max: LIMITS.NAME_MAX,
    pattern: NAME_PATTERN,
    patternMessage: `${label} can contain only letters, spaces, dots, apostrophes and hyphens`,
  });

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(LIMITS.EMAIL_MAX, `Email must be at most ${LIMITS.EMAIL_MAX} characters`)
  .pipe(z.email('Enter a valid email address, e.g. name@example.com'));

// Spaces and dashes typed as separators are removed before checking.
const phone = z
  .string({ error: 'Phone number is required' })
  .trim()
  .overwrite((value) => value.replace(/[\s-]/g, ''))
  .min(1, 'Phone number is required')
  .regex(PHONE_PATTERN, 'Enter 10 digits starting with 0, e.g. 0771234567');

const wholeNumber = (label, min, max) =>
  z
    .number({ error: `${label} is required` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

const choice = (label, values) => z.enum(values, { error: `Choose a ${label}` });

const objectId = (label) => z.string({ error: `Choose a ${label}` }).regex(OBJECT_ID_PATTERN, `Choose a ${label}`);

const clockTime = (label) =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .regex(TIME_PATTERN, 'Enter a time such as 8:30 AM');

// ---------- Doctor ----------
export const doctorSchema = z
  .strictObject({
    fullName: personName('Full name'),
    specialty: choice('specialty', SPECIALTIES),
    registrationNo: z
      .string({ error: 'SLMC registration number is required' })
      .trim()
      .min(1, 'SLMC registration number is required')
      .regex(SLMC_PATTERN, 'Enter the 4 to 6 digit SLMC registration number'),
    email,
    phone,
    consultationFee: wholeNumber('Consultation fee', 0, LIMITS.FEE_MAX).multipleOf(
      LIMITS.FEE_STEP,
      `Consultation fee must be in steps of LKR ${LIMITS.FEE_STEP}`,
    ),
    availableDays: z
      .array(choice('day', DAYS_OF_WEEK), { error: 'Choose at least one working day' })
      .min(1, 'Choose at least one working day')
      .refine((days) => new Set(days).size === days.length, 'Each day can be chosen only once'),
    startTime: clockTime('Start time'),
    endTime: clockTime('End time'),
    slotMinutes: z
      .number({ error: 'Choose an appointment length' })
      .refine((value) => SLOT_LENGTHS.includes(value), 'Choose an appointment length'),
    room: optionalText('Room', { max: LIMITS.ROOM_MAX }),
    status: choice('status', DOCTOR_STATUSES).default('Available'),
  })
  .superRefine((value, ctx) => {
    const start = toMinutes(value.startTime);
    const end = toMinutes(value.endTime);
    if (start < toMinutes(CLINIC_HOURS.OPENS)) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: `The clinic opens at ${to12Hour(CLINIC_HOURS.OPENS)}` });
    }
    if (end > toMinutes(CLINIC_HOURS.CLOSES)) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: `The clinic closes at ${to12Hour(CLINIC_HOURS.CLOSES)}` });
    }
    if (end - start < value.slotMinutes) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after the start time, with room for at least one appointment',
      });
    }
  });

// ---------- Patient ----------
export const patientSchema = z.strictObject({
  fullName: personName('Full name'),
  nic: z
    .string({ error: 'NIC number is required' })
    .trim()
    .toUpperCase()
    .min(1, 'NIC number is required')
    .regex(NIC_PATTERN, 'Enter a valid NIC: 9 digits followed by V or X, or 12 digits'),
  dateOfBirth: z.iso
    .date('Enter a valid date of birth')
    .refine((value) => value <= localToday(), 'Date of birth cannot be in the future')
    .refine((value) => ageInYears(value) <= LIMITS.PATIENT_MAX_AGE, `Age must be ${LIMITS.PATIENT_MAX_AGE} years or less`),
  gender: choice('gender', GENDERS),
  phone,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(LIMITS.EMAIL_MAX, `Email must be at most ${LIMITS.EMAIL_MAX} characters`)
    .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter a valid email address, e.g. name@example.com')
    .optional(),
  address: optionalText('Address', { min: 3, max: LIMITS.ADDRESS_MAX }),
  bloodGroup: z
    .string()
    .refine((value) => value === '' || BLOOD_GROUPS.includes(value), 'Choose a blood group')
    .optional(),
  allergies: optionalText('Allergies', { max: LIMITS.ALLERGIES_MAX }),
});

// ---------- Appointment ----------
const reason = text('Reason for visit', {
  min: LIMITS.REASON_MIN,
  max: LIMITS.REASON_MAX,
  pattern: TEXT_PATTERN,
  patternMessage: 'Reason for visit contains characters that are not allowed',
});

const notes = z.string().trim().max(LIMITS.NOTES_MAX, `Notes must be at most ${LIMITS.NOTES_MAX} characters`).optional();

const bookingDate = z.iso
  .date('Choose a valid date')
  .refine(
    (value) => value <= localDaysFromToday(LIMITS.BOOKING_DAYS_AHEAD),
    `Appointments can be booked up to ${LIMITS.BOOKING_DAYS_AHEAD} days ahead`,
  );

/** Booking a new appointment: always starts as Scheduled, on today or a later date. */
export const appointmentSchema = z.strictObject({
  patient: objectId('patient'),
  doctor: objectId('doctor'),
  date: bookingDate.refine((value) => value >= localToday(), 'The date cannot be in the past'),
  time: clockTime('Time'),
  reason,
  notes,
});

/**
 * Editing an appointment: the patient and doctor never change (cancel and book again instead).
 * A past date is allowed for a finished visit, but a Scheduled appointment must be today or later.
 */
export const appointmentUpdateSchema = z
  .strictObject({
    date: bookingDate,
    time: clockTime('Time'),
    reason,
    status: choice('status', APPOINTMENT_STATUSES),
    notes,
  })
  .superRefine((value, ctx) => {
    if (value.status === 'Scheduled' && value.date < localToday()) {
      ctx.addIssue({
        code: 'custom',
        path: ['date'],
        message: 'A scheduled appointment cannot be in the past. Change the date or the status.',
      });
    }
  });

/** Turns a ZodError into `{ fieldErrors: { field: firstMessage }, formErrors: string[] }`. */
export function toValidationErrors(error) {
  const { formErrors, fieldErrors } = z.flattenError(error);
  return {
    formErrors,
    fieldErrors: Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages[0]])),
  };
}
