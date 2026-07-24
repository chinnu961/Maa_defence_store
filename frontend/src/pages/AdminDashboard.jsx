import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { fetchProducts, deleteProduct } from '../api/products.js';
import { fetchAdminOrders, updateAdminOrderStatus, fetchAdminStats, fetchAdminUsers } from '../api/admin.js';
import AdminProductModal from '../components/AdminProductModal.jsx';

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products'
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
    if (tabParam && (tabParam === 'orders' || tabParam === 'products' || tabParam === 'profile' || tabParam === 'users' || tabParam === 'payments')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [aggregationFilter, setAggregationFilter] = useState('all');

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
        cancellationReason: o.cancellation_reason,
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
    if (isAdmin && (activeTab === 'orders' || activeTab === 'payments')) {
      loadOrders();
    }
    if (isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [isAdmin, activeTab, orderFilter]);

  // Group Payments & Aggregations
  const paymentsList = orders.filter(o => o.status === 'Confirmed' || o.status === 'Delivered');

  const filteredPaymentsList = paymentsList.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  const dayWisePayments = {};
  const monthWisePayments = {};
  const yearWisePayments = {};

  filteredPaymentsList.forEach(o => {
    if (!o.date) return;
    const dateObj = new Date(o.date);
    const amount = o.totals.grandTotal;

    // Day
    const dayStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    dayWisePayments[dayStr] = (dayWisePayments[dayStr] || 0) + amount;

    // Month
    const monthStr = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    monthWisePayments[monthStr] = (monthWisePayments[monthStr] || 0) + amount;

    // Year
    const yearStr = dateObj.getFullYear().toString();
    yearWisePayments[yearStr] = (yearWisePayments[yearStr] || 0) + amount;
  });

  const exportToExcel = () => {
    let csv = 'Payment ID,Date,Buyer Name,Phone,Division,Item Count,Amount,Status\n';
    filteredPaymentsList.forEach(p => {
      csv += `"${p.id}","${new Date(p.date).toLocaleString()}","${p.buyerName}","${p.phone}","${p.division}",${p.totals.itemCount},${p.totals.grandTotal},"${p.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "payments_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Payments History Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h2 { font-family: Arial, sans-serif; color: #333; }
      </style>
      </head>
      <body>
        <h2>Payments History Report</h2>
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Buyer Name</th>
              <th>Phone</th>
              <th>Division</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    filteredPaymentsList.forEach(p => {
      html += `
        <tr>
          <td>${p.id}</td>
          <td>${new Date(p.date).toLocaleString()}</td>
          <td>${p.buyerName}</td>
          <td>${p.phone}</td>
          <td>${p.division}</td>
          <td>${p.totals.itemCount}</td>
          <td>₹${p.totals.grandTotal.toLocaleString()}</td>
          <td>${p.status}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "payments_history.doc");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
      <head>
        <title>Payments History Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h2 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #f4f4f4; font-weight: bold; }
          .summary { margin-top: 30px; border-top: 2px solid #333; padding-top: 10px; text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>MAA Defence Stores - Payments History Report</h2>
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Buyer Name</th>
              <th>Phone</th>
              <th>Division</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    let totalAmount = 0;
    filteredPaymentsList.forEach(p => {
      totalAmount += p.totals.grandTotal;
      html += `
        <tr>
          <td>${p.id}</td>
          <td>${new Date(p.date).toLocaleString()}</td>
          <td>${p.buyerName}</td>
          <td>${p.phone}</td>
          <td>${p.division}</td>
          <td>${p.totals.itemCount}</td>
          <td>₹${p.totals.grandTotal.toLocaleString()}</td>
          <td>${p.status}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
        <div class="summary">
          Total Collected: ₹${totalAmount.toLocaleString()}
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };
  const totalProductsCount = products.length;
  const newlyAddedProductsCount = products.filter(p => {
    if (!p.created_at) return false;
    const diffTime = Math.abs(new Date() - new Date(p.created_at));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;
  const previousProductsCount = totalProductsCount - newlyAddedProductsCount;

  const totalUsersCount = usersList.length;
  const newlyAddedUsersCount = usersList.filter(u => {
    if (!u.created_at) return false;
    const diffTime = Math.abs(new Date() - new Date(u.created_at));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;
  const previousUsersCount = totalUsersCount - newlyAddedUsersCount;

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

  const handleCancelClick = (order) => {
    setCancellingOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason.');
      return;
    }
    try {
      await updateAdminOrderStatus(cancellingOrder.backendId || cancellingOrder.id, 'cancelled', cancelReason.trim());
      if (cancellingOrder.userId && cancellingOrder.userId !== 'guest') {
        addNotification(cancellingOrder.userId, `Your order #${cancellingOrder.id} has been cancelled. Reason: ${cancelReason.trim()}`);
      }
      addNotification('admin', `Order #${cancellingOrder.id} has been cancelled.`, { forAdmin: true });
      setShowCancelModal(false);
      setCancellingOrder(null);
      setCancelReason('');
      await loadOrders();
      await loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order.');
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
            onClick={() => handleTabChange('payments')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              background: activeTab === 'payments' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: activeTab === 'payments' ? '1px solid var(--accent-gold)' : '1px solid transparent',
              color: activeTab === 'payments' ? 'var(--accent-gold)' : 'var(--color-secondary)',
              padding: '12px 16px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '12px', fontSize: '1.1rem' }}></i>
            Payments History
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

        {/* Manage Orders Tab Stats */}
        {activeTab === 'orders' && (
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
        )}

        {/* Manage Products Tab Stats */}
        {activeTab === 'products' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Products</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                {totalProductsCount}
              </span>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous Products</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2196f3' }}>
                {previousProductsCount}
              </span>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Newly Added Products</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4caf50' }}>
                {newlyAddedProductsCount}
              </span>
            </div>
          </div>
        )}

        {/* Registered Users Tab Stats */}
        {activeTab === 'users' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                {totalUsersCount}
              </span>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous Users</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2196f3' }}>
                {previousUsersCount}
              </span>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Newly Added Users</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4caf50' }}>
                {newlyAddedUsersCount}
              </span>
            </div>
          </div>
        )}

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
                        {order.status === 'Cancelled' && order.cancellationReason && (
                          <p style={{ margin: '10px 0 0', fontSize: '0.9rem', color: '#ff6b6b' }}>
                            <strong>Cancellation Reason:</strong> {order.cancellationReason}
                          </p>
                        )}
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
                        <>
                          <button className="btn btn-primary" onClick={() => handleConfirm(order)}>
                            <i className="fa-solid fa-check" style={{ marginRight: 8 }}></i> Confirm Order
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleCancelClick(order)} style={{ borderColor: '#f44336', color: '#f44336', background: 'transparent' }}>
                            <i className="fa-solid fa-xmark" style={{ marginRight: 8 }}></i> Cancel Order
                          </button>
                        </>
                      )}
                      {order.status === 'Confirmed' && (
                        <>
                          <button className="btn btn-secondary" onClick={() => handleDeliver(order)} style={{ borderColor: '#4caf50', color: '#4caf50' }}>
                            <i className="fa-solid fa-truck" style={{ marginRight: 8 }}></i> Mark Delivered
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleCancelClick(order)} style={{ borderColor: '#f44336', color: '#f44336', background: 'transparent' }}>
                            <i className="fa-solid fa-xmark" style={{ marginRight: 8 }}></i> Cancel Order
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (() => {
          const filteredProducts = products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(productSearch.toLowerCase())
          );
          return (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Products Catalog</h3>
                <div style={{ display: 'flex', gap: '1rem', flex: '1 1 auto', justifyContent: 'flex-end', alignItems: 'center', minWidth: '280px' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}></i>
                    <input
                      type="text"
                      placeholder="Search ID or Name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="form-input-text"
                      style={{ paddingLeft: '35px', margin: 0, width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--color-primary)' }}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleAddProduct} style={{ whiteSpace: 'nowrap' }}>
                    <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i> Add New Product
                  </button>
                </div>
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
                    {filteredProducts.map(p => (
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
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                          {productSearch ? 'No products match your search.' : 'No products found in the database. Add one to get started!'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

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

        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Metric / Aggregations Row */}
            {aggregationFilter !== 'none' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                {/* Day-Wise Aggregation */}
                {(aggregationFilter === 'all' || aggregationFilter === 'day') && (
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: 'var(--accent-gold)' }}>
                      <i className="fa-solid fa-calendar-day" style={{ marginRight: 8 }}></i> Day-Wise Revenue
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.keys(dayWisePayments).length > 0 ? Object.entries(dayWisePayments).map(([day, amt]) => (
                        <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--color-secondary)' }}>{day}</span>
                          <strong style={{ color: 'var(--color-primary)' }}>₹{amt.toLocaleString()}</strong>
                        </div>
                      )) : <span style={{ fontStyle: 'italic', color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data available</span>}
                    </div>
                  </div>
                )}

                {/* Month-Wise Aggregation */}
                {(aggregationFilter === 'all' || aggregationFilter === 'month') && (
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: 'var(--accent-gold)' }}>
                      <i className="fa-solid fa-calendar-week" style={{ marginRight: 8 }}></i> Month-Wise Revenue
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.keys(monthWisePayments).length > 0 ? Object.entries(monthWisePayments).map(([month, amt]) => (
                        <div key={month} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--color-secondary)' }}>{month}</span>
                          <strong style={{ color: 'var(--color-primary)' }}>₹{amt.toLocaleString()}</strong>
                        </div>
                      )) : <span style={{ fontStyle: 'italic', color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data available</span>}
                    </div>
                  </div>
                )}

                {/* Year-Wise Aggregation */}
                {(aggregationFilter === 'all' || aggregationFilter === 'year') && (
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: 'var(--accent-gold)' }}>
                      <i className="fa-solid fa-calendar" style={{ marginRight: 8 }}></i> Year-Wise Revenue
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.keys(yearWisePayments).length > 0 ? Object.entries(yearWisePayments).map(([year, amt]) => (
                        <div key={year} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--color-secondary)' }}>{year}</span>
                          <strong style={{ color: 'var(--color-primary)' }}>₹{amt.toLocaleString()}</strong>
                        </div>
                      )) : <span style={{ fontStyle: 'italic', color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data available</span>}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Payments Table */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>Payments History</h3>

                  {/* Status Filter */}
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="form-input-text"
                    style={{ width: '150px', margin: 0, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--color-primary)', borderRadius: '4px' }}
                  >
                    <option value="all">All Payments</option>
                    <option value="Confirmed">Confirmed Only</option>
                    <option value="Delivered">Delivered Only</option>
                  </select>

                  {/* Aggregation Breakdown Filter */}
                  <select
                    value={aggregationFilter}
                    onChange={(e) => setAggregationFilter(e.target.value)}
                    className="form-input-text"
                    style={{ width: '170px', margin: 0, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--color-primary)', borderRadius: '4px' }}
                  >
                    <option value="all">All Breakdowns</option>
                    <option value="day">Day-Wise Only</option>
                    <option value="month">Month-Wise Only</option>
                    <option value="year">Year-Wise Only</option>
                    <option value="none">Hide Breakdowns</option>
                  </select>
                </div>

                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={exportToExcel} style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-file-excel" style={{ color: '#4caf50' }}></i> Export Excel
                  </button>
                  <button className="btn btn-secondary" onClick={exportToWord} style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-file-word" style={{ color: '#2196f3' }}></i> Export Word
                  </button>
                  <button className="btn btn-secondary" onClick={exportToPDF} style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-file-pdf" style={{ color: '#f44336' }}></i> Export PDF
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-muted)' }}>
                      <th style={{ padding: '10px' }}>Payment ID</th>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Buyer Name</th>
                      <th style={{ padding: '10px' }}>Phone</th>
                      <th style={{ padding: '10px' }}>Division</th>
                      <th style={{ padding: '10px' }}>Items</th>
                      <th style={{ padding: '10px' }}>Amount</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaymentsList.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{p.id}</td>
                        <td style={{ padding: '10px', fontSize: '0.85rem' }}>{new Date(p.date).toLocaleString()}</td>
                        <td style={{ padding: '10px' }}>{p.buyerName}</td>
                        <td style={{ padding: '10px' }}>{p.phone}</td>
                        <td style={{ padding: '10px' }}>{p.division}</td>
                        <td style={{ padding: '10px' }}>{p.totals.itemCount}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{p.totals.grandTotal.toLocaleString()}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: p.status === 'Confirmed' ? '#2196f3' : '#4caf50',
                            color: '#fff'
                          }}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredPaymentsList.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                          No payment history found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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

      {showCancelModal && (
        <div className="modal-overlay active" style={{ zIndex: 2000 }}>
          <div className="modal-box glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '2rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Cancel Order</h3>
            </div>
            <form onSubmit={handleConfirmCancel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Reason for Cancellation (Required)</label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="form-input-text"
                  rows="4"
                  placeholder="Please specify why this order is being cancelled..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCancelModal(false); setCancellingOrder(null); setCancelReason(''); }} style={{ flex: 1 }}>Close</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#f44336', borderColor: '#f44336' }}>Confirm Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
