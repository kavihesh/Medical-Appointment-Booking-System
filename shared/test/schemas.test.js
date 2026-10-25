import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  appointmentSchema,
  appointmentUpdateSchema,
  dayOfWeek,
  doctorSchema,
  localDaysFromToday,
  localToday,
  patientSchema,
  slotTimes,
  toValidationErrors,
} from '../src/index.js';

const validDoctor = {
  fullName: '  Nirmala   Perera ',
  specialty: 'Cardiology',
  registrationNo: '23456',
  email: ' N.Perera@Example.COM ',
  phone: '077-123 4567',
  consultationFee: 2500,
  availableDays: ['Monday', 'Wednesday'],
  startTime: '08:00',
  endTime: '12:00',
  slotMinutes: 15,
  room: 'Room 3',
};

const validPatient = {
  fullName: 'Kamal Silva',
  nic: '199512345678',
  dateOfBirth: '1995-04-12',
  gender: 'Male',
  phone: '0712345678',
};

const ID = '507f1f77bcf86cd799439011';

const fieldErrorsOf = (schema, input) => {
  const result = schema.safeParse(input);
  assert.equal(result.success, false, 'expected validation to fail');
  return toValidationErrors(result.error).fieldErrors;
};

test('doctor: trims and normalises input, defaults status to Available', () => {
  const doctor = doctorSchema.parse(validDoctor);
  assert.equal(doctor.fullName, 'Nirmala Perera');
  assert.equal(doctor.email, 'n.perera@example.com');
  assert.equal(doctor.phone, '0771234567');
  assert.equal(doctor.status, 'Available');
});

test('doctor: registration number, fee steps, days and working hours are checked', () => {
  const errors = fieldErrorsOf(doctorSchema, {
    ...validDoctor,
    registrationNo: 'AB12',
    consultationFee: 2525,
    availableDays: [],
    startTime: '05:00',
    endTime: '23:00',
  });
  assert.match(errors.registrationNo, /4 to 6 digit/);
  assert.equal(errors.consultationFee, 'Consultation fee must be in steps of LKR 50');
  assert.equal(errors.availableDays, 'Choose at least one working day');
  assert.match(errors.startTime, /opens at 6:00 AM/);
  assert.match(errors.endTime, /closes at 10:00 PM/);
});

test('doctor: end time must leave room for one appointment', () => {
  const errors = fieldErrorsOf(doctorSchema, { ...validDoctor, startTime: '10:00', endTime: '10:10' });
  assert.match(errors.endTime, /at least one appointment/);
});

test('patient: valid input passes; NIC is upper-cased; optional fields may be empty', () => {
  const patient = patientSchema.parse({ ...validPatient, nic: '951234567v', email: '', address: '', bloodGroup: '' });
  assert.equal(patient.nic, '951234567V');
  assert.equal(patientSchema.safeParse({ ...validPatient, fullName: 'කමල් සිල්වා' }).success, true);
});

test('patient: wrong NIC, future birth date, bad email and digits in name are rejected', () => {
  const errors = fieldErrorsOf(patientSchema, {
    ...validPatient,
    fullName: 'Kamal 2',
    nic: '12345',
    dateOfBirth: localDaysFromToday(5),
    email: 'kamal@',
    bloodGroup: 'Z+',
  });
  assert.match(errors.fullName, /only letters/);
  assert.match(errors.nic, /valid NIC/);
  assert.equal(errors.dateOfBirth, 'Date of birth cannot be in the future');
  assert.match(errors.email, /valid email/);
  assert.equal(errors.bloodGroup, 'Choose a blood group');
});

test('patient: unknown fields are rejected', () => {
  const result = patientSchema.safeParse({ ...validPatient, isAdmin: true });
  assert.equal(result.success, false);
  assert.match(toValidationErrors(result.error).formErrors[0], /isAdmin/);
});

test('appointment: date must be today or later and within the booking window', () => {
  const base = { patient: ID, doctor: ID, time: '09:00', reason: 'Chest pain' };
  assert.equal(appointmentSchema.safeParse({ ...base, date: localToday() }).success, true);
  assert.equal(fieldErrorsOf(appointmentSchema, { ...base, date: localDaysFromToday(-1) }).date, 'The date cannot be in the past');
  assert.match(fieldErrorsOf(appointmentSchema, { ...base, date: localDaysFromToday(120) }).date, /90 days ahead/);
  assert.equal(fieldErrorsOf(appointmentSchema, { ...base, date: localToday(), reason: 'ab' }).reason, 'Reason for visit must be at least 3 characters');
});

test('appointment update: a scheduled visit cannot be in the past, a completed one can', () => {
  const base = { time: '09:00', reason: 'Follow-up', date: localDaysFromToday(-3) };
  assert.match(fieldErrorsOf(appointmentUpdateSchema, { ...base, status: 'Scheduled' }).date, /cannot be in the past/);
  assert.equal(appointmentUpdateSchema.safeParse({ ...base, status: 'Completed' }).success, true);
  assert.equal(appointmentUpdateSchema.safeParse({ ...base, status: 'Completed', patient: ID }).success, false);
});

test('time helpers: day of week and slot times', () => {
  assert.equal(dayOfWeek('2026-10-26'), 'Monday');
  assert.deepEqual(slotTimes({ startTime: '08:00', endTime: '09:00', slotMinutes: 20 }), ['08:00', '08:20', '08:40']);
});
