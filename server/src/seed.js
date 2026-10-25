// Loads sample data for development and demos: `npm run seed` (empty database only)
// or `npm run seed:reset` (deletes ALL doctors, patients and appointments first).
import { dayOfWeek, localDaysFromToday } from '@mab/shared';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { loadEnv } from './config/env.js';
import { toDateValue } from './lib/dates.js';
import { Appointment } from './modules/appointments/appointment.model.js';
import { Doctor } from './modules/doctors/doctor.model.js';
import { Patient } from './modules/patients/patient.model.js';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const doctors = [
  {
    fullName: 'Nirmala Perera',
    specialty: 'Cardiology',
    registrationNo: '23456',
    email: 'nirmala.perera@example.com',
    phone: '0771234567',
    consultationFee: 3500,
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    startTime: '08:00',
    endTime: '12:00',
    slotMinutes: 20,
    room: 'Room 3',
  },
  {
    fullName: 'Ruwan Jayasinghe',
    specialty: 'General Practice',
    registrationNo: '31207',
    email: 'ruwan.j@example.com',
    phone: '0712345678',
    consultationFee: 2000,
    availableDays: [...WEEKDAYS, 'Saturday'],
    startTime: '09:00',
    endTime: '17:00',
    slotMinutes: 15,
    room: 'Room 1',
  },
  {
    fullName: 'Shanika Fernando',
    specialty: 'Paediatrics',
    registrationNo: '28841',
    email: 'shanika.fernando@example.com',
    phone: '0763456789',
    consultationFee: 3000,
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    startTime: '14:00',
    endTime: '18:00',
    slotMinutes: 20,
    room: 'Room 5',
  },
];

const patients = [
  { fullName: 'Kamal Silva', nic: '198512345678', dateOfBirth: '1985-03-14', gender: 'Male', phone: '0778765432', email: 'kamal.silva@example.com', address: '12 Lake Road, Galle', bloodGroup: 'O+', allergies: 'Penicillin' },
  { fullName: 'Dilini Wickramasinghe', nic: '957654321V', dateOfBirth: '1995-09-02', gender: 'Female', phone: '0714567890', email: '', address: '45 Temple Road, Matara', bloodGroup: 'A+', allergies: '' },
  { fullName: 'Sahan Bandara', nic: '201812345678', dateOfBirth: '2018-06-21', gender: 'Male', phone: '0756789012', email: '', address: '8 Hill Street, Kandy', bloodGroup: 'B+', allergies: '' },
];

/** The next date (from tomorrow) that falls on one of the doctor's working days, as YYYY-MM-DD. */
function nextWorkingDay(doctor, afterDays = 1) {
  for (let d = afterDays; d < afterDays + 7; d += 1) {
    const date = localDaysFromToday(d);
    if (doctor.availableDays.includes(dayOfWeek(date))) return date;
  }
  throw new Error('Doctor has no working days');
}

// [patient index, doctor index, time, reason]
const appointments = [
  [0, 0, '08:40', 'Chest pain and shortness of breath'],
  [1, 1, '10:15', 'Fever and sore throat'],
  [2, 2, '14:40', 'Routine check-up and vaccination'],
];

const env = loadEnv();
const isReset = process.argv.includes('--reset');

try {
  await connectDatabase(env.MONGODB_URI);
  const existing = await Promise.all([Doctor, Patient, Appointment].map((M) => M.estimatedDocumentCount()));
  if (existing.some(Boolean) && !isReset) {
    console.log('The database already has data. Run `npm run seed:reset` to replace it (this deletes everything).');
    process.exitCode = 1;
  } else {
    await Promise.all([Appointment.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);
    // Build the indexes first so the double-booking rules are active from the start.
    await Promise.all([Doctor, Patient, Appointment].map((M) => M.syncIndexes()));
    const savedDoctors = await Doctor.insertMany(doctors);
    const savedPatients = await Patient.insertMany(patients);
    await Appointment.insertMany(
      appointments.map(([p, d, time, reason]) => ({
        patient: savedPatients[p]._id,
        doctor: savedDoctors[d]._id,
        date: toDateValue(nextWorkingDay(doctors[d])),
        time,
        reason,
      })),
    );
    console.log(`Seeded ${doctors.length} doctors, ${patients.length} patients, ${appointments.length} appointments.`);
  }
} finally {
  await disconnectDatabase();
}
