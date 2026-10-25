import {
  APPOINTMENT_STATUSES,
  appointmentSchema,
  appointmentUpdateSchema,
  LIMITS,
  localDaysFromToday,
  localToday,
} from '@mab/shared';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { api } from '../../api/client.js';
import { Avatar } from '../../components/Avatar.jsx';
import { ChoiceGroup, Field } from '../../components/Field.jsx';
import { FormActions, FormSection } from '../../components/FormLayout.jsx';
import { Icon } from '../../components/Icon.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorMessage, Loading } from '../../components/States.jsx';
import { useToast } from '../../components/Toast.jsx';
import { OPTIONS_PAGE_SIZE } from '../../config.js';
import { useApi } from '../../hooks/useApi.js';
import { useForm } from '../../hooks/useForm.js';
import { doctorName, formatDate, formatDays, formatFee, formatTime, toDateInput } from '../../lib/format.js';
import { PatientCombobox } from './PatientCombobox.jsx';
import { SlotPicker } from './SlotPicker.jsx';

const CRUMBS = [{ label: 'Appointments', to: '/appointments' }];

const STATUS_HINTS = {
  Scheduled: 'Booked and holding the time slot.',
  Completed: 'The patient was seen. The visit stays in their history.',
  Cancelled: 'Called off. The time slot becomes free for others.',
  'No-show': 'The patient did not come. The time slot is released.',
};

/** /appointments/new (optionally ?patient= or ?doctor= preselected) and /appointments/:id/edit. */
export function AppointmentFormPage() {
  const { id } = useParams();
  return id ? <EditAppointment id={id} /> : <BookAppointment />;
}

function BookAppointment() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  const presetPatientId = searchParams.get('patient');
  const presetDoctorId = searchParams.get('doctor');
  const backTo = presetPatientId ? `/patients/${presetPatientId}` : presetDoctorId ? `/doctors/${presetDoctorId}` : '/appointments';

  const [pickedPatient, setPickedPatient] = useState(null);
  const { data: presetPatient } = useApi(presetPatientId ? `/patients/${presetPatientId}` : null);
  const { data: doctors, error: doctorsError } = useApi(`/doctors?status=Available&sort=fullName&limit=${OPTIONS_PAGE_SIZE}`);

  const { values, errors, formError, isSubmitting, field, setFields, handleSubmit } = useForm({
    initialValues: { patient: presetPatientId ?? '', doctor: presetDoctorId ?? '', date: '', time: '', reason: '', notes: '' },
    schema: appointmentSchema,
    onSubmit: async (payload) => {
      const saved = await api.post('/appointments', payload);
      showToast(`Booked ${saved.patient.fullName} with ${doctorName(saved.doctor)} on ${formatDate(saved.date)} at ${formatTime(saved.time)}`);
      navigate(backTo);
    },
  });

  const patient = presetPatient ?? pickedPatient;
  const doctor = doctors?.items.find((d) => d._id === values.doctor);

  return (
    <>
      <PageHeader title="Book an appointment" subtitle="Pick the patient, the doctor, then a free time." crumbs={CRUMBS} />

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Patient" description="Search the registered patients.">
          {presetPatientId ? (
            <div className="selected-card field-wide">
              {presetPatient ? (
                <>
                  <Avatar name={presetPatient.fullName} />
                  <div>
                    <strong>{presetPatient.fullName}</strong>
                    <div className="subline">
                      NIC {presetPatient.nic} · {presetPatient.phone}
                    </div>
                  </div>
                  <Link to="/appointments/new" className="btn btn-ghost btn-sm selected-change">
                    Change
                  </Link>
                </>
              ) : (
                'Loading...'
              )}
            </div>
          ) : (
            <PatientCombobox
              patient={pickedPatient}
              onSelect={(p) => {
                setPickedPatient(p);
                setFields({ patient: p?._id ?? '' });
              }}
              error={errors.patient}
            />
          )}
        </FormSection>

        <FormSection title="Doctor and time" description="Only doctors who are available are listed. Booked times cannot be chosen.">
          <Field
            label="Doctor"
            as="select"
            wide
            {...field('doctor')}
            onChange={(event) => setFields({ doctor: event.target.value, time: '' })}
            error={errors.doctor ?? doctorsError?.message}
          >
            <option value="">{doctors ? 'Choose a doctor' : 'Loading doctors...'}</option>
            {doctors?.items.map((d) => (
              <option key={d._id} value={d._id}>
                {doctorName(d)}, {d.specialty}
              </option>
            ))}
          </Field>
          <Field
            label="Date"
            type="date"
            min={localToday()}
            max={localDaysFromToday(LIMITS.BOOKING_DAYS_AHEAD)}
            hint={doctor ? `${doctorName(doctor)} sees patients on ${formatDays(doctor.availableDays)}.` : `Today up to ${LIMITS.BOOKING_DAYS_AHEAD} days ahead.`}
            {...field('date')}
            onChange={(event) => setFields({ date: event.target.value, time: '' })}
          />
          <SlotPicker
            doctorId={values.doctor}
            date={values.date}
            value={values.time}
            onChange={(time) => setFields({ time })}
            error={errors.time}
          />
        </FormSection>

        <FormSection title="Visit" description="Why the patient is coming, for the doctor to read.">
          <VisitFields field={field} />
        </FormSection>

        {patient && doctor && values.date && values.time && (
          <BookingSummary patient={patient} doctor={doctor} date={values.date} time={values.time} />
        )}

        <FormActions formError={formError} isSubmitting={isSubmitting} submitLabel="Book appointment" cancelTo={backTo} />
      </form>
    </>
  );
}

function EditAppointment({ id }) {
  const { data: appointment, error, reload } = useApi(`/appointments/${id}`);
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!appointment) return <Loading />;
  return <EditAppointmentForm appointment={appointment} />;
}

function EditAppointmentForm({ appointment }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const { patient, doctor } = appointment;
  const original = { date: toDateInput(appointment.date), time: appointment.time };
  const backTo = '/appointments';

  const { values, errors, formError, isSubmitting, field, setFields, handleSubmit } = useForm({
    initialValues: { ...original, reason: appointment.reason, status: appointment.status, notes: appointment.notes ?? '' },
    schema: appointmentUpdateSchema,
    onSubmit: async (payload) => {
      await api.put(`/appointments/${appointment._id}`, payload);
      showToast(`Appointment for ${patient.fullName} was updated`);
      navigate(backTo);
    },
  });

  const isScheduled = values.status === 'Scheduled';

  return (
    <>
      <PageHeader
        title="Edit appointment"
        subtitle={`${patient.fullName} with ${doctorName(doctor)}`}
        crumbs={CRUMBS}
      />
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Patient and doctor" description="These cannot change. To switch, cancel this appointment and book a new one.">
          <div className="selected-card field-wide">
            <Avatar name={patient.fullName} />
            <div>
              <Link to={`/patients/${patient._id}`} className="row-link">
                {patient.fullName}
              </Link>
              <div className="subline">NIC {patient.nic}</div>
            </div>
          </div>
          <div className="selected-card field-wide">
            <span className="selected-icon">
              <Icon name="doctors" size={18} />
            </span>
            <div>
              <Link to={`/doctors/${doctor._id}`} className="row-link">
                {doctorName(doctor)}
              </Link>
              <div className="subline">
                {doctor.specialty}
                {doctor.room && ` · ${doctor.room}`}
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Status" description="Mark the visit as done, cancelled or missed. Only scheduled visits hold a time slot.">
          <ChoiceGroup label="Status" options={APPOINTMENT_STATUSES} hint={STATUS_HINTS[values.status]} wide {...field('status')} />
        </FormSection>

        <FormSection
          title={isScheduled ? 'Reschedule' : 'Date and time'}
          description={isScheduled ? 'Pick a new date or time, or keep the current one.' : 'When the visit was booked for.'}
        >
          <Field
            label="Date"
            type="date"
            min={isScheduled ? localToday() : undefined}
            max={localDaysFromToday(LIMITS.BOOKING_DAYS_AHEAD)}
            {...field('date')}
            onChange={(event) => setFields({ date: event.target.value, ...(isScheduled && { time: '' }) })}
          />
          {isScheduled ? (
            <SlotPicker
              doctorId={doctor._id}
              date={values.date}
              value={values.time}
              onChange={(time) => setFields({ time })}
              error={errors.time}
              ownSlot={appointment.status === 'Scheduled' ? original : undefined}
            />
          ) : (
            <Field label="Time" type="time" {...field('time')} />
          )}
        </FormSection>

        <FormSection title="Visit" description="Why the patient is coming, and any notes from the visit.">
          <VisitFields field={field} />
        </FormSection>

        <FormActions formError={formError} isSubmitting={isSubmitting} submitLabel="Save changes" cancelTo={backTo} />
      </form>
    </>
  );
}

function VisitFields({ field }) {
  return (
    <>
      <Field
        label="Reason for visit"
        maxLength={LIMITS.REASON_MAX}
        placeholder="e.g. Chest pain when climbing stairs"
        wide
        {...field('reason')}
      />
      <Field
        label="Notes"
        as="textarea"
        optional
        rows={3}
        counter
        maxLength={LIMITS.NOTES_MAX}
        placeholder="e.g. Bring previous ECG reports"
        wide
        {...field('notes')}
      />
    </>
  );
}

function BookingSummary({ patient, doctor, date, time }) {
  return (
    <section className="form-section" aria-labelledby="summary-heading">
      <div className="form-section-intro">
        <h2 id="summary-heading">Summary</h2>
        <p>Check the details before booking.</p>
      </div>
      <div className="booking-summary">
        <dl className="kv kv-compact">
          <div>
            <dt>Patient</dt>
            <dd>{patient.fullName}</dd>
          </div>
          <div>
            <dt>Doctor</dt>
            <dd>
              {doctorName(doctor)}, {doctor.specialty}
            </dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>
              {formatDate(date)} at {formatTime(time)}
            </dd>
          </div>
          {doctor.room && (
            <div>
              <dt>Room</dt>
              <dd>{doctor.room}</dd>
            </div>
          )}
          <div>
            <dt>Consultation fee</dt>
            <dd className="num">{formatFee(doctor.consultationFee)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
