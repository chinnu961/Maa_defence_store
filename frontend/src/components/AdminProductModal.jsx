import { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../api/products.js';

const CATEGORIES = ['headwear', 'clothing', 'accessories', 'tactical', 'general'];

export default function AdminProductModal({ product, onClose, onSaved }) {
  const isEditing = !!product;
  const [form, setForm] = useState({
    id: '',
    name: '',
    category: 'clothing',
    price: '',
    badge: 'ncc',
    stock: '1000',
    image: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        id: product.id || '',
        name: product.name || '',
        category: product.category || 'clothing',
        price: product.price || '',
        badge: product.badge || 'ncc',
        stock: product.stock !== undefined ? product.stock : '1000',
        image: product.image || '',
        description: product.description || product.desc || ''
      });
    }
  }, [product]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10)
      };

      if (isEditing) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred saving the product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 2000 }}>
      <div className="modal-box glass-panel" style={{ width: '600px', maxWidth: '95%', padding: '2rem' }}>
        <div className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </div>

        <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
        </div>

        <div id="adminProductFormContent">
          {error && <div className="auth-alert" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isEditing && (
              <div className="form-group">
                <label className="form-label">Product ID (Unique code)</label>
                <input required type="text" name="id" value={form.id} onChange={handleChange} className="form-input-text" placeholder="e.g. ncc-uniform-1" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Name</label>
              <input required type="text" name="name" value={form.name} onChange={handleChange} className="form-input-text" />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label className="form-label">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="form-input-text" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label className="form-label">Badge</label>
                <select name="badge" value={form.badge} onChange={handleChange} className="form-input-text" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <option value="ncc">NCC</option>
                  <option value="army">Army</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label className="form-label">Price (₹)</label>
                <input required type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="form-input-text" />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label className="form-label">Stock Quantity</label>
                <input required type="number" name="stock" value={form.stock} onChange={handleChange} className="form-input-text" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input required type="text" name="image" value={form.image} onChange={handleChange} className="form-input-text" placeholder="https://..." />
            </div>
            {form.image && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img src={form.image} alt="Preview" style={{ height: '100px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', padding: '5px' }} onError={(e) => e.target.style.display='none'} onLoad={(e) => e.target.style.display='inline'} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="form-input-text" rows="3"></textarea>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
