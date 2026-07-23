import apiClient from './client.js';

export async function fetchNotifications() {
  const response = await apiClient.get('/notifications');
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function fetchNotificationDetails(id) {
  const response = await apiClient.get(`/notifications/${id}`);
  return response.data;
}
