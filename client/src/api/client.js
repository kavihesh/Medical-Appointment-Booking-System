import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config.js';

/** Error returned by the API, with optional per-field messages for forms. */
export class ApiError extends Error {
  constructor(status, { code, message, fieldErrors } = {}) {
    super(message ?? `Request failed (${status})`);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors ?? {};
  }
}

async function request(method, path, { body, signal } = {}) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: timeout.aborted
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Check that the API is running.',
    });
  }

  // The dev proxy answers 502-504 when the API server is not running.
  if ([502, 503, 504].includes(response.status)) {
    throw new ApiError(response.status, {
      code: 'NETWORK_ERROR',
      message: 'Cannot reach the server. Check that the API is running, then try again.',
    });
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data?.error);
  // A non-JSON success (e.g. an HTML page from a misconfigured proxy) would otherwise leave pages loading forever.
  if (data === null) {
    throw new ApiError(response.status, {
      code: 'BAD_RESPONSE',
      message: 'The server sent an unexpected response. Check that the API is running, then try again.',
    });
  }
  return data;
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  delete: (path) => request('DELETE', path),
};
