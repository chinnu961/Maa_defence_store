import { useState, useEffect } from 'react';
import { createProduct, updateProduct, uploadProductImage } from '../api/products.js';

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const res = await uploadProductImage(file);
      setForm(prev => ({ ...prev, image: res.url }));
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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

  useEffect(() => {
    if (!isEditing) {
      const slugify = (text) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')           // Replace spaces with -
          .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
          .replace(/\-\-+/g, '-');         // Replace multiple - with single -
      };
      
      const nameSlug = slugify(form.name);
      if (nameSlug) {
        setForm(prev => ({
          ...prev,
          id: `${slugify(form.category)}-${nameSlug}`
        }));
      } else {
        setForm(prev => ({
          ...prev,
          id: ''
        }));
      }
    }
  }, [form.name, form.category, isEditing]);

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
                <label className="form-label">Product ID (Unique code - Auto Generated)</label>
                <input disabled readOnly required type="text" name="id" value={form.id} className="form-input-text" style={{ opacity: 0.6, cursor: 'not-allowed' }} placeholder="Will be auto-generated from category & name..." />
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
              <label className="form-label">Product Image</label>
              <div 
                style={{
                  border: '2px dashed var(--color-border, #444)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    setUploading(true);
                    setUploadError('');
                    try {
                      const res = await uploadProductImage(file);
                      setForm(prev => ({ ...prev, image: res.url }));
                    } catch (err) {
                      setUploadError(err.response?.data?.detail || 'Failed to upload image.');
                    } finally {
                      setUploading(false);
                    }
                  }
                }}
                onClick={() => document.getElementById('product-image-file').click()}
              >
                <input 
                  id="product-image-file"
                  type="file" 
                  accept="image/jpeg, image/png, image/gif, image/webp, image/bmp, image/tiff, .heic, .avif"
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
                
                {uploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}></i>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-secondary)' }}>Uploading image...</span>
                  </div>
                ) : form.image ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <img 
                      src={form.image} 
                      alt="Preview" 
                      style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', marginBottom: '0.5rem' }} 
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>Click or drag to replace image</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}></i>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Click to upload or drag & drop</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Supports JPG, PNG, GIF, WebP, BMP, TIFF, HEIC, AVIF</span>
                  </div>
                )}
              </div>
              {uploadError && <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '0.5rem' }}>{uploadError}</div>}
              <input type="hidden" name="image" value={form.image} required />
            </div>

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
