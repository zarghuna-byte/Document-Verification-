import axios from 'axios';

/**
 * Shared axios instance for future backend integration.
 *
 * The instance is configured once with the base URL (from Vite environment
 * variables, falling back to a local default) and a sensible timeout. No
 * request is issued in this phase; later feature modules import this instance
 * and register their endpoints on top of it.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
