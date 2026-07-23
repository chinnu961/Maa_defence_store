import { useState } from 'react';
import Reveal from './Reveal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Footer() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    showToast('Subscribed successfully!', 'success');
    setEmail('');
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <Reveal className="footer-col footer-about">
            <a href="#home" className="logo">
              <img src="/assets/ncc_logo.png" alt="NCC Logo" className="logo-img" />
              MAA <span>DEFENCE STORES</span>
            </a>
            <p>
              Suppliers of uniform materials: NCC, All Police, Security, Scout & Guide, RTC, Safety
              Material, Raincoats, Army Uniforms & Sports Wear. All types of school uniforms & shoes.
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="social-link"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="social-link"><i className="fa-brands fa-youtube"></i></a>
              <a href="#" className="social-link"><i className="fa-brands fa-linkedin-in"></i></a>
            </div>
          </Reveal>

          <Reveal className="footer-col">
            <h3>Services</h3>
            <ul className="footer-links-list">
              <li><a href="#customizer" className="footer-link">Uniform Tailoring</a></li>
              <li><a href="#shop" className="footer-link">Cadet Starter Kits</a></li>
              <li><a href="#bulk-inquiry" className="footer-link">Regimental Orders</a></li>
              <li><a href="#customizer" className="footer-link">Engraved Nameplates</a></li>
            </ul>
          </Reveal>

          <Reveal className="footer-col">
            <h3>Quick Links</h3>
            <ul className="footer-links-list">
              <li><a href="#home" className="footer-link">About Us</a></li>
              <li><a href="#shop" className="footer-link">Product Catalog</a></li>
              <li><a href="#features" className="footer-link">Specification Manuals</a></li>
              <li><a href="#contact" className="footer-link">Contact / Depot</a></li>
            </ul>
          </Reveal>

          <Reveal className="footer-col">
            <h3>Newsletter</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', marginBottom: '1.5rem' }}>
              Receive cadet training guide manuals, camp checklist circulars, and product stock alerts.
            </p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="form-input-text"
                placeholder="Your Email Address"
                required
                style={{ padding: '0.6rem 1rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </form>
          </Reveal>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Maa Defence Stores. All Rights Reserved.</p>
          <p>Developed with Pride for the Armed Forces & Cadet Corps.</p>
        </div>
      </div>
    </footer>
  );
}
