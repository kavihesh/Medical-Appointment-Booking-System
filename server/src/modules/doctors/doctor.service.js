import { dayOfWeek, LIMITS, localDaysFromToday, localToday, slotTimes, toMinutes } from '@mab/shared';
import { AppError } from '../../lib/AppError.js';
import { todayValue, toDateValue, toIsoDate } from '../../lib/dates.js';
import { findPage, searchFilter } from '../../lib/listQuery.js';
import { Appointment } from '../appointments/appointment.model.js';
import { Doctor } from './doctor.model.js';

const UPCOMING_LIMIT = 20;

export function listDoctors({ q, specialty, status, day, ...paging }) {
  const filter = {
    ...searchFilter(q, ['fullName', 'specialty', 'registrationNo', 'room']),
    ...(specialty && { specialty }),
    ...(status && { status }),
    ...(day && { availableDays: day }),
  };
  return findPage(Doctor, filter, paging);
}

const upcomingFilter = (doctorId) => ({ doctor: doctorId, status: 'Scheduled', date: { $gte: todayValue() } });

/** A doctor with their next scheduled appointments. */
export async function getDoctor(id) {
  const doctor = await Doctor.findById(id).lean();
  if (!doctor) throw AppError.notFound('Doctor');

  const [upcoming, upcomingCount] = await Promise.all([
    Appointment.find(upcomingFilter(id))
      .sort({ date: 1, time: 1 })
      .limit(UPCOMING_LIMIT)
      .populate('patient', 'fullName nic phone')
      .lean(),
    Appointment.countDocuments(upcomingFilter(id)),
  ]);
  return { ...doctor, upcoming, upcomingCount };
}

export async function createDoctor(data) {
  const doctor = await Doctor.create(data);
  return doctor.toObject();
}

/**
 * Updates a doctor. Changes that would strand booked patients are refused: going on leave, or a new
 * schedule that no longer contains an upcoming appointment's day or time slot.
 */
export async function updateDoctor(id, data) {
  const upcoming = await Appointment.find(upcomingFilter(id), 'date time').lean();
  if (upcoming.length > 0 && data.status === 'On leave') {
    const message = `This doctor has ${upcoming.length} upcoming appointment(s). Cancel or reschedule them before marking the doctor on leave.`;
    throw AppError.conflict('HAS_UPCOMING_APPOINTMENTS', message, { status: message });
  }
  const validTimes = new Set(slotTimes(data));
  const stranded = upcoming.filter((a) => !data.availableDays.includes(dayOfWeek(toIsoDate(a.date))) || !validTimes.has(a.time));
  if (stranded.length > 0) {
    const message = `${stranded.length} upcoming appointment(s) would fall outside the new schedule. Reschedule or cancel them first.`;
    throw AppError.conflict('SCHEDULE_CONFLICT', message, { availableDays: message });
  }

  const doctor = await Doctor.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean();
  if (!doctor) throw AppError.notFound('Doctor');
  return doctor;
}

/** Refuses to delete a doctor who has any appointments, so no appointment points to a missing doctor. */
export async function deleteDoctor(id) {
  // shortcut: count-then-delete is not atomic; fine for one clinic desk, use a transaction if several staff edit at once.
  const count = await Appointment.countDocuments({ doctor: id });
  if (count > 0) {
    throw AppError.conflict('HAS_APPOINTMENTS', `This doctor has ${count} appointment(s). Delete or reassign them before deleting the doctor.`);
  }
  const doctor = await Doctor.findByIdAndDelete(id).lean();
  if (!doctor) throw AppError.notFound('Doctor');
}

/**
 * The doctor's time slots on one day, each marked free, booked or past.
 * Returns `available: false` with a reason when the doctor does not work that day.
 */
export async function getSlots(id, isoDate) {
  const doctor = await Doctor.findById(id).lean();
  if (!doctor) throw AppError.notFound('Doctor');
  if (isoDate < localToday() || isoDate > localDaysFromToday(LIMITS.BOOKING_DAYS_AHEAD)) {
    const message = `Choose a date from today up to ${LIMITS.BOOKING_DAYS_AHEAD} days ahead`;
    throw new AppError(400, 'VALIDATION_ERROR', message, { date: message });
  }

  const day = dayOfWeek(isoDate);
  if (doctor.status !== 'Available') {
    return { date: isoDate, day, available: false, reason: 'This doctor is on leave.', slots: [] };
  }
  if (!doctor.availableDays.includes(day)) {
    return { date: isoDate, day, available: false, reason: `This doctor does not see patients on ${day}s.`, slots: [] };
  }

  const booked = await Appointment.find({ doctor: id, date: toDateValue(isoDate), status: 'Scheduled' }, 'time').lean();
  const bookedTimes = new Set(booked.map((a) => a.time));
  const now = new Date();
  const nowMinutes = isoDate === localToday() ? now.getHours() * 60 + now.getMinutes() : -1;
  const slots = slotTimes(doctor).map((time) => ({
    time,
    status: bookedTimes.has(time) ? 'booked' : toMinutes(time) <= nowMinutes ? 'past' : 'free',
  }));
  return { date: isoDate, day, available: true, slots };
}
