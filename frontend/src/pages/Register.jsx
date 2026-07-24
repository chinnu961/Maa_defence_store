import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  instituteName: '',
  battalion: '',
  regimentalNumber: '',
  password: '',
  confirmPassword: ''
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phone: digits }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email Address is required.');
      return;
    }
    if (form.phone.length !== 10) {
      setError('Mobile Number must be exactly 10 digits.');
      return;
    }
    if (!form.instituteName.trim()) {
      setError('Institute Name is required.');
      return;
    }

    const hasNumber = /\d/.test(form.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(form.password);
    if (form.password.length < 6 || !hasNumber || !hasSpecial) {
      setError('Password must be at least 6 characters and include at least one number and one special character.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      institute_name: form.instituteName,
      battalion: form.battalion || undefined,
      regimental_number: form.regimentalNumber || undefined
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box glass-panel" style={{ position: 'relative', maxWidth: '540px' }}>
        <button onClick={() => navigate(-1)} className="back-btn" style={{ position: 'absolute', top: '15px', left: '15px', background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        <Link to="/" className="logo auth-logo" style={{ marginTop: '1rem' }}>
          <img src="/assets/ncc_logo.png" alt="NCC Logo" className="logo-img" />
          MAA <span>DEFENCE STORES</span>
        </Link>

        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Register to place orders and book uniform fittings.</p>
        </div>

        {error && (
          <div className="auth-alert">
            <i className="fa-solid fa-circle-exclamation"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-input-text"
              placeholder="E.g. Cadet Rahul Sen"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
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
            <label className="form-label">Mobile Number *</label>
            <input
              type="tel"
              name="phone"
              className="form-input-text"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handlePhoneChange}
              required
              maxLength={10}
              autoComplete="tel"
            />
            {form.phone.length > 0 && form.phone.length < 10 && (
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#ff9800' }}>
                {10 - form.phone.length} more digit{10 - form.phone.length !== 1 ? 's' : ''} needed
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Institute Name *</label>
            <input
              type="text"
              name="instituteName"
              className="form-input-text"
              placeholder="School / College / Academy"
              value={form.instituteName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Battalion <span>(optional)</span></label>
              <input
                type="text"
                name="battalion"
                className="form-input-text"
                placeholder="E.g. 2 Delhi Bn NCC"
                value={form.battalion}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Regimental Number <span>(optional)</span></label>
              <input
                type="text"
                name="regimentalNumber"
                className="form-input-text"
                placeholder="E.g. DL/26/SD/12345"
                value={form.regimentalNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="form-input-text"
                placeholder="Min 6 chars + number & symbol"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input-text"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" style={{ marginTop: '1rem' }} disabled={submitting}>
            {submitting ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
