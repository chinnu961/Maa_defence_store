import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import { fetchProducts } from '../api/products.js';
import { getImageUrl } from '../api/client.js';

const CATEGORIES = [
  { id: 'all', label: 'All Gear' },
  { id: 'headwear', label: 'Headwear' },
  { id: 'clothing', label: 'Uniforms & Clothing' },
  { id: 'accessories', label: 'Badges & Accessories' },
  { id: 'tactical', label: 'Tactical Gear' },
  { id: 'general', label: 'Flags & General' }
];

function ProductCard({ product, onOpen }) {
  const isNcc = product.badge === 'ncc';
  const isArmy = product.badge === 'army';

  return (
    <Reveal className="product-card glass-panel" as="div">
      <div className="product-image-container" onClick={() => onOpen(product)} style={{ cursor: 'pointer' }}>
        {isNcc && <span className="product-badge ncc">NCC SPEC</span>}
        {!isNcc && isArmy && <span className="product-badge">ARMY SPEC</span>}
        <img src={getImageUrl(product.image)} alt={product.name} className="product-image" />
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-title" onClick={() => onOpen(product)} style={{ cursor: 'pointer' }}>
          {product.name}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          {product.description || product.desc}
        </p>
        <div className="product-footer">
          <span className="product-price">₹{product.price.toLocaleString()}</span>
          <button className="product-add-btn" onClick={() => onOpen(product)} title="View Details">
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </Reveal>
  );
}

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }
    const keyword = searchKeyword.trim().toLowerCase();
    if (keyword) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          (p.description || p.desc || '').toLowerCase().includes(keyword) ||
          p.category.toLowerCase().includes(keyword)
      );
    }
    return list;
  }, [products, activeCategory, searchKeyword]);

  return (
    <section className="section" id="shop">
      <div className="container">
        <Reveal className="section-title-wrap">
          <h2 className="section-title">Shop Catalog</h2>
          <p className="section-subtitle">
            Browse individual items, tactical accessories, medals, and boots required for active
            service and training camps.
          </p>
        </Reveal>

        <Reveal className="catalog-controls glass-panel">
          <div className="search-bar-wrap">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              className="search-bar-input"
              id="searchInput"
              placeholder="Search product name, category..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <div className="filter-categories" id="filterCategories">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`filter-btn${activeCategory === c.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="products-grid" id="productsGrid">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--color-muted)' }}>
              <i className="fa-solid fa-circle-question" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></i>
              <h3>No gear found matching your search.</h3>
              <p>Try using a different filter category or search keyword.</p>
            </div>
          ) : (
            filtered.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={(p) => navigate(`/product/${p.id}`)} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
