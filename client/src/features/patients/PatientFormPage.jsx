import { BLOOD_GROUPS, GENDERS, LIMITS, localToday, patientSchema } from '@mab/shared';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../api/client.js';
import { ChoiceGroup, Field } from '../../components/Field.jsx';
import { FormActions, FormSection } from '../../components/FormLayout.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorMessage, Loading } from '../../components/States.jsx';
import { useToast } from '../../components/Toast.jsx';
import { useApi } from '../../hooks/useApi.js';
import { toFormValues, useForm } from '../../hooks/useForm.js';
import { toDateInput } from '../../lib/format.js';
import { toOptions } from '../../lib/options.jsx';

const EMPTY_PATIENT = {
  fullName: '',
  nic: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  bloodGroup: '',
  allergies: '',
};

/** Add (/patients/new) and edit (/patients/:id/edit) share this page. */
export function PatientFormPage() {
  const { id } = useParams();
  const { data: patient, error, reload } = useApi(id ? `/patients/${id}` : null);

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (id && !patient) return <Loading />;
  return <PatientForm key={id ?? 'new'} patient={patient} />;
}

function PatientForm({ patient }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const isEdit = Boolean(patient);
  const backTo = isEdit ? `/patients/${patient._id}` : '/patients';

  const { formError, isSubmitting, field, handleSubmit } = useForm({
    initialValues: toFormValues(patient, EMPTY_PATIENT, { dateOfBirth: toDateInput }),
    schema: patientSchema,
    onSubmit: async (payload) => {
      const saved = isEdit ? await api.put(`/patients/${patient._id}`, payload) : await api.post('/patients', payload);
      showToast(isEdit ? `${saved.fullName} was updated` : `${saved.fullName} was registered`);
      navigate(`/patients/${saved._id}`);
    },
  });

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit ${patient.fullName}` : 'Register a patient'}
        subtitle={isEdit ? "Update the patient's details." : 'Add a patient so you can book appointments for them.'}
        crumbs={isEdit ? [{ label: 'Patients', to: '/patients' }, { label: patient.fullName, to: backTo }] : [{ label: 'Patients', to: '/patients' }]}
      />

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Personal details" description="As shown on the patient's National Identity Card.">
          <Field
            label="Full name"
            maxLength={LIMITS.NAME_MAX}
            autoComplete="name"
            autoCapitalize="words"
            placeholder="e.g. Kamal Silva"
            wide
            {...field('fullName')}
          />
          <Field
            label="NIC number"
            maxLength={12}
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="e.g. 198512345678"
            hint="12 digits, or 9 digits followed by V or X."
            {...field('nic')}
          />
          <Field label="Date of birth" type="date" max={localToday()} {...field('dateOfBirth')} />
          <ChoiceGroup label="Gender" options={GENDERS} wide {...field('gender')} />
        </FormSection>

        <FormSection title="Contact" description="Used to remind the patient about appointments.">
          <Field
            label="Phone"
            type="tel"
            inputMode="tel"
            maxLength={13}
            autoComplete="tel"
            placeholder="077 123 4567"
            hint="10 digits starting with 0. Spaces are fine."
            {...field('phone')}
          />
          <Field
            label="Email"
            type="email"
            optional
            maxLength={LIMITS.EMAIL_MAX}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            {...field('email')}
          />
          <Field
            label="Address"
            optional
            maxLength={LIMITS.ADDRESS_MAX}
            autoComplete="street-address"
            placeholder="e.g. 12 Temple Road, Galle"
            wide
            {...field('address')}
          />
        </FormSection>

        <FormSection title="Medical" description="Shown to the doctor before each visit.">
          <Field label="Blood group" as="select" optional {...field('bloodGroup')}>
            <option value="">Not known</option>
            {toOptions(BLOOD_GROUPS)}
          </Field>
          <Field
            label="Allergies"
            as="textarea"
            optional
            rows={3}
            counter
            maxLength={LIMITS.ALLERGIES_MAX}
            placeholder="e.g. Penicillin, peanuts"
            wide
            {...field('allergies')}
          />
        </FormSection>

        <FormActions formError={formError} isSubmitting={isSubmitting} submitLabel={isEdit ? 'Save changes' : 'Register patient'} cancelTo={backTo} />
      </form>
    </>
  );
}
