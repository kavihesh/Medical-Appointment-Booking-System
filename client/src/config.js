// App-wide settings. Change branding here, not in components.
export const APP_NAME = 'MediBook';
export const APP_TAGLINE = 'Clinic Appointments';
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
export const REQUEST_TIMEOUT_MS = 15_000;
export const SEARCH_DEBOUNCE_MS = 300;
export const TOAST_DURATION_MS = 4_000;
// Dropdowns load at most one page of options; the API caps page size at 50.
export const OPTIONS_PAGE_SIZE = 50;
