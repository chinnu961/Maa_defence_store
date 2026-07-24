import apiClient from './client.js';

// POST /api/auth/register -> { access_token, token_type, user }
export async function registerUser(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data;
}

// POST /api/auth/login-json -> { access_token, token_type, user }
// (JSON alternative to FastAPI's OAuth2 form-encoded /auth/login, easier to call from React)
export async function loginUser({ email, password }) {
  const { data } = await apiClient.post('/auth/login-json', { email, password });
  return data;
}

// GET /api/auth/me -> current user, using whatever bearer token is attached
export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

// PUT /api/auth/me -> update current user
export async function updateCurrentUser(payload) {
  const { data } = await apiClient.put('/auth/me', payload);
  return data;
}

// GET /api/auth/admin-contact -> get admin contact info
export async function fetchAdminContact() {
  const { data } = await apiClient.get('/auth/admin-contact');
  return data;
}
