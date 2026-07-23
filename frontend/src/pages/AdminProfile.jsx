import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminProfile() {
  const { user, isAuthenticated, isAdmin, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    shop_address: user?.shop_address || '',
    password: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        shop_address: user.shop_address || ''
      }));
    }
  }, [user]);

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const payload = {};
    const changes = [];

    if (profileForm.name !== user.name) {
      payload.name = profileForm.name;
    }
    if (profileForm.email !== user.email) {
      payload.email = profileForm.email;
      changes.push("email changed");
    }
    if (profileForm.phone !== (user.phone || '')) {
      payload.phone = profileForm.phone;
      changes.push("phone number changed");
    }
    if (profileForm.shop_address !== (user.shop_address || '')) {
      payload.shop_address = profileForm.shop_address;
      changes.push("shop address changed");
    }
    if (profileForm.password) {
      payload.password = profileForm.password;
    }
    
    try {
      if (Object.keys(payload).length > 0) {
        await updateProfile(payload);
        // pop alert messages for each change
        for (const msg of changes) {
          alert(msg);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setProfileForm(prev => ({ ...prev, password: '' }));
      setProfileSaving(false);
    }
  };

  return (
    <main className="main-content" style={{ minHeight: '80vh', padding: '120px 20px 60px' }}>
      <div className="container" style={{ position: 'relative', maxWidth: '600px' }}>
        <button 
          onClick={() => navigate(-1)} 
          className="back-btn" 
          style={{ 
            position: 'absolute', 
            top: '-40px', 
            left: '0', 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--color-secondary)', 
            cursor: 'pointer', 
            fontSize: '1.2rem', 
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>

        <h2 className="section-title">Profile Section</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-secondary)' }}>
          Manage your personal details, helpline contact, and store address.
        </p>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-primary)' }}>Edit Admin Details</h3>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" name="name" value={profileForm.name} onChange={handleProfileChange} className="form-input-text" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" name="email" value={profileForm.email} onChange={handleProfileChange} className="form-input-text" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (Updates "Contact Us")</label>
              <input type="tel" name="phone" value={profileForm.phone} onChange={handleProfileChange} className="form-input-text" />
            </div>
            <div className="form-group">
              <label className="form-label">Shop Address (Updates Outlet Locations)</label>
              <textarea name="shop_address" value={profileForm.shop_address} onChange={handleProfileChange} className="form-input-text" style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" name="password" value={profileForm.password} onChange={handleProfileChange} className="form-input-text" placeholder="Leave blank to keep current password" minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={profileSaving}>
              {profileSaving ? 'Saving Profile...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
