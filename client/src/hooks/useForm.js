import { toValidationErrors } from '@mab/shared';
import { useRef, useState } from 'react';

/**
 * Initial form values: the record's editable fields as strings (lists stay lists), or `emptyValues` when adding.
 * `convert` can override how a field is read, e.g. a stored date into YYYY-MM-DD.
 */
export function toFormValues(record, emptyValues, convert = {}) {
  if (!record) return emptyValues;
  return Object.fromEntries(
    Object.keys(emptyValues).map((key) => {
      const value = convert[key] ? convert[key](record[key]) : record[key];
      return [key, Array.isArray(value) ? value : String(value ?? '')];
    }),
  );
}

/**
 * Form state validated with the same Zod schema the server uses.
 * - A field is checked when the user leaves it after typing, and again on every change once it shows an error.
 * - Submitting checks everything, focuses the first invalid field, and shows server errors under their fields.
 * `toPayload` converts the raw string inputs (e.g. numbers) before validation.
 */
export function useForm({ initialValues, schema, toPayload = (values) => values, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  // Latest values, so two changes in the same event (e.g. pick a slot, then type) do not overwrite each other.
  const latestValues = useRef(initialValues);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (nextValues) => {
    const result = schema.safeParse(toPayload(nextValues));
    return result.success ? { fieldErrors: {}, formErrors: [], data: result.data } : toValidationErrors(result.error);
  };

  const setFieldError = (name, nextValues) =>
    setErrors((current) => ({ ...current, [name]: validate(nextValues).fieldErrors[name] }));

  /** Changes one or more fields at once, e.g. setFields({ student: id, tuitionClass: '' }). */
  const setFields = (changes) => {
    const nextValues = { ...latestValues.current, ...changes };
    latestValues.current = nextValues;
    setValues(nextValues);
    setFormError('');
    setDirty((current) => ({ ...current, ...Object.fromEntries(Object.keys(changes).map((name) => [name, true])) }));
    for (const name of Object.keys(changes)) {
      if (errors[name]) setFieldError(name, nextValues);
    }
  };

  const handleChange = (event) => setFields({ [event.target.name]: event.target.value });

  const handleBlur = (event) => {
    const { name } = event.target;
    if (dirty[name]) setFieldError(name, values);
  };

  const showErrors = (fieldErrors, message) => {
    setErrors(fieldErrors);
    setFormError(message);
    const firstInvalid = Object.keys(fieldErrors)[0];
    if (firstInvalid) document.getElementById(`field-${firstInvalid}`)?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { fieldErrors, formErrors, data } = validate(values);
    if (!data) {
      const count = Object.keys(fieldErrors).length;
      showErrors(fieldErrors, formErrors[0] ?? `Please fix ${count} field${count === 1 ? '' : 's'} before saving.`);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await onSubmit(data);
    } catch (err) {
      showErrors(err.fieldErrors ?? {}, err.message);
      setIsSubmitting(false);
    }
  };

  /** Props for a <Field> or <ChoiceGroup> bound to `name`. */
  const field = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
  });

  return { values, errors, formError, isSubmitting, field, setFields, handleSubmit };
}
