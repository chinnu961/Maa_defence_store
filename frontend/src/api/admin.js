import apiClient from './client.js';

export async function fetchAdminOrders(status = null) {
  const url = status ? `/admin/orders?status=${status}` : '/admin/orders';
  const response = await apiClient.get(url);
  return response.data;
}

export async function updateAdminOrderStatus(orderId, status, cancellationReason = null) {
  const payload = { status };
  if (cancellationReason) {
    payload.cancellation_reason = cancellationReason;
  }
  const response = await apiClient.patch(`/admin/orders/${orderId}/status`, payload);
  return response.data;
}

export async function fetchAdminStats() {
  const response = await apiClient.get('/admin/stats');
  return response.data;
}

export async function fetchAdminUsers() {
  const response = await apiClient.get('/admin/users');
  return response.data;
}
