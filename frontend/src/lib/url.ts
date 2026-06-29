// API base URL. In production set VITE_API_BASE_URL at build time
// (e.g. the Cloud Run backend URL). Falls back to localhost for dev.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export default API_BASE_URL;
