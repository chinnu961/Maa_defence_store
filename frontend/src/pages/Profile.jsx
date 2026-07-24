import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { fetchMyOrders, cancelOrder } from '../api/orders.js';

/* ─── In-App Confirm Dialog ────────────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 0.2s ease',
        position: 'relative'
      }}>
        {/* X close button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid var(--glass-border)',
            color: 'var(--color-muted)',
            width: 30, height: 30,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--color-muted)'; }}
          title="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(244,67,54,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.5rem', color: '#f44336' }}></i>
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
            Cancel Order?
          </h3>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.75rem',
              background: 'transparent',
              border: '1.5px solid var(--glass-border)',
              color: 'var(--color-primary)',
              borderRadius: '8px', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i> Go Back
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.75rem',
              background: '#f44336',
              border: '1.5px solid #f44336',
              color: '#fff',
              borderRadius: '8px', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#d32f2f'}
            onMouseLeave={e => e.currentTarget.style.background = '#f44336'}
          >
            <i className="fa-solid fa-xmark" style={{ marginRight: 6 }}></i> Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────────── */

export default function Profile() {
  const { user, isAuthenticated, isAdmin, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { orderId, orderNum }

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await fetchMyOrders();
      const formatted = data.map(o => ({
        id: o.order_number || o.id,
        backendId: o.id,
        date: o.created_at,
        buyerName: o.full_name,
        phone: o.phone,
        division: o.division,
        regimentId: o.regiment_id,
        items: o.items.map(item => ({
          id: item.product_id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isCustom: item.is_custom,
          details: item.details
        })),
        totals: {
          subtotal: o.subtotal,
          fittingFee: o.fitting_fee,
          grandTotal: o.grand_total,
          itemCount: o.items.reduce((s, i) => s + i.quantity, 0)
        },
        status: o.status === 'pending' ? 'Pending' : o.status === 'confirmed' ? 'Confirmed' : o.status === 'delivered' ? 'Delivered' : o.status === 'cancelled' ? 'Cancelled' : 'Pending',
        cancellationReason: o.cancellation_reason
      }));
      setOrders(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      loadOrders();
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setProfileForm(prev => ({ ...prev, phone: digits }));
    } else {
      setProfileForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profileForm.phone && profileForm.phone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setProfileSaving(true);
    const payload = {};
    if (profileForm.name !== user.name) payload.name = profileForm.name;
    if (profileForm.email !== user.email) payload.email = profileForm.email;
    if (profileForm.phone !== (user.phone || '')) payload.phone = profileForm.phone;
    if (profileForm.password) payload.password = profileForm.password;

    if (Object.keys(payload).length > 0) {
      await updateProfile(payload);
    }
    setProfileForm(prev => ({ ...prev, password: '' }));
    setProfileSaving(false);
  };

  const { addNotification } = useNotifications();

  const askCancelOrder = (order) => {
    setConfirmDialog({ orderId: order.backendId || order.id, orderNum: order.id });
  };

  const confirmCancelOrder = async () => {
    if (confirmDialog) {
      try {
        await cancelOrder(confirmDialog.orderId);
        if (user?.id) {
          addNotification(user.id, `Your order #${confirmDialog.orderNum} has been cancelled.`);
        }
        addNotification('admin', `Order #${confirmDialog.orderNum} was cancelled by ${user?.name || 'customer'}.`, { forAdmin: true });
        setConfirmDialog(null);
        await loadOrders();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to cancel order.');
      }
    }
  };

  const statusColor = (status) => {
    if (status === 'Pending') return '#ff9800';
    if (status === 'Confirmed') return '#2196f3';
    if (status === 'Delivered') return '#4caf50';
    if (status === 'Cancelled') return '#f44336';
    return 'var(--color-muted)';
  };

  const myOrders = orders;

  return (
    <>
      {/* Custom confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={`Are you sure you want to cancel order #${confirmDialog.orderNum}? This action cannot be undone.`}
          onConfirm={confirmCancelOrder}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <main style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '4rem', background: 'var(--bg-body)' }}>
        <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1rem' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'transparent', border: '1.5px solid var(--glass-border)', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '1rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.color = 'var(--accent-gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Store
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--bg-primary)', fontWeight: 'bold', flexShrink: 0 }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.4rem' }}>{user.name}</h2>
                  <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  background: 'rgba(244, 67, 54, 0.1)', 
                  border: '1px solid rgba(244, 67, 54, 0.3)', 
                  color: '#ff5252', 
                  cursor: 'pointer', 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,67,54,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,67,54,0.1)'; }}
              >
                <i className="fa-solid fa-right-from-bracket"></i> Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--glass-border)', flexWrap: 'wrap' }}>
            {['orders', 'profile'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  fontSize: '0.95rem',
                  color: activeTab === tab ? 'var(--accent-gold)' : 'var(--color-muted)',
                  borderBottom: activeTab === tab ? '3px solid var(--accent-gold)' : '3px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className={`fa-solid ${tab === 'orders' ? 'fa-box' : 'fa-user'}`} style={{ marginRight: 8 }}></i>
                {tab === 'orders' ? 'My Orders' : 'Edit Profile'}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            myOrders.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: 'var(--color-muted)', marginBottom: '1rem', display: 'block' }}></i>
                <h3 style={{ color: 'var(--color-primary)' }}>No orders yet</h3>
                <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Your order history will appear here after placing an order.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                  <i className="fa-solid fa-store" style={{ marginRight: 8 }}></i> Browse Store
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {myOrders.map(order => (
                  <div key={order.id} className="glass-panel" style={{ overflow: 'hidden', padding: '1.25rem' }}>
                    {/* Order Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--accent-gold)', fontSize: '1rem' }}>Order #{order.id}</h4>
                        <p style={{ margin: '2px 0 0', color: 'var(--color-muted)', fontSize: '0.82rem' }}>{new Date(order.date).toLocaleString()}</p>
                      </div>
                      <span style={{
                        padding: '4px 14px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        backgroundColor: statusColor(order.status),
                        color: '#fff',
                        letterSpacing: '0.03em'
                      }}>
                        {order.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-secondary)' }}>
                            {item.quantity}× {item.name}
                            {item.details ? <span style={{ color: 'var(--color-muted)', fontSize: '0.82rem' }}> ({item.details})</span> : null}
                          </span>
                          <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        Total: <span style={{ color: 'var(--accent-gold)' }}>₹{order.totals?.grandTotal?.toLocaleString() || '—'}</span>
                      </div>
                      {(order.status === 'Pending' || order.status === 'Confirmed') && (
                        <button
                          onClick={() => askCancelOrder(order)}
                          style={{
                            background: 'transparent',
                            border: '1.5px solid #f44336',
                            color: '#f44336',
                            borderRadius: '8px',
                            padding: '7px 18px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f44336'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f44336'; }}
                        >
                          <i className="fa-solid fa-xmark" style={{ marginRight: 6 }}></i> Cancel Order
                        </button>
                      )}
                      {order.status === 'Cancelled' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '0.82rem', color: '#f44336' }}>
                            <i className="fa-solid fa-circle-xmark" style={{ marginRight: 4 }}></i> Order cancelled
                          </span>
                          {order.cancellationReason && (
                            <small style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                              Reason: {order.cancellationReason}
                            </small>
                          )}
                        </div>
                      )}
                      {order.status === 'Delivered' && (
                        <span style={{ fontSize: '0.82rem', color: '#4caf50' }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }}></i> Delivered
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Profile Edit Tab */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              {/* Profile Card Header */}
              <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-gold), #b8860b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 2px', color: 'var(--color-primary)', fontSize: '1.2rem' }}>Personal Information</h3>
                  <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.85rem' }}>Update your profile details below</p>
                </div>
              </div>

              {/* Form Card */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Full Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <i className="fa-solid fa-user" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', fontSize: '0.9rem' }}></i>
                      <input
                        required type="text" name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        className="form-input-text"
                        style={{ paddingLeft: '38px' }}
                        minLength={2}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', fontSize: '0.9rem' }}></i>
                      <input
                        required type="email" name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        className="form-input-text"
                        style={{ paddingLeft: '38px' }}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                      Mobile Number <span style={{ color: 'var(--color-muted)', fontWeight: '400', textTransform: 'none' }}>(10 digits)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <i className="fa-solid fa-phone" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', fontSize: '0.9rem' }}></i>
                      <input
                        type="tel" name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        className="form-input-text"
                        style={{ paddingLeft: '38px' }}
                        placeholder="E.g. 9876543210"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        title="Please enter a 10-digit mobile number"
                      />
                    </div>
                    {profileForm.phone.length > 0 && profileForm.phone.length < 10 && (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#f44336', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fa-solid fa-circle-exclamation"></i>
                        {10 - profileForm.phone.length} more digit{10 - profileForm.phone.length !== 1 ? 's' : ''} needed
                      </p>
                    )}
                    {profileForm.phone.length === 10 && (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#4caf50', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fa-solid fa-circle-check"></i> Valid mobile number
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid var(--glass-border)', margin: '0.25rem 0' }}></div>

                  {/* Password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--color-muted)', textTransform: 'uppercase' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', fontSize: '0.9rem' }}></i>
                      <input
                        type="password" name="password"
                        value={profileForm.password}
                        onChange={handleProfileChange}
                        className="form-input-text"
                        style={{ paddingLeft: '38px' }}
                        placeholder="Leave blank to keep current password"
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '14px', fontSize: '1rem', fontWeight: '700', letterSpacing: '0.04em' }} disabled={profileSaving}>
                    {profileSaving ? (
                      <><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: 8 }}></i>Saving Changes...</>
                    ) : (
                      <><i className="fa-solid fa-floppy-disk" style={{ marginRight: 8 }}></i>Save Changes</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
