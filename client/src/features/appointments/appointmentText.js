import { formatDate, formatTime } from '../../lib/format.js';

/** Words for the delete dialog; cancelling is suggested because it keeps the visit on record. */
export const describeAppointmentDelete = (a) => ({
  path: `/appointments/${a._id}`,
  name: 'Appointment',
  title: 'Delete this appointment?',
  message: `${a.patient.fullName}'s appointment on ${formatDate(a.date)} at ${formatTime(a.time)} is removed permanently. To keep it on record, edit it and set the status to Cancelled instead.`,
  doneMessage: 'Appointment deleted',
});
