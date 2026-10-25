import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Loads `GET path` and reloads whenever the path changes. Pass null to skip loading.
 * Previous data stays visible while the next request loads, so lists do not flicker.
 */
export function useApi(path) {
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${path}#${reloadCount}`;
  const [result, setResult] = useState({ key: null, data: undefined, error: null });

  useEffect(() => {
    if (!path) return undefined;
    const controller = new AbortController();
    api.get(path, { signal: controller.signal }).then(
      (data) => setResult({ key: requestKey, data, error: null }),
      (error) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data: undefined, error });
      },
    );
    return () => controller.abort();
  }, [path, requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return {
    data: result.data,
    error: result.error,
    isLoading: Boolean(path) && result.key !== requestKey,
    reload,
  };
}
