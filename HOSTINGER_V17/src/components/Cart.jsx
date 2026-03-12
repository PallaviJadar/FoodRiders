import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { deliveryCharges } from '../helpers/constants';
import MenuImage from '../utils/RestaurantUtils/MenuImage.jsx';
import css from './Cart.module.css';

const Cart = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getDeliveryCharge,
    getCartTotal,
    paymentMethod,
    setPaymentMethod,
    getPlatformFee,
    getPackagingCharge,
    getExtraCharges,
    getExtraChargesTotal,
    billingSettings,
    refreshSettings
  } = useCart();

  const { isLoggedIn, triggerAuth, user } = useAuth();
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [paymentSettings, setPaymentSettings] = useState({ isCodEnabled: true, isUpiEnabled: true, isRazorpayEnabled: true });

  // Fetch payment settings EVERY time cart opens (no caching)
  useEffect(() => {
    if (isCartOpen) {
      refreshSettings();
      fetch('/api/payment-settings', { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            console.log('[Cart] Payment settings from DB:', {
              cod: data.isCodEnabled,
              upi: data.isUpiEnabled,
              razorpay: data.isRazorpayEnabled
            });
            setPaymentSettings(data);

            // Auto-select first available method if current is invalid
            const isCurrentValid =
              (paymentMethod === 'razorpay' && data.isRazorpayEnabled) ||
              (paymentMethod === 'online' && data.isUpiEnabled) ||
              (paymentMethod === 'cod' && data.isCodEnabled);

            if (!isCurrentValid) {
              if (data.isRazorpayEnabled) setPaymentMethod('razorpay');
              else if (data.isUpiEnabled) setPaymentMethod('online');
              else if (data.isCodEnabled) setPaymentMethod('cod');
              else setPaymentMethod('');
            }
          }
        })
        .catch(err => console.error('[Cart] Payment settings fetch failed:', err));
    }
  }, [isCartOpen]);

  const handleOrder = async (authedUser = null) => {
    const activeUser = authedUser || (isLoggedIn ? user : null);

    if (!activeUser) {
      triggerAuth((u) => handleOrder(u));
      return;
    }

    setIsCartOpen(false);
    navigate('/checkout');
  };

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const deliveryCharge = getDeliveryCharge(user);

  return (
    <div className={css.cartOverlay}>
      <div className={css.cartModal}>
        <div className={css.cartHeader}>
          <h2>Your Cart</h2>
          <button
            className={css.closeButton}
            onClick={() => setIsCartOpen(false)}
          >
            ×
          </button>
        </div>

        {cartItems.length > 0 && (
          <div className={css.addMoreItems} onClick={() => setIsCartOpen(false)}>
            <span>+ Add more items</span>
          </div>
        )}

        <div className={css.cartItems}>
          {cartItems.length === 0 ? (
            <p className={css.emptyCart}>Your cart is empty</p>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className={css.cartItem}>
                <div className={css.itemInfo}>
                  <div className={css.cartItemImage}>
                    <MenuImage
                      src={item.image}
                      itemName={item.name}
                      categoryName={item.category}
                      restaurantName={item.restaurant}
                    />
                  </div>
                  <div className={css.itemText}>
                    <h3>{item.name}</h3>
                    <p>₹{item.price}</p>
                  </div>
                </div>
                <div className={css.itemActions}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className={css.quantityButton}
                  >
                    -
                  </button>
                  <span className={css.quantity}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className={css.quantityButton}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className={css.removeButton}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={css.cartFooter}>
            <div className={css.orderSummary}>
              <div className={css.summaryRow}>
                <span>Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>
              {getPlatformFee() > 0 && (
                <div className={css.summaryRow}>
                  <span>Platform Fee:</span>
                  <span>₹{getPlatformFee()}</span>
                </div>
              )}
              {getPackagingCharge() > 0 && (
                <div className={css.summaryRow}>
                  <span>Packaging:</span>
                  <span>₹{getPackagingCharge()}</span>
                </div>
              )}
              <div className={css.summaryRow}>
                <span>Delivery Charge:</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <span className={css.freeDelivery}>FREE</span>
                  ) : (
                    `₹${ deliveryCharge } `
                  )}
                </span>
              </div>
              {getExtraCharges().map(charge => (
                <div key={charge.id} className={css.summaryRow}>
                  <span style={{ color: '#ff4757', fontWeight: 600 }}>{charge.name}:</span>
                  <span style={{ color: '#ff4757', fontWeight: 600 }}>
                    {charge.type === 'fixed'
                      ? `₹${ charge.amount } `
                      : `₹${ Math.round(subtotal * (charge.amount / 100)) } `
                    }
                  </span>
                </div>
              ))}
              {subtotal < (billingSettings?.freeDelivery?.minOrderValue || 500) && (billingSettings?.freeDelivery?.minOrderValue > 0) && (
                <div className={css.freeDeliveryNote}>
                  Add items worth ₹{(billingSettings?.freeDelivery?.minOrderValue || 500) - subtotal} more for free delivery
                </div>
              )}
              <div className={css.summaryRow}>
                <span className={css.total}>Total:</span>
                <span className={css.total}>₹{getCartTotal()}</span>
              </div>

              <div className={css.paymentMethods}>
                <h4>Select Payment Method</h4>
                <div className={css.paymentOptions}>
                  {paymentSettings.isRazorpayEnabled && (
                    <label className={css.paymentOption}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      Online Payment (Razorpay)
                    </label>
                  )}
                  {paymentSettings.isUpiEnabled && (
                    <label className={css.paymentOption}>
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      Manual UPI Payment
                    </label>
                  )}
                  {paymentSettings.isCodEnabled && (
                    <label className={css.paymentOption}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      Cash on Delivery
                    </label>
                  )}
                </div>
                {error && <div className={css.error}>{error}</div>}
              </div>
            </div>
            <button
              className={css.orderButton}
              onClick={handleOrder}
              disabled={isOrdering || !paymentMethod}
            >
              {isOrdering ? 'Processing...' : !paymentMethod ? 'No Payment Method Available' : paymentMethod === 'razorpay' ? 'Pay Online & Order' : paymentMethod === 'online' ? 'Order via UPI' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </div >
  );
};

export default Cart; 
