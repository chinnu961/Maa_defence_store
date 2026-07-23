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
    <div className="auth-page">
      <div className="auth-box glass-panel" style={{ position: 'relative' }}>
        <button onClick={() => navigate(-1)} className="back-btn" style={{ position: 'absolute', top: '15px', left: '15px', background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        <Link to="/" className="logo auth-logo" style={{ marginTop: '1rem' }}>
          <img src="/assets/ncc_logo.png" alt="NCC Logo" className="logo-img" />
          MAA <span>DEFENCE STORES</span>
        </Link>

        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your orders and uniform fittings.</p>
        </div>

        {error && (
          <div className="auth-alert">
            <i className="fa-solid fa-circle-exclamation"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input-text"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input-text"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
