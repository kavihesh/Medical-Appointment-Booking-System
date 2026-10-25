import { AppError } from '../../lib/AppError.js';
import { findPage, searchFilter } from '../../lib/listQuery.js';
import { Appointment } from '../appointments/appointment.model.js';
import { Patient } from './patient.model.js';

export function listPatients({ q, gender, bloodGroup, ...paging }) {
  const filter = {
    ...searchFilter(q, ['fullName', 'nic', 'phone', 'email']),
    ...(gender && { gender }),
    ...(bloodGroup && { bloodGroup }),
  };
  return findPage(Patient, filter, paging);
}

/** A patient with their appointment history, newest first. */
export async function getPatient(id) {
  const patient = await Patient.findById(id).lean();
  if (!patient) throw AppError.notFound('Patient');

  const appointments = await Appointment.find({ patient: id })
    .sort({ date: -1, time: -1 })
    .populate('doctor', 'fullName specialty room consultationFee')
    .lean();
  return { ...patient, appointments };
}

export async function createPatient(data) {
  const patient = await Patient.create(data);
  return patient.toObject();
}

export async function updatePatient(id, data) {
  const patient = await Patient.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean();
  if (!patient) throw AppError.notFound('Patient');
  return patient;
}

/** Refuses to delete a patient who has appointments, so the clinic's records stay complete. */
export async function deletePatient(id) {
  // shortcut: count-then-delete is not atomic; use a transaction if several staff edit at once.
  const count = await Appointment.countDocuments({ patient: id });
  if (count > 0) {
    throw AppError.conflict('HAS_APPOINTMENTS', `This patient has ${count} appointment(s). Delete them before deleting the patient.`);
  }
  const patient = await Patient.findByIdAndDelete(id).lean();
  if (!patient) throw AppError.notFound('Patient');
}
