import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { fetchProducts } from '../api/products.js';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#shop', label: 'Shop Catalog' },
  { href: '#bulk-inquiry', label: 'Bulk Orders' },
  { href: '#contact', label: 'Contact' }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { totals, openDrawer } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getNotificationsForUser, markAsRead } = useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  
  const notifications = isAuthenticated ? getNotificationsForUser(user.id, isAdmin) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (searchOpen && allProducts.length === 0) {
      fetchProducts().then(setAllProducts).catch(console.error);
    }
  }, [searchOpen, allProducts.length]);

  const searchResults = searchQuery.trim() === '' ? [] : allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = document.querySelectorAll('section[id]');
      let currentId = 'home';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
          currentId = section.getAttribute('id');
        }
      });
      setActiveSection(currentId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = () => setMenuOpen(false);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className={`header${scrolled ? ' header-scrolled' : ''}`} id="header">
      <div className="container nav-container">
        <Link to={isAdmin ? "/admin" : "/"} className="logo" onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img src="/assets/ncc_logo.png" alt="NCC Logo" className="logo-img" />
          MAA <span>DEFENCE STORES</span>
        </Link>

        <nav className="nav-menu-wrap">
          <ul className={`nav-menu${menuOpen ? ' active' : ''}`} id="navMenu">
            {isAdmin || !isAuthenticated ? null : (
              NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={location.pathname === '/' ? link.href : `/${link.href}`}
                    className={`nav-link${activeSection === link.href.slice(1) ? ' active' : ''}`}
                    onClick={handleNavClick}
                  >
                    {link.label}
                  </a>
                </li>
              ))
            )}
            {isAuthenticated && (
              <li className="mobile-only-auth-link">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick(); handleLogout(); }}>
                  Logout ({user.name})
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div className="nav-actions">
          {isAuthenticated && (
            <>
              <div className="cart-trigger" title="Search Products" onClick={() => setSearchOpen(!searchOpen)} ref={searchRef} style={{ position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                {searchOpen && (
                  <div className="user-menu-dropdown search-dropdown" style={{ right: 0, width: 320, padding: '1rem', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search products from a to z..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--color-primary)' }}
                    />
                    <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: '1rem' }}>
                      {searchResults.length > 0 ? searchResults.map(p => (
                        <div key={p.id} onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate(`/product/${p.id}`); }} style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={p.image} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }} alt={p.name} />
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{p.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>₹{p.price}</div>
                          </div>
                        </div>
                      )) : (
                        searchQuery.trim() !== '' && <div style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '1rem' }}>No products found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="cart-trigger" title="Toggle Theme" onClick={toggleTheme}>
                <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
              </div>
            </>
          )}
          <div className="auth-links">
            {isAuthenticated ? (
              <div className="user-menu" ref={userMenuRef}>
                <button className="user-menu-trigger" onClick={() => setUserMenuOpen((v) => !v)}>
                  <i className="fa-solid fa-circle-user"></i>
                  {isAdmin ? 'Profile' : user.name.split(' ')[0]}
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                </button>
                {userMenuOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-name">{user.email}</div>
                    {isAdmin ? (
                      <Link to="/admin/profile" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '10px 15px', color: 'var(--color-primary)' }}>
                        <i className="fa-solid fa-user-pen" style={{ marginRight: 8 }}></i>
                        Edit Profile & Store Info
                      </Link>
                    ) : (
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '10px 15px', color: 'var(--color-primary)' }}>
                        <i className="fa-solid fa-user-pen" style={{ marginRight: 8 }}></i>
                        My Profile & Orders
                      </Link>
                    )}
                    <button onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket" style={{ marginRight: 8 }}></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="auth-link-btn">Sign In</Link>
                <Link to="/register" className="auth-link-btn primary">Register</Link>
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className="cart-trigger" style={{ position: 'relative' }} ref={notifRef} onClick={() => setNotifOpen(!notifOpen)}>
              <i className="fa-solid fa-bell"></i>
              {unreadCount > 0 && <span className="cart-badge">{unreadCount}</span>}
              
              {notifOpen && (
                <div className="user-menu-dropdown" style={{ right: 0, width: 300 }}>
                  <div className="user-name" style={{ borderBottom: '1px solid var(--glass-border)' }}>Notifications</div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-muted)' }}>No notifications</div>
                  ) : (
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: '10px 15px', borderBottom: '1px solid var(--glass-border)', opacity: n.read ? 0.6 : 1, cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(150,150,150,0.1)' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{n.message}</p>
                          <small style={{ color: 'var(--accent-gold)' }}>{new Date(n.created_at).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isAuthenticated && !isAdmin && (
            <div className="cart-trigger" id="cartTrigger" title="Open Cart" onClick={openDrawer}>
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-badge" id="cartBadge">{totals.itemCount}</span>
            </div>
          )}
          {isAuthenticated && (
            <div className="menu-toggle" id="menuToggle" onClick={() => setMenuOpen((v) => !v)}>
              <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
