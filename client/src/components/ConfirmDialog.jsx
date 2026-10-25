import { useEffect, useId, useRef } from 'react';
import { Icon } from './Icon.jsx';

/** Modal confirmation built on the native <dialog> (focus trap and Esc to close for free). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  isBlocked,
  isBusy,
  error,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onCancel();
      }}
    >
      <div className={`dialog-icon${isBlocked ? ' dialog-icon-warning' : ''}`} aria-hidden="true">
        <Icon name={isBlocked ? 'alert' : 'trash'} size={20} />
      </div>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-message`}>{message}</p>
      {error && (
        <p className="form-error" role="alert">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
      <div className="dialog-buttons">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isBusy} autoFocus>
          {isBlocked ? 'OK' : 'Cancel'}
        </button>
        {!isBlocked && (
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? 'Working...' : confirmLabel}
          </button>
        )}
      </div>
    </dialog>
  );
}
