import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fetchProducts } from '../api/products.js';

function getAvailableSizes(category, name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('shoe') || n.includes('boot')) {
    return ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
  }
  if (n.includes('pant') || n.includes('trouser')) {
    return ['30', '32', '34', '36', '38', '40'];
  }
  if (category === 'clothing' || n.includes('shirt') || n.includes('jacket') || n.includes('jersey') || n.includes('t-shirt')) {
    return ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
  }
  if (n.includes('sock') || n.includes('sox')) {
    return ['Free Size'];
  }
  return null;
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, openDrawer } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [added, setAdded] = useState(false);
  
  useEffect(() => {
    // Scroll to top when loading a new product
    window.scrollTo(0, 0);
    setLoading(true);
    fetchProducts().then(products => {
      const p = products.find(prod => prod.id === id);
      setProduct(p || null);
      setLoading(false);
      setQuantity(1);
      
      const sizes = p ? getAvailableSizes(p.category, p.name) : null;
      if (sizes && sizes.length > 0) {
        setSelectedSize(sizes[0]);
      } else {
        setSelectedSize('');
      }
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <main className="main-content" style={{ minHeight: '80vh', padding: '120px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--color-muted)' }}>Loading Product...</div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="main-content" style={{ minHeight: '80vh', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--accent-alert)', marginBottom: '1rem' }}>Product Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/#shop')}>Back to Shop</button>
      </main>
    );
  }

  const changeQty = (delta) => {
    setQuantity((q) => Math.min(product.stock || 99, Math.max(1, q + delta)));
  };

  const badgeLabel = product.badge === 'ncc' ? 'NCC SPEC' : product.badge === 'army' ? 'ARMY SPEC' : 'GEAR';
  const sizes = getAvailableSizes(product.category, product.name);


  const handleAdd = () => {
    const cartProduct = { ...product };
    if (selectedSize) {
      cartProduct.details = `Size: ${selectedSize}`;
    }
    addToCart(cartProduct, quantity);
    setAdded(true);
    // Reset added state after 4 seconds
    setTimeout(() => setAdded(false), 4000);
  };

  const goBackToShop = () => {
    navigate('/');
    // Wait for the home page to render, then scroll to #shop
    setTimeout(() => {
      const shopSection = document.getElementById('shop');
      if (shopSection) {
        shopSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <main className="main-content" style={{ minHeight: '80vh', padding: '120px 20px 60px' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={goBackToShop} className="back-btn" style={{ background: 'transparent', border: '1.5px solid var(--glass-border)', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '0.95rem', padding: '8px 16px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.color = 'var(--accent-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Store
          </button>
          <button onClick={goBackToShop} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)', color: 'var(--color-secondary)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
            title="Close Product View"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
          <div className="product-modal-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            <div className="product-modal-image-col" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div style={{
                width: '100%', maxWidth: '400px',
                aspectRatio: '1 / 1',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--bg-secondary)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                />
              </div>
            </div>

            <div className="product-modal-details-col">
              <div className="product-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                {badgeLabel}
              </div>
              <h2 className="product-modal-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>{product.name}</h2>
              <div className="product-modal-price" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                ₹{product.price.toLocaleString()}
              </div>

              <div className="product-modal-desc" style={{ color: 'var(--color-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                <p>{product.description || product.desc}</p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{product.category}</span>
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: (product.stock > 0 ? 'var(--color-success)' : 'var(--accent-alert)') }}>
                  <strong>Availability:</strong> {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                </p>
              </div>

              {sizes && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Select Size</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {sizes.map(size => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        style={{
                          padding: '10px 15px',
                          border: `2px solid ${selectedSize === size ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                          backgroundColor: selectedSize === size ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                          color: selectedSize === size ? 'var(--accent-gold)' : 'var(--color-primary)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="quantity-selector-wrap" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Select Quantity</label>
                <div className="quantity-selector-modern" style={{ display: 'inline-flex' }}>
                  <button onClick={() => changeQty(-1)}>
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => changeQty(1)}>
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  className="btn btn-primary btn-large"
                  style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}
                  onClick={handleAdd}
                  disabled={product.stock === 0}
                >
                  <i className="fa-solid fa-cart-plus" style={{ marginRight: '8px' }}></i>
                  {product.stock === 0 ? 'Out of Stock' : `Add to Cart - ₹${(product.price * quantity).toLocaleString()}`}
                </button>

                {added && (
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '13px', fontSize: '1rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', animation: 'fadeInUp 0.25s ease' }}
                    onClick={() => { openDrawer(); setAdded(false); }}
                  >
                    <i className="fa-solid fa-cart-shopping" style={{ marginRight: '8px' }}></i>
                    Go to Cart & Checkout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
