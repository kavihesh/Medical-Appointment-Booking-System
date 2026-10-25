// Single source of truth for allowed values and limits.
// Used by the React forms, the Express validators and the Mongoose schemas.

export const SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Paediatrics',
  'Orthopaedics',
  'Gynaecology',
  'ENT',
  'Neurology',
  'Psychiatry',
  'Ophthalmology',
  'Dentistry',
];

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DOCTOR_STATUSES = ['Available', 'On leave'];

export const GENDERS = ['Male', 'Female', 'Other'];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const APPOINTMENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];

// Length of one appointment slot, in minutes.
export const SLOT_LENGTHS = [10, 15, 20, 30];

export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 254,
  ROOM_MAX: 30,
  ADDRESS_MAX: 200,
  ALLERGIES_MAX: 200,
  REASON_MIN: 3,
  REASON_MAX: 200,
  NOTES_MAX: 300,
  FEE_MAX: 50000,
  FEE_STEP: 50,
  PATIENT_MAX_AGE: 120,
  // How far ahead an appointment can be booked.
  BOOKING_DAYS_AHEAD: 90,
  SEARCH_MAX: 100,
  PAGE_SIZE_DEFAULT: 10,
  PAGE_SIZE_MAX: 50,
};

// The clinic is open between these times (24-hour clock).
export const CLINIC_HOURS = { OPENS: '06:00', CLOSES: '22:00' };

// People's names: letters in any script (Sinhala and Tamil included), spaces, dots, apostrophes and hyphens.
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M} .'-]*$/u;

// Free text such as rooms and addresses.
export const TEXT_PATTERN = /^[\p{L}\p{M}\p{N} .,'&()/:+#-]+$/u;

// Sri Lankan phone numbers: 10 digits starting with 0 (e.g. 0771234567).
export const PHONE_PATTERN = /^0\d{9}$/;

// Sri Lankan National Identity Card: old format 9 digits + V or X, new format 12 digits.
export const NIC_PATTERN = /^(\d{9}[VX]|\d{12})$/;

// Sri Lanka Medical Council registration number: 4 to 6 digits.
export const SLMC_PATTERN = /^\d{4,6}$/;

// 24-hour clock, e.g. 07:30 or 16:00.
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
