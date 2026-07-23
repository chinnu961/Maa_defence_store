import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { fetchProducts, deleteProduct } from '../api/products.js';
import { fetchAdminOrders, updateAdminOrderStatus, fetchAdminStats, fetchAdminUsers } from '../api/admin.js';
import AdminProductModal from '../components/AdminProductModal.jsx';

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { addNotification, notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'users' | 'notifications'
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all');
  const [stats, setStats] = useState({
    total_orders: 0,
    total_users: 0,
    total_revenue: 0,
    pending_orders: 0,
    orders_by_status: {}
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (tabParam && (tabParam === 'orders' || tabParam === 'products' || tabParam === 'profile' || tabParam === 'users' || tabParam === 'notifications')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    shop_address: user?.shop_address || '',
    password: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin, activeTab]);

  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await fetchAdminUsers();
      setUsersList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadProducts = () => {
    fetchProducts().then(setProducts).catch(console.error);
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const statusParam = orderFilter === 'all' ? null : orderFilter;
      const data = await fetchAdminOrders(statusParam);
      const formatted = data.map(o => ({
        id: o.order_number || o.id,
        backendId: o.id,
        date: o.created_at,
        buyerName: o.full_name,
        phone: o.phone,
        division: o.division,
        regimentId: o.regiment_id,
        instituteName: o.institute_name,
        battalion: o.battalion,
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
        userId: o.user_id
      }));
      setOrders(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'products') {
      loadProducts();
    }
    if (isAdmin && activeTab === 'orders') {
      loadOrders();
    }
    if (isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [isAdmin, activeTab, orderFilter]);

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleConfirm = async (order) => {
    try {
      await updateAdminOrderStatus(order.backendId || order.id, 'confirmed');
      if (order.userId && order.userId !== 'guest') {
        addNotification(order.userId, `Your order #${order.id} has been confirmed.`);
      }
      addNotification('admin', `Order #${order.id} marked as Confirmed.`, { forAdmin: true });
      await loadOrders();
      await loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to confirm order.');
    }
  };

  const handleDeliver = async (order) => {
    try {
      await updateAdminOrderStatus(order.backendId || order.id, 'delivered');
      if (order.userId && order.userId !== 'guest') {
        addNotification(order.userId, `Your order #${order.id} has been delivered!`);
      }
      addNotification('admin', `Order #${order.id} marked as Delivered.`, { forAdmin: true });
      await loadOrders();
      await loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to deliver order.');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        addNotification('admin', `Product deleted successfully.`, { forAdmin: true });
        loadProducts();
        await loadStats();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to delete product.');
      }
    }
  };

  return (
    <main className="admin-layout-container" style={{ padding: '100px 0 0' }}>
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Control Suite</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-user-shield"></i> Store Admin
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => handleTabChange('orders')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              background: activeTab === 'orders' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: activeTab === 'orders' ? '1px solid var(--accent-gold)' : '1px solid transparent',
              color: activeTab === 'orders' ? 'var(--accent-gold)' : 'var(--color-secondary)',
              padding: '12px 16px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            <i className="fa-solid fa-clipboard-list" style={{ marginRight: '12px', fontSize: '1.1rem' }}></i>
            Manage Orders
          </button>

          <button
            onClick={() => handleTabChange('products')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              background: activeTab === 'products' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: activeTab === 'products' ? '1px solid var(--accent-gold)' : '1px solid transparent',
              color: activeTab === 'products' ? 'var(--accent-gold)' : 'var(--color-secondary)',
              padding: '12px 16px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            <i className="fa-solid fa-box-open" style={{ marginRight: '12px', fontSize: '1.1rem' }}></i>
            Manage Products
          </button>

          <button
            onClick={() => handleTabChange('users')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              background: activeTab === 'users' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: activeTab === 'users' ? '1px solid var(--accent-gold)' : '1px solid transparent',
              color: activeTab === 'users' ? 'var(--accent-gold)' : 'var(--color-secondary)',
              padding: '12px 16px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            <i className="fa-solid fa-users" style={{ marginRight: '12px', fontSize: '1.1rem' }}></i>
            Registered Users
          </button>

          <button
            onClick={() => handleTabChange('notifications')}
            className="btn"
            style={{
              justifyContent: 'space-between',
              width: '100%',
              background: activeTab === 'notifications' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: activeTab === 'notifications' ? '1px solid var(--accent-gold)' : '1px solid transparent',
              color: activeTab === 'notifications' ? 'var(--accent-gold)' : 'var(--color-secondary)',
              padding: '12px 16px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-bell" style={{ marginRight: '12px', fontSize: '1.1rem' }}></i>
              System Notifications
            </span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="cart-badge" style={{ position: 'static', transform: 'none', background: 'var(--accent-gold)', color: 'black', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* Workspace Area */}
      <div className="admin-workspace">
        {/* Helper to handle stats widget redirects */}
        {(() => {
          window.handleCardRedirect = (tab, filter = null) => {
            setActiveTab(tab);
            setSearchParams({ tab });
            if (filter) {
              setOrderFilter(filter);
            }
          };
          return null;
        })()}

        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div 
            className="glass-panel" 
            onClick={() => window.handleCardRedirect('orders', 'all')}
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition-normal)' }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
              ₹{stats.total_revenue.toLocaleString()}
            </span>
          </div>

          <div 
            className="glass-panel" 
            onClick={() => window.handleCardRedirect('orders', 'pending')}
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition-normal)' }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Orders</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ff9800' }}>
              {stats.pending_orders}
            </span>
          </div>

          <div 
            className="glass-panel" 
            onClick={() => window.handleCardRedirect('orders', 'all')}
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition-normal)' }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2196f3' }}>
              {stats.total_orders}
            </span>
          </div>

          <div 
            className="glass-panel" 
            onClick={() => window.handleCardRedirect('users')}
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition-normal)' }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Users</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4caf50' }}>
              {stats.total_users}
            </span>
          </div>
        </div>

        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Manage Orders</h3>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="form-input-text"
                style={{ width: '200px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--color-primary)' }}
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loadingOrders ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}></i>
                <h3>Loading orders...</h3>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: 'var(--color-muted)', marginBottom: '1rem' }}></i>
                <h3>No orders found.</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {orders.map((order) => (
                  <div key={order.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, color: 'var(--accent-gold)' }}>Order {order.id}</h3>
                        <small style={{ color: 'var(--color-muted)' }}>{new Date(order.date).toLocaleString()}</small>
                      </div>
                      <div>
                        <span style={{
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: order.status === 'Pending' ? '#ff9800' : order.status === 'Confirmed' ? '#2196f3' : order.status === 'Delivered' ? '#4caf50' : '#f44336',
                          color: 'var(--color-primary)'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Buyer Details</h4>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Name:</strong> {order.buyerName}</p>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Phone:</strong> {order.phone}</p>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Division:</strong> {order.division}</p>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Regiment ID:</strong> {order.regimentId}</p>
                        {order.instituteName && <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Institute:</strong> {order.instituteName}</p>}
                        {order.battalion && <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Battalion:</strong> {order.battalion}</p>}
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Order Summary</h4>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Items:</strong> {order.totals.itemCount}</p>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem' }}><strong>Total:</strong> ₹{order.totals.grandTotal.toLocaleString()}</p>
                        <div style={{ marginTop: '0.5rem' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                      {order.status === 'Pending' && (
                        <button className="btn btn-primary" onClick={() => handleConfirm(order)}>
                          <i className="fa-solid fa-check" style={{ marginRight: 8 }}></i> Confirm Order
                        </button>
                      )}
                      {order.status === 'Confirmed' && (
                        <button className="btn btn-secondary" onClick={() => handleDeliver(order)} style={{ borderColor: '#4caf50', color: '#4caf50' }}>
                          <i className="fa-solid fa-truck" style={{ marginRight: 8 }}></i> Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Products Catalog</h3>
              <button className="btn btn-primary" onClick={handleAddProduct}>
                <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i> Add New Product
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '10px' }}>Image</th>
                    <th style={{ padding: '10px' }}>ID / Name</th>
                    <th style={{ padding: '10px' }}>Category</th>
                    <th style={{ padding: '10px' }}>Price</th>
                    <th style={{ padding: '10px' }}>Stock</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '10px' }}>
                        <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{p.id}</div>
                      </td>
                      <td style={{ padding: '10px', textTransform: 'capitalize' }}>{p.category}</td>
                      <td style={{ padding: '10px' }}>₹{p.price}</td>
                      <td style={{ padding: '10px' }}>{p.stock}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="admin-edit-btn" onClick={() => handleEditProduct(p)}>
                            <i className="fa-solid fa-pen"></i> Edit
                          </button>
                          <button className="admin-delete-btn" onClick={() => handleDeleteProduct(p.id)}>
                            <i className="fa-solid fa-trash-can"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                        No products found in the database. Add one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Registered Users</h3>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}></i>
                <h3>Loading users...</h3>
              </div>
            ) : usersList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-users-slash" style={{ fontSize: '3rem', color: 'var(--color-muted)', marginBottom: '1rem' }}></i>
                <h3>No registered users found.</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {usersList.map((usr) => (
                  <div key={usr.id} className="glass-panel" style={{ padding: '1.5rem', background: '#0e110e', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <h4 
                            onClick={() => navigate(`/admin/user/${usr.id}`)}
                            style={{ margin: '0 0 5px', color: 'var(--accent-gold)', fontSize: '1.1rem', cursor: 'pointer', display: 'inline-block' }}
                          >
                            {usr.name}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>ID: {usr.id}</div>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/user/${usr.id}`)}
                          className="admin-edit-btn"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', textTransform: 'none' }}
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i> Details
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Email Address</strong>
                          <span style={{ fontSize: '0.9rem' }}>{usr.email}</span>
                        </div>
                        {usr.phone && (
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Phone</strong>
                            <span style={{ fontSize: '0.9rem' }}>{usr.phone}</span>
                          </div>
                        )}
                        {usr.institute_name && (
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Institute</strong>
                            <span style={{ fontSize: '0.9rem' }}>{usr.institute_name}</span>
                          </div>
                        )}
                        {usr.battalion && (
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Battalion</strong>
                            <span style={{ fontSize: '0.9rem' }}>{usr.battalion}</span>
                          </div>
                        )}
                        {usr.regimental_number && (
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Regt No.</strong>
                            <span style={{ fontSize: '0.9rem' }}>{usr.regimental_number}</span>
                          </div>
                        )}
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Role</strong>
                          <span style={{ fontSize: '0.9rem', color: usr.role === 'admin' ? 'var(--accent-gold)' : 'var(--color-primary)', fontWeight: 'bold', textTransform: 'capitalize' }}>{usr.role}</span>
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Joined</strong>
                          <span style={{ fontSize: '0.9rem' }}>{new Date(usr.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 10px', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User's Orders</h5>
                      {usr.orders && usr.orders.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Order Number</th>
                                <th style={{ padding: '8px' }}>Date</th>
                                <th style={{ padding: '8px' }}>Buyer Name</th>
                                <th style={{ padding: '8px' }}>Grand Total</th>
                                <th style={{ padding: '8px' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {usr.orders.map((ord) => (
                                <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <td style={{ padding: '8px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>{ord.order_number}</td>
                                  <td style={{ padding: '8px', color: 'var(--color-secondary)' }}>{new Date(ord.created_at).toLocaleDateString()}</td>
                                  <td style={{ padding: '8px', color: 'var(--color-secondary)' }}>{ord.full_name}</td>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>₹{ord.grand_total.toLocaleString()}</td>
                                  <td style={{ padding: '8px' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      backgroundColor: ord.status === 'pending' ? '#ff9800' : ord.status === 'confirmed' ? '#2196f3' : ord.status === 'delivered' ? '#4caf50' : '#f44336',
                                      color: 'var(--color-primary)',
                                      textTransform: 'capitalize'
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
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>No orders placed yet.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>System Notifications</h3>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-bell-slash" style={{ fontSize: '3rem', color: 'var(--color-muted)', marginBottom: '1rem' }}></i>
                <h3>No notifications found.</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className="glass-panel" 
                    onClick={() => {
                      markAsRead(notif.id);
                      setSelectedNotif(notif);
                    }}
                    style={{ 
                      padding: '1.25rem', 
                      background: notif.read ? '#0e110e' : 'rgba(212, 175, 55, 0.08)', 
                      border: notif.read ? '1px solid var(--glass-border)' : '1px solid var(--accent-gold)', 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'var(--transition-normal)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: notif.type === 'order' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: notif.type === 'order' ? '#2196f3' : '#4caf50'
                      }}>
                        <i className={`fa-solid ${notif.type === 'order' ? 'fa-cart-shopping' : 'fa-user'}`}></i>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 5px', color: notif.read ? 'var(--color-primary)' : 'var(--accent-gold)', fontSize: '1.05rem' }}>
                          {notif.title} {!notif.read && <span style={{ fontSize: '0.7rem', verticalAlign: 'middle', background: 'var(--accent-gold)', color: 'black', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>NEW</span>}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-secondary)' }}>{notif.message}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', minWidth: '100px' }}>
                      <small style={{ color: 'var(--color-muted)' }}>{new Date(notif.created_at).toLocaleDateString()}</small>
                      <small style={{ color: 'var(--color-muted)' }}>{new Date(notif.created_at).toLocaleTimeString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showProductModal && (
        <AdminProductModal
          product={editingProduct}
          onClose={() => setShowProductModal(false)}
          onSaved={() => {
            setShowProductModal(false);
            loadProducts();
            loadStats();
          }}
        />
      )}

      {selectedNotif && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#0e110e', border: '1px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-gold)' }}>{selectedNotif.title}</h3>
              <button onClick={() => setSelectedNotif(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>{selectedNotif.message}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>Received: {new Date(selectedNotif.created_at).toLocaleString()}</p>
              
              {(() => {
                try {
                  if (!selectedNotif.data) return null;
                  const details = JSON.parse(selectedNotif.data);
                  
                  if (selectedNotif.type === 'order') {
                    return (
                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ color: 'var(--accent-gold)', margin: '0 0 0.5rem 0' }}>Order Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <p style={{ margin: 0 }}><strong>Order Number:</strong> {details.order_number}</p>
                          <p style={{ margin: 0 }}><strong>Grand Total:</strong> ₹{details.grand_total.toLocaleString()}</p>
                          <p style={{ margin: 0 }}><strong>Buyer Name:</strong> {details.full_name}</p>
                          <p style={{ margin: 0 }}><strong>Phone:</strong> {details.phone}</p>
                          <p style={{ margin: 0 }}><strong>Division:</strong> {details.division}</p>
                          <p style={{ margin: 0 }}><strong>Regiment ID:</strong> {details.regiment_id}</p>
                          {details.institute_name && <p style={{ margin: 0 }}><strong>Institute:</strong> {details.institute_name}</p>}
                          {details.battalion && <p style={{ margin: 0 }}><strong>Battalion:</strong> {details.battalion}</p>}
                        </div>
                        
                        <div style={{ marginTop: '0.5rem' }}>
                          <h5 style={{ color: 'var(--color-primary)', margin: '0 0 0.5rem 0' }}>Items:</h5>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-muted)' }}>
                                <th style={{ padding: '5px' }}>Item Name</th>
                                <th style={{ padding: '5px' }}>Qty</th>
                                <th style={{ padding: '5px' }}>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {details.items && details.items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '5px' }}>{item.name}</td>
                                  <td style={{ padding: '5px' }}>{item.quantity}</td>
                                  <td style={{ padding: '5px' }}>₹{item.price.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  } else if (selectedNotif.type === 'user_signup') {
                    return (
                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <h4 style={{ color: 'var(--accent-gold)', margin: '0 0 0.5rem 0' }}>User Profile Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <p style={{ margin: 0 }}><strong>Name:</strong> {details.name}</p>
                          <p style={{ margin: 0 }}><strong>Email:</strong> {details.email}</p>
                          <p style={{ margin: 0 }}><strong>Phone:</strong> {details.phone}</p>
                          {details.institute_name && <p style={{ margin: 0 }}><strong>Institute:</strong> {details.institute_name}</p>}
                          {details.battalion && <p style={{ margin: 0 }}><strong>Battalion:</strong> {details.battalion}</p>}
                          {details.regimental_number && <p style={{ margin: 0 }}><strong>Regimental Number:</strong> {details.regimental_number}</p>}
                          <p style={{ margin: 0 }}><strong>Role:</strong> {details.role}</p>
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('Failed to parse details', e);
                }
                return null;
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedNotif(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
