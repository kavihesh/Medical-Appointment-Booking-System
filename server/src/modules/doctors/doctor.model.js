import mongoose from 'mongoose';
import {
  DAYS_OF_WEEK,
  DOCTOR_STATUSES,
  LIMITS,
  NAME_PATTERN,
  PHONE_PATTERN,
  SLMC_PATTERN,
  SLOT_LENGTHS,
  SPECIALTIES,
  TIME_PATTERN,
} from '@mab/shared';

const integer = { validator: Number.isInteger, message: '{PATH} must be a whole number' };

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: LIMITS.NAME_MIN, maxlength: LIMITS.NAME_MAX, match: NAME_PATTERN },
    specialty: { type: String, required: true, enum: SPECIALTIES },
    // Sri Lanka Medical Council registration number; one record per doctor.
    registrationNo: { type: String, required: true, trim: true, match: SLMC_PATTERN, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: LIMITS.EMAIL_MAX, unique: true },
    phone: { type: String, required: true, trim: true, match: PHONE_PATTERN },
    // Whole Sri Lankan rupees, stored as an integer to avoid float rounding.
    consultationFee: { type: Number, required: true, min: 0, max: LIMITS.FEE_MAX, validate: integer },
    availableDays: {
      type: [{ type: String, enum: DAYS_OF_WEEK }],
      validate: { validator: (days) => days.length > 0, message: 'Choose at least one working day' },
    },
    startTime: { type: String, required: true, match: TIME_PATTERN },
    endTime: { type: String, required: true, match: TIME_PATTERN },
    slotMinutes: { type: Number, required: true, enum: SLOT_LENGTHS },
    room: { type: String, trim: true, maxlength: LIMITS.ROOM_MAX, default: '' },
    status: { type: String, enum: DOCTOR_STATUSES, default: 'Available' },
  },
  { timestamps: true },
);

// Supports the list page: default sort by name, and filtering by specialty and status.
doctorSchema.index({ fullName: 1 });
doctorSchema.index({ specialty: 1, status: 1 });

export const Doctor = mongoose.model('Doctor', doctorSchema);
