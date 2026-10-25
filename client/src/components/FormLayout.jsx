import { Link } from 'react-router';
import { Icon } from './Icon.jsx';

/** One step of a form: a title and a sentence on the left, its fields on the right (stacked on phones). */
export function FormSection({ title, description, children }) {
  return (
    <section className="form-section">
      <div className="form-section-intro">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="form-section-body">{children}</div>
    </section>
  );
}

/** Form-level error, then Cancel and Save in a bar that stays visible at the bottom of the screen. */
export function FormActions({ formError, isSubmitting, submitLabel, cancelTo }) {
  return (
    <div className="form-footer">
      {formError && (
        <p className="form-error" role="alert">
          <Icon name="alert" size={16} />
          {formError}
        </p>
      )}
      <div className="form-buttons">
        <Link to={cancelTo} className="btn btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
