import { useSearchParams } from 'react-router';

/**
 * Keeps list search, filters, sorting and page in the URL, so they survive refreshes and can be shared.
 * Only keys present in `defaults` are read; changing anything except `page` returns to page 1.
 */
export function useListParams(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = { ...defaults };
  for (const [key, value] of searchParams) {
    if (key in defaults) params[key] = value;
  }

  const setParams = (changes) =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (!('page' in changes)) next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value === defaults[key]) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      },
      { replace: true },
    );

  const apiQuery = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '')).toString();
  return { params, setParams, apiQuery };
}
