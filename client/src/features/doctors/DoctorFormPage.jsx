import { CLINIC_HOURS, DAYS_OF_WEEK, DOCTOR_STATUSES, doctorSchema, LIMITS, slotTimes, SPECIALTIES, TIME_PATTERN } from '@mab/shared';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../api/client.js';
import { ChoiceGroup, Field } from '../../components/Field.jsx';
import { FormActions, FormSection } from '../../components/FormLayout.jsx';
import { Icon } from '../../components/Icon.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorMessage, Loading } from '../../components/States.jsx';
import { useToast } from '../../components/Toast.jsx';
import { useApi } from '../../hooks/useApi.js';
import { toFormValues, useForm } from '../../hooks/useForm.js';
import { doctorName, formatDays, formatHours, formatTime } from '../../lib/format.js';
import { SLOT_OPTIONS, toOptions } from '../../lib/options.jsx';

const EMPTY_DOCTOR = {
  fullName: '',
  specialty: '',
  registrationNo: '',
  email: '',
  phone: '',
  room: '',
  availableDays: [],
  startTime: '',
  endTime: '',
  slotMinutes: '15',
  consultationFee: '',
  status: 'Available',
};

const DAY_OPTIONS = DAYS_OF_WEEK.map((day) => ({ value: day, label: day.slice(0, 3) }));

const STATUS_HINTS = {
  Available: 'Patients can book appointments.',
  'On leave': 'No new bookings until the doctor is back.',
};

/** Empty number inputs become undefined (so the message is "is required"); others become numbers. */
const toPayload = (v) => ({
  ...v,
  consultationFee: v.consultationFee === '' ? undefined : Number(v.consultationFee),
  slotMinutes: Number(v.slotMinutes),
});

/** Add (/doctors/new) and edit (/doctors/:id/edit) share this page. */
export function DoctorFormPage() {
  const { id } = useParams();
  const { data: doctor, error, reload } = useApi(id ? `/doctors/${id}` : null);

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (id && !doctor) return <Loading />;
  return <DoctorForm key={id ?? 'new'} doctor={doctor} />;
}

function DoctorForm({ doctor }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const isEdit = Boolean(doctor);
  const backTo = isEdit ? `/doctors/${doctor._id}` : '/doctors';

  const { values, formError, isSubmitting, field, handleSubmit } = useForm({
    initialValues: toFormValues(doctor, EMPTY_DOCTOR),
    schema: doctorSchema,
    toPayload,
    onSubmit: async (payload) => {
      const saved = isEdit ? await api.put(`/doctors/${doctor._id}`, payload) : await api.post('/doctors', payload);
      showToast(isEdit ? `${doctorName(saved)} was updated` : `${doctorName(saved)} was added`);
      navigate(`/doctors/${saved._id}`);
    },
  });

  const hasHours = TIME_PATTERN.test(values.startTime) && TIME_PATTERN.test(values.endTime);
  const perDay = hasHours ? slotTimes({ ...values, slotMinutes: Number(values.slotMinutes) }).length : 0;

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit ${doctorName(doctor)}` : 'Add a doctor'}
        subtitle={isEdit ? "Update the doctor's details and weekly schedule." : 'Register a doctor and set the days and hours they see patients.'}
        crumbs={isEdit ? [{ label: 'Doctors', to: '/doctors' }, { label: doctorName(doctor), to: backTo }] : [{ label: 'Doctors', to: '/doctors' }]}
      />

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Doctor" description="Name, specialty and Sri Lanka Medical Council registration.">
          <Field
            label="Full name"
            maxLength={LIMITS.NAME_MAX}
            autoCapitalize="words"
            placeholder="e.g. Nirmala Perera (without Dr.)"
            wide
            {...field('fullName')}
          />
          <Field label="Specialty" as="select" {...field('specialty')}>
            <option value="">Choose a specialty</option>
            {toOptions(SPECIALTIES)}
          </Field>
          <Field
            label="SLMC registration no."
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 23456"
            hint="4 to 6 digits, unique for each doctor."
            {...field('registrationNo')}
          />
        </FormSection>

        <FormSection title="Contact" description="How patients and staff reach the doctor.">
          <Field
            label="Email"
            type="email"
            maxLength={LIMITS.EMAIL_MAX}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            {...field('email')}
          />
          <Field
            label="Phone"
            type="tel"
            inputMode="tel"
            maxLength={13}
            placeholder="077 123 4567"
            hint="10 digits starting with 0. Spaces are fine."
            {...field('phone')}
          />
          <Field label="Room" optional maxLength={LIMITS.ROOM_MAX} placeholder="e.g. Room 3" {...field('room')} />
        </FormSection>

        <FormSection
          title="Weekly schedule"
          description={`The clinic is open ${formatHours(CLINIC_HOURS.OPENS, CLINIC_HOURS.CLOSES)}. Booking slots are made from these hours.`}
        >
          <ChoiceGroup label="Working days" options={DAY_OPTIONS} variant="chips" multiple wide {...field('availableDays')} />
          <Field label="Start time" type="time" step={300} {...field('startTime')} />
          <Field label="End time" type="time" step={300} {...field('endTime')} />
          <Field label="Time per patient" as="select" {...field('slotMinutes')}>
            {toOptions(SLOT_OPTIONS)}
          </Field>
          {hasHours && perDay > 0 && values.availableDays.length > 0 && (
            <p className="preview field-wide">
              <Icon name="clock" size={16} />
              {formatDays(values.availableDays)}, {formatTime(values.startTime)} to {formatTime(values.endTime)}: {perDay}{' '}
              appointments a day
            </p>
          )}
        </FormSection>

        <FormSection title="Fee and status" description="What a consultation costs, and whether the doctor takes bookings.">
          <Field
            label="Consultation fee"
            type="number"
            inputMode="numeric"
            min={0}
            max={LIMITS.FEE_MAX}
            step={LIMITS.FEE_STEP}
            prefix="LKR"
            placeholder="2500"
            hint={`Steps of LKR ${LIMITS.FEE_STEP}.`}
            {...field('consultationFee')}
          />
          <ChoiceGroup label="Status" options={DOCTOR_STATUSES} hint={STATUS_HINTS[values.status]} {...field('status')} />
        </FormSection>

        <FormActions formError={formError} isSubmitting={isSubmitting} submitLabel={isEdit ? 'Save changes' : 'Add doctor'} cancelTo={backTo} />
      </form>
    </>
  );
}
