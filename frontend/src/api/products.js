import apiClient from './client.js';

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/products?${query}` : '/products';
  const response = await apiClient.get(url);
  return response.data;
}

export async function createProduct(payload) {
  const response = await apiClient.post('/products', payload);
  return response.data;
}

export async function updateProduct(id, payload) {
  const response = await apiClient.put(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(id) {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data;
}

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/products/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}
