import axios from 'axios';

// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.js).
// In production, set VITE_API_URL to the deployed FastAPI base URL (e.g. https://api.example.com/api).
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const TOKEN_KEY = 'maa_access_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Attach the bearer token to every outgoing request, if we have one.
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extract a readable message out of FastAPI's error response shape.
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    // Pydantic validation errors come back as a list of { msg, loc, ... }
    return detail.map((d) => d.msg).join(', ');
  }
  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Please check your connection and try again.';
  }
  return fallback;
}

export function getImageUrl(imagePath) {
  if (!imagePath) return '/assets/military_uniform.png';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads/')) {
    return `https://maa-defence-api.onrender.com${imagePath}`;
  }
  return imagePath;
}

export default apiClient;
