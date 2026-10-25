import { dayOfWeek, localToday, slotTimes, to12Hour, toMinutes } from '@mab/shared';
import { AppError } from '../../lib/AppError.js';
import { todayValue, toDateValue, toIsoDate } from '../../lib/dates.js';
import { findPage } from '../../lib/listQuery.js';
import { Doctor } from '../doctors/doctor.model.js';
import { Patient } from '../patients/patient.model.js';
import { Appointment } from './appointment.model.js';

const POPULATE = [
  { path: 'patient', select: 'fullName nic phone' },
  { path: 'doctor', select: 'fullName specialty room consultationFee' },
];

const WHEN_FILTERS = {
  today: () => ({ date: todayValue() }),
  upcoming: () => ({ date: { $gte: todayValue() } }),
  past: () => ({ date: { $lt: todayValue() } }),
};

export function listAppointments({ when, date, status, doctor, patient, ...paging }) {
  const filter = {
    ...(when && WHEN_FILTERS[when]()),
    ...(date && { date: toDateValue(date) }),
    ...(status && { status }),
    ...(doctor && { doctor }),
    ...(patient && { patient }),
  };
  // Sorting by date also sorts by time within each day.
  return findPage(Appointment, filter, paging, { populate: POPULATE, thenBy: paging.sort === 'date' ? ['time'] : [] });
}

export async function getAppointment(id) {
  const appointment = await Appointment.findById(id).populate(POPULATE).lean();
  if (!appointment) throw AppError.notFound('Appointment');
  return appointment;
}

const fieldError = (status, code, field, message) => new AppError(status, code, message, { [field]: message });

/** Checks that the doctor can see a patient at this date and time, and that the slot is still free. */
async function assertBookable(doctor, patientId, isoDate, time, excludeId) {
  if (doctor.status !== 'Available') throw fieldError(400, 'DOCTOR_ON_LEAVE', 'doctor', 'This doctor is on leave and cannot take appointments');
  const day = dayOfWeek(isoDate);
  if (!doctor.availableDays.includes(day)) {
    throw fieldError(400, 'NOT_A_WORKING_DAY', 'date', `This doctor does not see patients on ${day}s`);
  }
  if (!slotTimes(doctor).includes(time)) {
    const message = `Choose a ${doctor.slotMinutes}-minute slot between ${to12Hour(doctor.startTime)} and ${to12Hour(doctor.endTime)}`;
    throw fieldError(400, 'NOT_A_SLOT', 'time', message);
  }
  const now = new Date();
  if (isoDate === localToday() && toMinutes(time) <= now.getHours() * 60 + now.getMinutes()) {
    throw fieldError(400, 'TIME_PASSED', 'time', 'This time has already passed today');
  }

  const others = { status: 'Scheduled', date: toDateValue(isoDate), time, ...(excludeId && { _id: { $ne: excludeId } }) };
  const [doctorBusy, patientBusy] = await Promise.all([
    Appointment.exists({ ...others, doctor: doctor._id }),
    Appointment.exists({ ...others, patient: patientId }),
  ]);
  if (doctorBusy) throw fieldError(409, 'SLOT_TAKEN', 'time', 'This time is already booked. Choose another slot.');
  if (patientBusy) throw fieldError(409, 'PATIENT_BUSY', 'time', 'This patient already has an appointment at this time');
}

/** The unique slot indexes are the final guard if two people book the same slot at the same moment. */
function rethrowSlotConflict(err) {
  if (err.code === 11000) throw fieldError(409, 'SLOT_TAKEN', 'time', 'This time was just booked by someone else. Choose another slot.');
  throw err;
}

export async function createAppointment(data) {
  const [patient, doctor] = await Promise.all([Patient.findById(data.patient).lean(), Doctor.findById(data.doctor).lean()]);
  if (!patient) throw fieldError(400, 'VALIDATION_ERROR', 'patient', 'Patient not found');
  if (!doctor) throw fieldError(400, 'VALIDATION_ERROR', 'doctor', 'Doctor not found');
  await assertBookable(doctor, patient._id, data.date, data.time);

  const appointment = await Appointment.create({ ...data, date: toDateValue(data.date), status: 'Scheduled' }).catch(rethrowSlotConflict);
  return getAppointment(appointment._id);
}

/** Reschedules or updates an appointment. A Scheduled appointment must still fit the doctor's free slots. */
export async function updateAppointment(id, data) {
  const current = await Appointment.findById(id).lean();
  if (!current) throw AppError.notFound('Appointment');

  const isMoved = toIsoDate(current.date) !== data.date || current.time !== data.time;
  const isReopened = current.status !== 'Scheduled';
  if (data.status === 'Scheduled' && (isMoved || isReopened)) {
    const doctor = await Doctor.findById(current.doctor).lean();
    if (!doctor) throw fieldError(400, 'VALIDATION_ERROR', 'doctor', 'Doctor not found');
    await assertBookable(doctor, current.patient, data.date, data.time, id);
  }

  await Appointment.findByIdAndUpdate(id, { ...data, date: toDateValue(data.date) }, { runValidators: true }).catch(rethrowSlotConflict);
  return getAppointment(id);
}

export async function deleteAppointment(id) {
  const appointment = await Appointment.findByIdAndDelete(id).lean();
  if (!appointment) throw AppError.notFound('Appointment');
}
