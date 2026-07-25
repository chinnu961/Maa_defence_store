import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(form);
    setSubmitting(false);
    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left Branding Side */}
      <div className="auth-brand-side">
        <div className="brand-scan-overlay"></div>
        <div className="brand-content">
          <Link to="/" className="brand-logo-wrap">
            <img src="/assets/ncc_logo.png" alt="NCC Logo" className="brand-logo-img" />
          </Link>
          <h1 className="brand-title">
            MAA <span>DEFENCE STORES</span>
          </h1>
          <p className="brand-tagline">
            Premium Uniform Customization & Accessories for NCC Cadets & Defence Personnel.
          </p>
          <div className="brand-tech-data">
            <div className="tech-item">
              <span className="tech-label">PORTAL STATE</span>
              <span className="tech-value state-active">ONLINE</span>
            </div>
            <div className="tech-item">
              <span className="tech-label">SECURITY PROTOCOL</span>
              <span className="tech-value">SSL ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="auth-form-side">
        <button onClick={() => navigate('/')} className="auth-close-btn" title="Back to Home">
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>WELCOME CADET</h2>
            <p>
              Sign in to manage your orders, uniform customizer, and fittings.
            </p>
          </div>

          {error && (
            <div className="auth-alert">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="interactive-auth-form">
            <div className="floating-form-group">
              <input
                type="email"
                name="email"
                className="floating-input"
                placeholder=" "
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
              <label className="floating-label">Email Address</label>
              <i className="fa-regular fa-envelope input-icon"></i>
            </div>

            <div className="floating-form-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="floating-input"
                placeholder=" "
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="current-password"
                style={{ paddingRight: '2.8rem' }}
              />
              <label className="floating-label">Password</label>
              <i className="fa-solid fa-lock input-icon"></i>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={submitting}>
              {submitting ? (
                <>
                  <i className="fa-solid fa-compass fa-spin" style={{ marginRight: '8px' }}></i> Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginLeft: '10px' }}></i>
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
