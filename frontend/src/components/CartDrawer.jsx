import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import CheckoutModal from './CheckoutModal.jsx';
import { getImageUrl } from '../api/client.js';

export default function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, changeQuantity, removeFromCart, totals } = useCart();
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // selectedIds: set of item IDs that are checked. Default: all selected.
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Returns true if an item is selected (default: all selected if set is empty = nothing explicitly deselected)
  const isSelected = (item) => {
    // We track deselected items instead — simpler: track selected explicitly
    return selectedIds.has(item.id) || selectedIds.size === 0;
  };

  // Sync selectedIds when cart changes (new items auto-selected)
  // We use a "selectedMap" approach: all items selected by default
  const [explicitSelections, setExplicitSelections] = useState(null); // null = all selected

  const toggleItem = (itemId) => {
    setExplicitSelections(prev => {
      const allIds = new Set(cart.map(i => i.id));
      // If null, all are selected — clicking one deselects it
      const current = prev ?? allIds;
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = new Set(cart.map(i => i.id));
    setExplicitSelections(prev => {
      const current = prev ?? allIds;
      if (current.size === cart.length) {
        // All selected → deselect all
        return new Set();
      }
      return new Set(allIds);
    });
  };

  const itemIsSelected = (itemId) => {
    if (explicitSelections === null) return true; // all selected by default
    return explicitSelections.has(itemId);
  };

  const allSelected = explicitSelections === null || explicitSelections.size === cart.length;
  const someSelected = !allSelected && (explicitSelections?.size ?? 0) > 0;

  const FITTING_FEE = 250;

  const selectedTotals = useMemo(() => {
    const selectedItems = cart.filter(i => itemIsSelected(i.id));
    const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const hasCustom = selectedItems.some(i => i.isCustom);
    const fittingFee = hasCustom ? FITTING_FEE : 0;
    return {
      subtotal,
      fittingFee,
      grandTotal: subtotal + fittingFee,
      itemCount: selectedItems.reduce((sum, i) => sum + i.quantity, 0),
      count: selectedItems.length
    };
  }, [cart, explicitSelections]);

  const handleCheckout = () => {
    if (selectedTotals.count === 0) return;
    if (!user) {
      closeDrawer();
      navigate('/login', { state: { from: location } });
      return;
    }
    setCheckoutOpen(true);
  };

  return (
    <>
      <div
        className={`drawer-backdrop${drawerOpen ? ' active' : ''}`}
        id="drawerBackdrop"
        onClick={closeDrawer}
      ></div>

      <div className={`cart-drawer${drawerOpen ? ' active' : ''}`} id="cartDrawer">
        <div className="cart-header">
          <h3 className="cart-title">
            <i className="fa-solid fa-cart-flatbed-suitcases" style={{ color: 'var(--accent-gold)', marginRight: 8 }}></i>
            Tactical Cart
          </h3>
          <div className="cart-close-btn" id="cartClose" onClick={closeDrawer}>
            <i className="fa-solid fa-xmark"></i>
          </div>
        </div>

        {cart.length > 0 && (
          <div style={{ padding: '0.5rem 1.2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-muted)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleAll}
                style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
              Select All ({cart.length} item{cart.length !== 1 ? 's' : ''})
            </label>
            {!allSelected && (explicitSelections?.size ?? 0) > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                {explicitSelections.size} selected
              </span>
            )}
          </div>
        )}

        <div className="cart-items-container" id="cartItems">
          {cart.length === 0 ? (
            <div className="cart-empty-message">
              <i className="fa-solid fa-box-open"></i>
              <p>Your cart is empty.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                Build a custom uniform above or browse the product catalog.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const selected = itemIsSelected(item.id);
              return (
                <div
                  className="cart-item"
                  key={item.id}
                  style={{ opacity: selected ? 1 : 0.45, transition: 'opacity 0.2s' }}
                >
                  {/* Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '0.5rem', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleItem(item.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                    />
                  </label>

                  <img src={getImageUrl(item.image)} alt={item.name} className="cart-drawer-image cart-item-image" />
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-item-details">{item.details}</p>
                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button className="quantity-btn" onClick={() => changeQuantity(item.id, -1)}>
                          <i className="fa-solid fa-minus"></i>
                        </button>
                        <span className="quantity-val">{item.quantity}</span>
                        <button className="quantity-btn" onClick={() => changeQuantity(item.id, 1)}>
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div className="cart-item-remove" onClick={() => removeFromCart(item.id)} title="Remove Item">
                      <i className="fa-solid fa-trash-can"></i>
                    </div>
                    <div className="cart-item-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-totals">
            {cart.length > 0 && selectedTotals.count < cart.reduce((s, i) => s + i.quantity, 0) && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
                Showing total for {explicitSelections?.size ?? cart.length} selected item{(explicitSelections?.size ?? cart.length) !== 1 ? 's' : ''}
              </div>
            )}
            <div className="cart-total-row">
              <span>Items Total</span>
              <span id="cartItemsTotal">₹{selectedTotals.subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-total-row">
              <span>Estimated Fitting fee</span>
              <span id="cartFittingFee">₹{selectedTotals.fittingFee.toLocaleString()}</span>
            </div>
            <div className="cart-total-row grand-total">
              <span>Grand Total</span>
              <span id="cartGrandTotal">₹{selectedTotals.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            id="checkoutBtn"
            style={{ width: '100%', opacity: selectedTotals.count === 0 ? 0.5 : 1 }}
            onClick={handleCheckout}
            disabled={selectedTotals.count === 0}
          >
            <i className="fa-solid fa-cash-register" style={{ marginRight: 8 }}></i>
            {selectedTotals.count === 0 
              ? 'Select items to checkout' 
              : !user 
                ? 'Sign In to Checkout' 
                : `Checkout (${explicitSelections?.size ?? cart.length} item${(explicitSelections?.size ?? cart.length) !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        selectedItems={cart.filter(i => itemIsSelected(i.id))}
        selectedTotals={selectedTotals}
      />
    </>
  );
}
