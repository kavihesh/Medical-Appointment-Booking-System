import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';

/**
 * Drives <ConfirmDialog> for deleting one record at a time.
 * `describe(item)` returns { path, name, message } for the record being deleted, plus optional
 * `title` and `doneMessage` to override the default "Delete X?" and "X was deleted" wording.
 */
export function useDeleteConfirmation({ describe, onDeleted }) {
  const showToast = useToast();
  const [target, setTarget] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setTarget(null);
    setError('');
  };

  const confirm = async () => {
    const { path, name, doneMessage } = describe(target);
    setIsBusy(true);
    setError('');
    try {
      await api.delete(path);
      close();
      showToast(doneMessage ?? `${name} was deleted`);
      onDeleted(target);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  // `blockedReason` (when the page already knows the delete would be refused) replaces the Delete button.
  const description = target ? describe(target) : null;
  const isBlocked = Boolean(description?.blockedReason);
  const title = !description
    ? ''
    : isBlocked
      ? `${description.name} can't be deleted yet`
      : (description.title ?? `Delete ${description.name}?`);

  return {
    requestDelete: setTarget,
    dialogProps: {
      open: Boolean(target),
      title,
      message: (isBlocked ? description.blockedReason : description?.message) ?? '',
      isBlocked,
      isBusy,
      error,
      onConfirm: confirm,
      onCancel: close,
    },
  };
}
