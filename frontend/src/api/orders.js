import apiClient from './client.js';

export async function checkoutOrder(payload) {
  const response = await apiClient.post('/orders', payload);
  return response.data;
}

export async function fetchMyOrders() {
  const response = await apiClient.get('/orders/my');
  return response.data;
}

export async function fetchOrder(orderId) {
  const response = await apiClient.get(`/orders/${orderId}`);
  return response.data;
}

export async function cancelOrder(orderId) {
  const response = await apiClient.put(`/orders/${orderId}/cancel`);
  return response.data;
}
