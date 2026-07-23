import { useState, useEffect } from 'react';
import Reveal from './Reveal.jsx';
import { fetchAdminContact } from '../api/auth.js';

export default function Contact() {
  const [contactInfo, setContactInfo] = useState({
    phone: '+91 96662 97143',
    email: 'support@sagardefence.com',
    shop_address: 'Nagarampalem Main Road, Opposite Luthren Prayer Hall, Guntur - 522004'
  });

  useEffect(() => {
    fetchAdminContact()
      .then(data => {
        if (data) setContactInfo(data);
      })
      .catch(console.error);
  }, []);

  return (
    <section className="section" id="contact">
      <div className="container">
        <Reveal className="section-title-wrap">
          <h2 className="section-title">Find Our Store</h2>
          <p className="section-subtitle">
            Visit our specialized outlet for on-site measurement fittings, badge pinning, and physical
            product inspection.
          </p>
        </Reveal>

        <div className="inquiry-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Reveal className="glass-panel" style={{ padding: '3rem 2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--accent-gold)', marginRight: 10 }}></i>{' '}
              Outlet Details
            </h3>

            <div className="footer-contact-item">
              <i className="fa-solid fa-location-dot"></i>
              <div>
                <strong>Maa Defence Stores</strong>
                <br />
                {contactInfo.shop_address}
              </div>
            </div>

            <div className="footer-contact-item">
              <i className="fa-solid fa-phone"></i>
              <div>
                <strong>Phone Helpline</strong>
                <br />
                {contactInfo.phone}
              </div>
            </div>

            <div className="footer-contact-item">
              <i className="fa-solid fa-envelope"></i>
              <div>
                <strong>Official Email Address</strong>
                <br />
                {contactInfo.email}
              </div>
            </div>

            <div className="footer-contact-item">
              <i className="fa-solid fa-clock"></i>
              <div>
                <strong>Operating Hours</strong>
                <br />
                Monday - Saturday: 09:00 AM - 08:30 PM
                <br />
                Sunday: 10:00 AM - 02:00 PM (Prior appointments for measurements recommended)
              </div>
            </div>
          </Reveal>

          <Reveal
            className="glass-panel"
            style={{
              minHeight: 350,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0c0f0d',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div className="uniform-badge-preview army" style={{ transform: 'scale(0.85)', marginBottom: '1rem' }}>
              <i className="fa-solid fa-map-location-dot" style={{ fontSize: '3rem', color: 'var(--accent-gold)' }}></i>
              <div className="custom-nameplate">Cantonment Store</div>
              <div className="custom-wing-label">MAP LOCATION</div>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--accent-gold)' }}>
              DELHI CANTT DEPOT
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', maxWidth: 300, textAlign: 'center', marginTop: 5 }}>
              Located directly opposite to the Military Parade Grounds.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
