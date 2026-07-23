import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Hero from '../components/Hero.jsx';
import Features from '../components/Features.jsx';
import Shop from '../components/Shop.jsx';
import BulkInquiry from '../components/BulkInquiry.jsx';
import Contact from '../components/Contact.jsx';

export default function Home() {
  const { isAdmin, isAuthenticated } = useAuth();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ background: '#080a08', color: '#fff', minHeight: '100vh', paddingTop: '100px' }}>
        {/* Landing Hero Section */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '6rem 2rem 4rem', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.1) 0%, rgba(8, 10, 8, 0.9) 70%)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <img src="/assets/ncc_logo.png" alt="NCC Logo" style={{ width: '100px', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))', marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: '900', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>
              MAA <span style={{ color: 'var(--accent-gold)' }}>DEFENCE STORES</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-secondary)', lineHeight: '1.6', maxWidth: '650px' }}>
              The premium tactical outfitter and certified custom uniform tailoring studio. Supplying certified defence accessories, combat equipment, and official cadet wings outfitting.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: '0.95rem', fontWeight: 'bold' }}>Sign In to Shop</Link>
              <Link to="/register" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: '0.95rem', fontWeight: 'bold' }}>Create Account</Link>
            </div>
          </div>
        </section>

        {/* Store Description Details */}
        <section style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: 'var(--color-primary)' }}>Certified Uniform Specifications</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Strict adherence to military and wing guidelines</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <i className="fa-solid fa-shirt" style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}></i>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>Tailored Cadet Uniforms</h3>
              <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Online booking for custom measurements. Specialized tailoring for Army, Navy, and Air Wing uniforms following strict DG NCC dress guidelines.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <i className="fa-solid fa-person-boot-solid" style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}></i>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>Tactical Footwear</h3>
              <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Vanguard grade drill boots, ammunition boots, and lightweight combat shoes certified for long parade hours and operational endurance.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <i className="fa-solid fa-award" style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}></i>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>Medals & Accoutrements</h3>
              <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Certified peak caps, bar medals, rank shoulder badges, hackles, lanyards, and leather belts to complete official uniforms.
              </p>
            </div>
          </div>
        </section>

        {/* Affiliation & Affiliated Wings */}
        <section style={{ background: 'var(--bg-secondary)', padding: '4rem 2rem', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '2rem', color: 'var(--color-primary)' }}>Affiliated Wings & Uniform Specifications</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2.5rem', opacity: 0.85 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--accent-gold)' }}></i> NCC - Army Wing
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <i className="fa-solid fa-anchor" style={{ color: 'var(--accent-gold)' }}></i> NCC - Navy Wing
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <i className="fa-solid fa-plane" style={{ color: 'var(--accent-gold)' }}></i> NCC - Air Wing
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <i className="fa-solid fa-star-of-life" style={{ color: 'var(--accent-gold)' }}></i> Indian Armed Forces
              </div>
            </div>
          </div>
        </section>

        {/* Contact/Location section */}
        <section style={{ padding: '5rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <i className="fa-solid fa-map-location-dot" style={{ fontSize: '3rem', color: 'var(--accent-gold)', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase' }}>Visit Our Main Showroom</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-secondary)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
            Come get measured or browse complete tactical accessories directly at our main showroom:<br />
            <strong>Delhi Cantt Showroom Outlet, Delhi, India</strong><br />
            Open Mon - Sat: 09:00 AM - 08:00 PM
          </p>
          <div className="glass-panel" style={{ padding: '2rem', background: '#0e110e', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '1.5rem', border: '1px solid var(--glass-border)' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--color-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Support Email</strong>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>support@maadefence.com</span>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--color-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Phone Contact</strong>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>+91 98765 43210</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <Features />
      <Shop />
      <BulkInquiry />
      <Contact />
    </>
  );
}
