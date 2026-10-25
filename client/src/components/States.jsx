import { Icon } from './Icon.jsx';

/** Loading, empty and error placeholders used by every page. */

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {children}
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  const isNotFound = error.status === 404;
  return (
    <div className="state state-error" role="alert">
      <Icon name="alert" size={22} />
      <p className="state-title">{isNotFound ? 'Not found' : "Couldn't load this page"}</p>
      <p>{error.message}</p>
      {onRetry && !isNotFound && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
