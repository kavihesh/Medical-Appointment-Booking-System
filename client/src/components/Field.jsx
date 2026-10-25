import { Icon } from './Icon.jsx';

/**
 * Label + input/select/textarea + hint or error, wired for screen readers.
 * The control gets id `field-<name>` so forms can focus the first invalid field.
 * `prefix`/`suffix` show units inside the box (LKR, seats); `counter` shows characters used.
 */
export function Field({
  label,
  name,
  error,
  hint,
  optional,
  prefix,
  suffix,
  counter,
  wide,
  as: Control = 'input',
  children,
  ...controlProps
}) {
  const id = `field-${name}`;
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  const control = (
    <Control
      id={id}
      name={name}
      aria-invalid={Boolean(error)}
      aria-describedby={hasMessage ? messageId : undefined}
      className={`control${Control === 'select' ? ' control-select' : ''}`}
      {...controlProps}
    >
      {children}
    </Control>
  );

  return (
    <div className={`field${error ? ' field-invalid' : ''}${wide ? ' field-wide' : ''}`}>
      <div className="field-label-row">
        <label htmlFor={id}>
          {label}
          {optional && <span className="optional"> (optional)</span>}
        </label>
        {counter && controlProps.maxLength && (
          <span className="counter num" aria-live="polite">
            {String(controlProps.value ?? '').length} / {controlProps.maxLength}
          </span>
        )}
      </div>
      {prefix || suffix ? (
        <div className="adorned">
          {prefix && <span className="adornment">{prefix}</span>}
          {control}
          {suffix && <span className="adornment">{suffix}</span>}
        </div>
      ) : (
        control
      )}
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

/**
 * A set of radio buttons shown as a segmented control (few options) or chips (many options).
 * With `multiple`, the chips are checkboxes and `value` is an array kept in the options' order.
 * Uses a real fieldset and inputs, so keyboards and screen readers work as expected.
 */
export function ChoiceGroup({
  label,
  name,
  value,
  options,
  onChange,
  onBlur,
  error,
  hint,
  variant = 'segmented',
  multiple = false,
  wide,
}) {
  const messageId = `field-${name}-message`;
  const values = options.map((option) => (typeof option === 'object' ? option.value : option));
  const toggle = (optionValue) => {
    const next = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];
    onChange({ target: { name, value: values.filter((v) => next.includes(v)) } });
  };
  return (
    <fieldset
      className={`field${error ? ' field-invalid' : ''}${wide ? ' field-wide' : ''}`}
      aria-describedby={error || hint ? messageId : undefined}
    >
      <legend>{label}</legend>
      <div className={`choices choices-${variant}`}>
        {options.map((option, index) => {
          const { value: optionValue, label: optionLabel } =
            typeof option === 'object' ? option : { value: option, label: option };
          return (
            <label key={optionValue} className="choice">
              <input
                type={multiple ? 'checkbox' : 'radio'}
                id={index === 0 ? `field-${name}` : undefined}
                name={name}
                value={optionValue}
                checked={multiple ? value.includes(optionValue) : value === optionValue}
                onChange={multiple ? () => toggle(optionValue) : onChange}
                onBlur={onBlur}
              />
              <span>{optionLabel}</span>
            </label>
          );
        })}
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </fieldset>
  );
}

function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <p id={id} className="field-error">
        <Icon name="alert" size={14} />
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={id} className="field-hint">
      {hint}
    </p>
  ) : null;
}
