import mongoose from 'mongoose';
import { BLOOD_GROUPS, GENDERS, LIMITS, NAME_PATTERN, NIC_PATTERN, PHONE_PATTERN } from '@mab/shared';

const patientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: LIMITS.NAME_MIN, maxlength: LIMITS.NAME_MAX, match: NAME_PATTERN },
    // National Identity Card number identifies a patient uniquely.
    nic: { type: String, required: true, trim: true, uppercase: true, match: NIC_PATTERN, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true, enum: GENDERS },
    phone: { type: String, required: true, trim: true, match: PHONE_PATTERN },
    email: { type: String, trim: true, lowercase: true, maxlength: LIMITS.EMAIL_MAX, default: '' },
    address: { type: String, trim: true, maxlength: LIMITS.ADDRESS_MAX, default: '' },
    bloodGroup: { type: String, enum: ['', ...BLOOD_GROUPS], default: '' },
    allergies: { type: String, trim: true, maxlength: LIMITS.ALLERGIES_MAX, default: '' },
  },
  { timestamps: true },
);

patientSchema.index({ fullName: 1 });
patientSchema.index({ phone: 1 });

export const Patient = mongoose.model('Patient', patientSchema);
