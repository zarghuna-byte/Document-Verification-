import axios from 'axios';

/**
 * Shared axios instance for the backend API.
 *
 * The instance is configured with a relative base URL so the same build works
 * in development (the Vite dev server proxies /api/v1 to the FastAPI backend)
 * and behind a reverse proxy in production. Deployments that host the backend
 * on a separate origin should set VITE_API_BASE_URL in a .env.local file to the
 * absolute backend URL (see .env.example). Feature modules import this instance
 * and register their endpoints on top of it.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
