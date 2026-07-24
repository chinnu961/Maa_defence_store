import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAdminUsers } from '../api/admin.js';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usr, setUsr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const list = await fetchAdminUsers();
        const found = list.find((u) => u.id === id);
        if (found) {
          setUsr(found);
        } else {
          setError('User not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch user details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <main className="main-content" style={{ minHeight: '90vh', padding: '120px 1rem 60px', background: '#080a08', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--accent-gold)', marginBottom: '1.5rem' }}></i>
          <h2 style={{ color: 'var(--color-primary)' }}>Loading User Details...</h2>
        </div>
      </main>
    );
  }

  if (error || !usr) {
    return (
      <main className="main-content" style={{ minHeight: '90vh', padding: '120px 1rem 60px', background: '#080a08', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: '#f44336', marginBottom: '1.5rem' }}></i>
          <h2 style={{ color: '#f44336', marginBottom: '1rem' }}>Error</h2>
          <p style={{ color: 'var(--color-secondary)', marginBottom: '2.5rem' }}>{error || 'User details could not be found.'}</p>
          <button onClick={() => navigate('/admin?tab=users')} className="btn btn-primary" style={{ width: '100%' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i> Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ minHeight: '90vh', padding: '120px 1rem 60px', background: '#080a08' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Navigation & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/admin?tab=users')}
            className="admin-edit-btn"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'none' }}
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Users
          </button>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-primary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Cadet Profile</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Details and order history for {usr.name}</span>
          </div>
        </div>

        {/* Profile Card details */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-user-shield" style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}></i>
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--accent-gold)', fontSize: '1.5rem' }}>{usr.name}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Role: <span style={{ textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 'bold' }}>{usr.role}</span></span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</strong>
              <span style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{usr.email}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</strong>
              <span style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{usr.phone || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Institute Name</strong>
              <span style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{usr.institute_name || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Battalion</strong>
              <span style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{usr.battalion || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Regimental Number</strong>
              <span style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{usr.regimental_number || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Registered Date</strong>
              <span style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{new Date(usr.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* User's orders */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: 'var(--color-primary)' }}>Order History</h3>

          {usr.orders && usr.orders.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px' }}>Order Number</th>
                    <th style={{ padding: '12px' }}>Date & Time</th>
                    <th style={{ padding: '12px' }}>Division</th>
                    <th style={{ padding: '12px' }}>Regt ID</th>
                    <th style={{ padding: '12px' }}>Grand Total</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usr.orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '12px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>{ord.order_number}</td>
                      <td style={{ padding: '12px' }}>{new Date(ord.created_at).toLocaleString()}</td>
                      <td style={{ padding: '12px', textTransform: 'uppercase' }}>{ord.division?.replace('_', ' ')}</td>
                      <td style={{ padding: '12px' }}>{ord.regiment_id}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{ord.grand_total.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: ord.status === 'pending' ? 'rgba(255, 152, 0, 0.15)' : ord.status === 'confirmed' ? 'rgba(33, 150, 243, 0.15)' : ord.status === 'delivered' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
                          color: ord.status === 'pending' ? '#ff9800' : ord.status === 'confirmed' ? '#2196f3' : ord.status === 'delivered' ? '#4caf50' : '#f44336',
                          border: `1px solid ${ord.status === 'pending' ? '#ff9800' : ord.status === 'confirmed' ? '#2196f3' : ord.status === 'delivered' ? '#4caf50' : '#f44336'}`
                        }}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
              <i className="fa-solid fa-clipboard-question" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
              <p>This cadet has not placed any orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
