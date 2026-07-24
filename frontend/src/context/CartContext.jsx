import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(null);

const FITTING_FEE = 250;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showToast } = useToast();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addToCart = useCallback(
    (product, quantity = 1, { silent = false } = {}) => {
      setCart((prev) => {
        const productDetails = product.details || product.desc;
        const existing = prev.find((item) => item.id === product.id && !item.isCustom && item.details === productDetails);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id && !item.isCustom && item.details === productDetails
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity,
            isCustom: false,
            details: productDetails
          }
        ];
      });
      if (!silent) {
        showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}${product.name} to Cart`, 'success');
      }
    },
    [showToast]
  );

  const addCustomPackage = useCallback(
    (packageItem) => {
      setCart((prev) => [
        ...prev,
        {
          id: `custom-${packageItem.division}-${Date.now()}`,
          name: packageItem.name,
          price: packageItem.price,
          image: packageItem.image,
          quantity: 1,
          isCustom: true,
          details: packageItem.details
        }
      ]);
      openDrawer();
      showToast('Customized Uniform Package Added!', 'success');
    },
    [openDrawer, showToast]
  );

  const changeQuantity = useCallback((id, delta) => {
    setCart((prev) => {
      const next = prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0);
      return next;
    });
  }, []);

  const removeFromCart = useCallback(
    (id) => {
      setCart((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item) showToast(`Removed ${item.name}`, 'info');
        return prev.filter((i) => i.id !== id);
      });
    },
    [showToast]
  );

  const removeSelectedItems = useCallback((itemIds) => {
    const idSet = new Set(itemIds);
    setCart((prev) => prev.filter((i) => !idSet.has(i.id)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const hasCustom = cart.some((i) => i.isCustom);
    const fittingFee = hasCustom ? FITTING_FEE : 0;
    return {
      subtotal,
      fittingFee,
      grandTotal: subtotal + fittingFee,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart]);

  const value = {
    cart,
    drawerOpen,
    openDrawer,
    closeDrawer,
    addToCart,
    addCustomPackage,
    changeQuantity,
    removeFromCart,
    removeSelectedItems,
    clearCart,
    totals
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
