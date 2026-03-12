import { createContext, useContext, useState, useEffect } from 'react';
import { deliveryCharges } from '../helpers/constants';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Cart recovery failed:", e);
      return [];
    }
  });
  const [activeRestaurantName, setActiveRestaurantName] = useState(() => {
    try {
      return localStorage.getItem('activeRestaurantName') || null;
    } catch (e) {
      return null;
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [collisionModal, setCollisionModal] = useState({ isOpen: false, pendingItem: null });

  /* Billing Settings */
  const [billingSettings, setBillingSettings] = useState(null);
  const [extraCharges, setExtraCharges] = useState([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchAllSettings = () => {
    // Delivery Settings (Slabs)
    fetch('/api/delivery-settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setDeliverySettings(data);
      })
      .catch(err => console.error('Delivery settings fetch failed:', err));

    // Payment/Billing Settings
    fetch('/api/payment-settings', { headers: { 'Cache-Control': 'no-cache' } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setBillingSettings(data);
      })
      .catch(err => console.error('Billing settings fetch failed:', err));

    // Smart Extra Charges
    fetch('/api/admin/extra-charges/active', { headers: { 'Cache-Control': 'no-cache' } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        console.log('[CartContext] Extra Charges data:', data);
        if (data && data.systemEnabled) {
          setExtraCharges(data.charges || []);
        } else {
          setExtraCharges([]);
        }
        setSettingsLoaded(true);
      })
      .catch(err => {
        console.error('Extra charges fetch failed:', err);
        setSettingsLoaded(true);
      });
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const showCollisionModal = (item) => {
    setCollisionModal({ isOpen: true, pendingItem: item });
  }

  const closeCollisionModal = () => {
    setDeliveryDistance(0);
    setCollisionModal({ isOpen: false, pendingItem: null });
  }

  const handleCollisionConfirm = () => {
    if (collisionModal.pendingItem) {
      clearCart();
      addToCart(collisionModal.pendingItem);
      setIsCartOpen(true);
    }
    closeCollisionModal();
  }

  // Central persistence for cart data
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('activeRestaurantName', activeRestaurantName || '');
  }, [cartItems, activeRestaurantName]);

  const addToCart = (item) => {
    if (cartItems.length === 0) {
      setActiveRestaurantName(item.restaurant);
    }
    else if (activeRestaurantName && activeRestaurantName !== item.restaurant) {
      throw new Error('Mixed restaurants');
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const bulkAddToCart = (items, restaurantName) => {
    if (!restaurantName || !items || items.length === 0) return;

    // Use a single functional update for items to avoid race conditions with clearCart()
    setCartItems((prevItems) => {
      // AUTHORITATIVE CHECK: Is this reorder from a different restaurant?
      // Use the internal state of prevItems to determine the current cart's restaurant
      const currentRest = prevItems.length > 0 ? (prevItems[0].restaurant) : null;

      let nextCart = [];
      if (currentRest && currentRest !== restaurantName) {
        // Different restaurant? Start fresh (Clear Cart Logic)
        nextCart = [];
      } else {
        // Same restaurant or empty cart? Append/Merge
        nextCart = [...prevItems];
      }

      // Merge new items into nextCart
      items.forEach(newItem => {
        const id = newItem.id || newItem._id;
        const existingIdx = nextCart.findIndex(i => (i.id || i._id) === id);
        if (existingIdx > -1) {
          // Update quantity (add past quantity or default 1)
          nextCart[existingIdx] = {
            ...nextCart[existingIdx],
            quantity: nextCart[existingIdx].quantity + (newItem.quantity || 1)
          };
        } else {
          // Add new item
          nextCart.push({
            ...newItem,
            id,
            restaurant: restaurantName,
            quantity: newItem.quantity || 1,
            image: newItem.image || newItem.img || '/images/food-placeholder.png'
          });
        }
      });
      return nextCart;
    });

    // Update restaurant name and open cart
    setActiveRestaurantName(restaurantName);
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== id);
      if (newItems.length === 0) {
        setActiveRestaurantName(null);
        localStorage.removeItem('activeRestaurantName');
      }
      return newItems;
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setActiveRestaurantName(null);
    setDeliveryDistance(0);
    localStorage.removeItem('cartItems');
    localStorage.removeItem('activeRestaurantName');
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // --- Dynamic Fee Calculators ---
  const getPackagingCharge = () => {
    if (!billingSettings || !billingSettings.packagingFee) return 2; // Fallback
    const { mode, fixedAmount, per100Amount } = billingSettings.packagingFee;

    if (mode === 'fixed') {
      return fixedAmount || 0;
    } else if (mode === 'per100') {
      const subtotal = getSubtotal();
      return Math.floor(subtotal / 100) * (per100Amount || 0);
    }
    return 0;
  };

  const getPlatformFee = () => {
    if (!billingSettings) return 3; // Fallback
    return billingSettings.platformFee.enabled ? billingSettings.platformFee.amount : 0;
  };

  const getCustomCharges = () => {
    if (!billingSettings || !billingSettings.customCharges) return [];
    return billingSettings.customCharges.filter(c => c.enabled);
  };

  const getCustomChargesTotal = () => {
    const charges = getCustomCharges();
    return charges.reduce((sum, c) => sum + c.amount, 0);
  };

  const getExtraCharges = () => {
    return extraCharges || [];
  };

  const getExtraChargesTotal = () => {
    const activeCharges = getExtraCharges();
    const subtotal = getSubtotal();
    const delivery = getDeliveryCharge();

    return activeCharges.reduce((sum, charge) => {
      if (charge.type === 'fixed') {
        return sum + charge.amount;
      } else if (charge.type === 'percentage') {
        // Respect 'applyTo' field. Default is 'delivery' if not specified.
        const base = charge.applyTo === 'all' ? subtotal : delivery;
        return sum + (base * (charge.amount / 100));
      }
      return sum;
    }, 0);
  };

  const getDeliveryCharge = (user = null) => {
    // Free delivery rules
    if (billingSettings?.freeDelivery) {
      if (user && (user.totalOrders || 0) === 0 && billingSettings.freeDelivery.firstOrderFree) {
        return 0; // First order free
      }
      const subtotal = getSubtotal();
      if (billingSettings.freeDelivery.minOrderValue > 0 && subtotal >= billingSettings.freeDelivery.minOrderValue) {
        return 0; // Free delivery above threshold
      }
    }

    // Admin Billing Settings
    if (billingSettings?.deliveryFee) {
      if (billingSettings.deliveryFee.mode === 'flat') {
        return billingSettings.deliveryFee.flatAmount || 30;
      }

      // Slabs mode
      if (billingSettings.deliveryFee.mode === 'slabs' && billingSettings.deliveryFee.slabs?.length > 0) {
        if (!deliveryDistance || deliveryDistance <= 0) return billingSettings.deliveryFee.slabs[0].charge;

        const activeSlab = billingSettings.deliveryFee.slabs.find(s =>
          deliveryDistance >= s.minKm && deliveryDistance <= s.maxKm
        );
        if (activeSlab) return activeSlab.charge;

        // Beyond all slabs - return last slab charge
        const lastSlab = billingSettings.deliveryFee.slabs[billingSettings.deliveryFee.slabs.length - 1];
        return lastSlab.charge;
      }
    }

    // Fallback to old delivery-settings API (if exists)
    if (!deliveryDistance || deliveryDistance <= 0) return 30;
    if (deliverySettings?.slabs) {
      const activeSlab = deliverySettings.slabs.find(s => deliveryDistance <= s.maxKm);
      if (activeSlab) return activeSlab.charge;
      const lastSlab = deliverySettings.slabs[deliverySettings.slabs.length - 1];
      return lastSlab ? lastSlab.charge : 60;
    }

    // Default Fallback
    if (deliveryDistance <= 4) return 30;
    if (deliveryDistance <= 5) return 40;
    if (deliveryDistance <= 6) return 50;
    return 60;
  };

  const getDiscountAmount = (user) => {
    return 0; // Future discount logic
  };

  const getCartTotal = (user = null) => {
    const total = getSubtotal()
      + getDeliveryCharge(user)
      + getPackagingCharge()
      + getPlatformFee()
      + getCustomChargesTotal()
      + getExtraChargesTotal();
    return Math.max(0, Math.round(total));
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const processPayment = async (method) => {
    setPaymentStatus('processing');

    if (method === 'cod') {
      return new Promise((resolve) => {
        setTimeout(() => {
          setPaymentStatus('success');
          resolve({ success: true, message: 'Order placed successfully!' });
        }, 1000);
      });
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.9) {
            setPaymentStatus('success');
            resolve({ success: true, message: 'Payment successful! Order placed.' });
          } else {
            setPaymentStatus('failed');
            reject({ success: false, message: 'Payment failed. Please try again.' });
          }
        }, 1500);
      });
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      bulkAddToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getSubtotal,
      getDeliveryCharge,
      getCartTotal,
      getCartCount,
      processPayment,
      paymentMethod,
      setPaymentMethod,
      paymentStatus,
      activeRestaurantName,
      collisionModal,
      showCollisionModal,
      closeCollisionModal,
      handleCollisionConfirm,
      getPackagingCharge,
      getPlatformFee,
      getCustomCharges,
      deliveryDistance,
      setDeliveryDistance,
      deliverySettings,
      getDiscountAmount,
      billingSettings,
      getExtraCharges,
      getExtraChargesTotal,
      refreshSettings: fetchAllSettings
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 
