import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useOrders } from '../context/OrdersContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { checkoutOrder } from '../api/orders.js';

export default function CheckoutModal({ open, onClose, selectedItems, selectedTotals }) {
  const { removeSelectedItems, closeDrawer } = useCart();
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  // Fall back to full cart/totals if no selection passed
  const itemsToOrder = selectedItems || [];
  const totalsToUse = selectedTotals || { subtotal: 0, fittingFee: 0, grandTotal: 0, itemCount: 0 };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('ncc_army');
  const [regimentId, setRegimentId] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [battalion, setBattalion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Sync form fields from user profile every time the modal opens
  useEffect(() => {
    if (open && user) {
      setName(user.name || '');
      setPhone(user.phone?.replace(/\D/g, '').slice(0, 10) || '');
      setInstituteName(user.institute_name || '');
      setBattalion(user.battalion || '');
      setSuccess(false);
      setRegimentId('');
    }
  }, [open, user]);

  if (!open) return null;

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleClose = () => {
    onClose();
    if (success) {
      closeDrawer();
      navigate('/');
    }
    setTimeout(() => {
      setSuccess(false);
      // Reset fields when closing
      setPhone(user?.phone?.replace(/\D/g, '').slice(0, 10) || '');
      setName(user?.name || '');
      setInstituteName(user?.institute_name || '');
      setBattalion(user?.battalion || '');
      setRegimentId('');
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!instituteName.trim()) {
      alert('Please enter your Institute Name.');
      return;
    }

    if (!user) {
      alert("You must be logged in to checkout.");
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = itemsToOrder.map((item) => ({
        product_id: item.id && !item.id.startsWith('custom-') ? item.id : null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        is_custom: !!item.isCustom,
        details: item.details || null
      }));

      const payload = {
        full_name: name,
        phone: phone,
        division: division,
        regiment_id: regimentId,
        institute_name: instituteName,
        battalion: battalion || null,
        items: itemsPayload
      };

      const backendOrder = await checkoutOrder(payload);

      const formattedOrder = {
        id: backendOrder.order_number || backendOrder.id,
        backendId: backendOrder.id,
        date: backendOrder.created_at || new Date().toISOString(),
        buyerName: backendOrder.full_name,
        phone: backendOrder.phone,
        division: backendOrder.division,
        regimentId: backendOrder.regiment_id,
        items: backendOrder.items.map((i) => ({
          id: i.product_id || i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          isCustom: i.is_custom,
          details: i.details
        })),
        totals: {
          subtotal: backendOrder.subtotal,
          fittingFee: backendOrder.fitting_fee,
          grandTotal: backendOrder.grand_total,
          itemCount: backendOrder.items.reduce((sum, item) => sum + item.quantity, 0)
        },
        status: backendOrder.status === 'pending' ? 'Pending' : backendOrder.status === 'confirmed' ? 'Confirmed' : backendOrder.status === 'delivered' ? 'Delivered' : 'Pending'
      };

      addOrder(formattedOrder);
      setOrderId(backendOrder.order_number || backendOrder.id);
      setSuccess(true);

      // Remove ONLY ordered items from cart, leaving un-checked items in cart
      const orderedIds = itemsToOrder.map((i) => i.id);
      removeSelectedItems(orderedIds);

      // Trigger notifications for BOTH User and Admin
      if (user?.id) {
        addNotification(user.id, `Order #${formattedOrder.id} placed successfully! Fitting appointment in 3 days.`);
      }
      addNotification('admin', `New order received: #${formattedOrder.id} from ${name} (₹${formattedOrder.totals.grandTotal.toLocaleString()}).`, { forAdmin: true });
    } catch (error) {
      console.error('Checkout failed:', error);
      const msg = error.response?.data?.detail || 'Checkout failed. Please try again.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active" id="checkoutModal">
      <div className="modal-box glass-panel">
        <div className="modal-close" onClick={handleClose}>
          <i className="fa-solid fa-xmark"></i>
        </div>

        {!success ? (
          <div id="checkoutFormContent">
            {!user ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <i className="fa-solid fa-user-lock" style={{ fontSize: '3rem', color: 'var(--accent-gold)', marginBottom: '1.5rem' }}></i>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>Authentication Required</h3>
                <p style={{ color: 'var(--color-muted)', margin: '0.75rem 0 1.75rem', fontSize: '0.9rem' }}>
                  You need to be logged in to place an order and book fittings.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Link to="/login" onClick={handleClose} className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.85rem' }}>Sign In</Link>
                  <Link to="/register" onClick={handleClose} className="btn btn-secondary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.85rem' }}>Create Account</Link>
                </div>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3>Checkout Order Info</h3>
                  <p>Please enter your service details or cadet affiliation to verify specification adherence.</p>
                </div>

                <form id="checkoutForm" onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input-text" required placeholder="E.g. Cadet Rahul Sen" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    id="checkoutPhone"
                    className="form-input-text"
                    required
                    placeholder="E.g. 9876543210"
                    value={phone}
                    onChange={handlePhoneChange}
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit mobile number"
                    maxLength={10}
                  />
                  {phone.length > 0 && phone.length < 10 && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#ff9800' }}>
                      {10 - phone.length} more digit{10 - phone.length !== 1 ? 's' : ''} needed
                    </p>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Division / Wing</label>
                  <select className="form-input-text" required style={{ backgroundColor: 'var(--bg-primary)' }} value={division} onChange={e => setDivision(e.target.value)}>
                    <option value="ncc_army">NCC - Army Wing</option>
                    <option value="ncc_navy">NCC - Navy Wing</option>
                    <option value="ncc_air">NCC - Air Wing</option>
                    <option value="army_active">Indian Army - Active Duty</option>
                    <option value="army_officer">Indian Army - Officer / JCO</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Institute Name</label>
                  <input type="text" className="form-input-text" required placeholder="E.g. Andhra University" value={instituteName} onChange={e => setInstituteName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Battalion <span>(optional)</span></label>
                  <input type="text" className="form-input-text" placeholder="E.g. 2 Delhi Bn NCC" value={battalion} onChange={e => setBattalion(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Regiment / Institution ID or Cadet Regt No.</label>
                <input type="text" className="form-input-text" required placeholder="E.g. KA/SD/26/12345 or Service ID" value={regimentId} onChange={e => setRegimentId(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Processing Fitting Request...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i> Place Order & Book Fitting
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    ) : (
          <div id="checkoutSuccessContent" style={{ textAlign: 'center', position: 'relative' }}>
            {/* X close button on success screen */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute', top: 0, right: 0,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid var(--glass-border)',
                color: 'var(--color-muted)',
                width: 30, height: 30,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem'
              }}
              title="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="success-icon-wrap">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Order Submitted!</h3>
            <p style={{ color: 'var(--color-secondary)', marginBottom: '1.5rem' }}>
              Your order has been recorded successfully. An SMS summary with booking schedule ID and
              uniform specifications receipt has been sent to your mobile.
            </p>
            <div
              className="glass-panel"
              style={{ padding: '1rem', marginBottom: '2rem', background: 'var(--bg-primary)', textAlign: 'left', fontSize: '0.85rem' }}
            >
              <div style={{ marginBottom: 5 }}>
                <strong>Order ID:</strong> <span id="successOrderId" style={{ color: 'var(--accent-gold)' }}>{orderId}</span>
              </div>
              <div>
                <strong>Fitting Appointment:</strong> 3 Days from today at Delhi Cantt Outlet.
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handleClose} style={{ width: '100%' }}>
              Return to Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
