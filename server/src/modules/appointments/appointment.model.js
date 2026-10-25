import mongoose from 'mongoose';
import { APPOINTMENT_STATUSES, LIMITS, TIME_PATTERN } from '@mab/shared';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    // The calendar day, stored as midnight UTC of that date; the time of day is kept separately as HH:MM.
    date: { type: Date, required: true },
    time: { type: String, required: true, match: TIME_PATTERN },
    reason: { type: String, required: true, trim: true, minlength: LIMITS.REASON_MIN, maxlength: LIMITS.REASON_MAX },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'Scheduled' },
    notes: { type: String, trim: true, maxlength: LIMITS.NOTES_MAX, default: '' },
  },
  { timestamps: true },
);

// No double booking: one scheduled appointment per doctor per slot, and per patient per slot.
// Partial indexes so cancelled or finished appointments free the slot again.
const scheduledOnly = { partialFilterExpression: { status: 'Scheduled' }, unique: true };
appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { ...scheduledOnly, name: 'doctor_slot_unique' });
appointmentSchema.index({ patient: 1, date: 1, time: 1 }, { ...scheduledOnly, name: 'patient_slot_unique' });
// Lists by day and status, and a patient's history.
appointmentSchema.index({ date: 1, time: 1, status: 1 });
appointmentSchema.index({ patient: 1, date: -1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
