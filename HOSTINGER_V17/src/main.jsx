import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
console.log('%c🚀 FOODRIDERS BOOT: v1.0.4 - [FCR-003]', 'color: #ed1c24; font-weight: bold; font-size: 14px;');

import { CartProvider, useCart } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { SocketProvider } from './context/SocketContext'

import LoadingScreen from './LoadingScreen.jsx'


const App = lazy(() => import('./App.jsx'))
const Cart = lazy(() => import('./components/Cart.jsx'))
const Login = lazy(() => import('./components/Auth/Login.jsx'))
const Signup = lazy(() => import('./components/Auth/Signup.jsx'))

const RestaurantPage = lazy(() => import('./pages/RestaurantPage.jsx'))
const GetTheApp = lazy(() => import('./pages/GetTheApp.jsx'))
const ErrorPage = lazy(() => import('./pages/ErrorPage.jsx'))
const TestPage = lazy(() => import('./pages/TestPage.jsx'))
const StoreClosed = lazy(() => import('./pages/StoreClosed.jsx'))
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin.jsx'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard.jsx'))
const AdminRestaurants = lazy(() => import('./pages/Admin/AdminRestaurants.jsx'))
const AdminRestaurantManage = lazy(() => import('./pages/Admin/AdminRestaurantManage.jsx'))
const AdminOrders = lazy(() => import('./pages/Admin/AdminOrders.jsx'))
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers.jsx'))
const AdminDeliveryPartners = lazy(() => import('./pages/Admin/AdminDeliveryPartners.jsx'))
const AdminDeliverySettings = lazy(() => import('./pages/Admin/AdminDeliverySettings.jsx'))
const AdminOrderHistory = lazy(() => import('./pages/Admin/AdminOrderHistory'));
const AdminBillingSettings = lazy(() => import('./pages/Admin/AdminBillingSettings'));
const AdminPaymentSettings = lazy(() => import('./pages/Admin/AdminPaymentSettings'));
const AdminAnnouncements = lazy(() => import('./pages/Admin/AdminAnnouncements'))
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'))
const AdminCarouselManager = lazy(() => import('./pages/Admin/AdminCarouselManager.jsx'))
const AdminCategoryGroups = lazy(() => import('./pages/Admin/AdminCategoryGroups.jsx'))
const AdminHomeDelivery = lazy(() => import('./pages/Admin/AdminHomeDelivery.jsx'))
const AdminPopupManager = lazy(() => import('./pages/Admin/AdminPopupManager'))
const AdminMarketingHub = lazy(() => import('./pages/Admin/AdminReferralCouponHub'))
const AdminReferrals = lazy(() => import('./pages/Admin/AdminReferrals.jsx'))
const AdminReferralAnalytics = lazy(() => import('./pages/Admin/AdminReferralAnalytics'))
const AdminCoupons = lazy(() => import('./pages/Admin/AdminCoupons'))
const AdminCouponAnalytics = lazy(() => import('./pages/Admin/AdminCouponAnalytics'))
const ReferAndEarn = lazy(() => import('./pages/ReferAndEarn.jsx'))
const WalletPage = lazy(() => import('./pages/Wallet/WalletPage'))
const OrderTracking = lazy(() => import('./pages/OrderTracking.jsx'))
const PaymentPage = lazy(() => import('./pages/Payment/PaymentPage.jsx'))
const DeliveryLogin = lazy(() => import('./pages/DeliveryPartner/DeliveryLogin'))
const DeliveryDashboard = lazy(() => import('./pages/DeliveryPartner/DeliveryDashboard.jsx'))
const DeliveryProtectedRoute = lazy(() => import('./components/Common/DeliveryProtectedRoute.jsx'))
const SuperDashboard = lazy(() => import('./pages/SuperAdmin/SuperDashboard'))
// App imported statically for faster LCP
const TestOTP = lazy(() => import('./pages/TestOTP'))
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation.jsx'))
// Cart, Login, Signup static
const ProtectedRoute = lazy(() => import('./components/Common/ProtectedRoute.jsx'))
const InfoPage = lazy(() => import('./pages/Info/InfoPage'))
const ShowcasePage = lazy(() => import('./pages/ShowcasePage.jsx'))
import ConfirmModal from './utils/RestaurantUtils/ConfirmModal.jsx'

import './index.css'
import FloatingThemeToggle from './components/Common/FloatingThemeToggle.jsx'
import PersistentOrderTracker from './components/Common/PersistentOrderTracker.jsx'
import GlobalUserNotifications from './components/Common/GlobalUserNotifications.jsx'
import GlobalAdminNotifications from './components/Common/GlobalAdminNotifications.jsx'
import GlobalDeliveryNotifications from './components/Common/GlobalDeliveryNotifications.jsx'



// Create root with strict mode
const root = ReactDOM.createRoot(document.getElementById('root'));

const StoreGuard = ({ children }) => {
  const [isStoreOpen, setIsStoreOpen] = React.useState(true); // Default open to prevent blocking
  const [isCheckComplete, setIsCheckComplete] = React.useState(false);

  React.useEffect(() => {
    // Bypasses for special routes
    const path = window.location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/delivery')) {
      setIsCheckComplete(true);
      return;
    }

    // In production, use relative URL (served from same origin). In dev, use proxy or localhost.
    const storeUrl = import.meta.env.MODE === 'production' ? '/api/store' : 'http://127.0.0.1:5000/api/store';

    console.log('[StoreGuard] Checking store status at:', storeUrl);

    const controller = new AbortController();
    const timeout_ms = 5000; // 5 seconds constraint
    const timeoutId = setTimeout(() => {
      console.warn('[StoreGuard] Timeout - forcing open');
      controller.abort();
      setIsCheckComplete(true);
    }, timeout_ms);

    fetch(storeUrl, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        clearTimeout(timeoutId);
        console.log('[StoreGuard] Status:', data);
        setIsStoreOpen(data.isOpen);
        setIsCheckComplete(true);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name !== 'AbortError') console.error('[StoreGuard] Failed:', err);
        // Fail-safe: assume open
        setIsCheckComplete(true);
      });

    return () => clearTimeout(timeoutId);
  }, []);

  const path = window.location.pathname;
  const isSpecialRoute = path.startsWith('/admin') || path.startsWith('/delivery');

  // Only block if explicitly closed AND check completed successfully
  if (!isStoreOpen && isCheckComplete && !isSpecialRoute) {
    return <StoreClosed />;
  }

  // Render children immediately (concurrently with check) or after check
  return children;
};

const GlobalModals = () => {
  const auth = useAuth() || {};
  const authModal = auth.authModal || { login: false, signup: false };

  const cart = useCart() || {};
  const collisionModal = cart.collisionModal || { isOpen: false };
  const { closeCollisionModal, handleCollisionConfirm } = cart;

  return (
    <>
      {authModal.login && <Login />}
      {authModal.signup && <Signup />}
      <ConfirmModal
        isOpen={collisionModal.isOpen}
        onCancel={closeCollisionModal}
        onConfirm={handleCollisionConfirm}
        message="Your cart contains items from another restaurant. Do you want to clear the cart and add items from this restaurant?"
      />
    </>
  );
};

// Redirect Setup for /signup links
const SignupRedirect = () => {
  const { triggerAuth } = useAuth();
  React.useEffect(() => {
    triggerAuth(null, "Enter Mobile & Code to Claim ₹20! 🎁");
  }, []);
  return <Navigate to={`/${window.location.search}`} replace />;
};

import { HelmetProvider } from 'react-helmet-async';

// Admin Route Guard - redirects to HOME if no admin token
const AdminProtectedRoute = ({ children }) => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return <Navigate to="/" replace />;
    }
    return children;
  } catch (e) {
    console.warn("Storage access failed in guard:", e);
    return <Navigate to="/" replace />;
  }
};

// Super Admin Route Guard
const SuperAdminProtectedRoute = ({ children }) => {
  try {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole');
    if (!token || role !== 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    return children;
  } catch (e) {
    return <Navigate to="/admin" replace />;
  }
};

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CRITICAL UI ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.stack || this.state.error?.toString() || 'Unspecified runtime error';

      // AUTO-RECOVERY LOGIC for "Failed to fetch dynamically imported module"
      // This happens after a new deployment when the user's browser has old chunk names cached.
      if (errorMsg.includes('Failed to fetch dynamically imported module') || errorMsg.includes('Loading chunk')) {
        const lastReload = sessionStorage.getItem('last-chunk-reload');
        const now = Date.now();
        // Only auto-reload if we haven't reloaded in the last 10 seconds (prevents infinite loops)
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem('last-chunk-reload', now.toString());
          setTimeout(() => window.location.reload(), 500);
          return (
            <div style={{ padding: '20px', textAlign: 'center', marginTop: '100px' }}>
              <div className="loading-spinner"></div>
              <p>Updating application to latest version...</p>
            </div>
          );
        }
      }

      return (
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', backgroundColor: '#fff' }}>
          <img src="/Logo-Img.png" alt="FoodRiders" style={{ height: '60px', marginBottom: '20px' }} />
          <h2 style={{ color: '#ff4d4f', margin: '0 0 10px 0' }}>Oops! Something went wrong.</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>This usually happens due to a connection glitch or old browser cache. Please try the steps below:</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '30px' }}>
            <button
              onClick={() => {
                sessionStorage.removeItem('last-chunk-reload');
                window.location.reload();
              }}
              style={{ width: '200px', padding: '12px', backgroundColor: '#fc8019', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{ width: '200px', padding: '12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🏠 Go to Home
            </button>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', maxWidth: '100%', textAlign: 'left', overflow: 'hidden' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#666', fontSize: '12px' }}>Technical details for support:</p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <code style={{ display: 'block', whiteSpace: 'pre-wrap', fontSize: '11px', wordBreak: 'break-all', color: '#cf1322' }}>
                {errorMsg}
              </code>
            </div>
          </div>
          <p style={{ fontSize: '10px', color: '#999', marginTop: '20px' }}>
            Build: v1.0.4-R | Device: {navigator.userAgent.substring(0, 50)}...
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <ToastProvider>
            <SocketProvider>
              <AuthProvider>
                <CartProvider>
                  <BrowserRouter>
                    <StoreGuard>
                      <Suspense fallback={<LoadingScreen />}>
                        <Routes>
                          <Route path="/" element={<App />} />
                          <Route path="/get-the-app" element={<GetTheApp />} />
                          <Route path="/signup" element={<SignupRedirect />} />
                          <Route path="/test-otp" element={<TestOTP />} />
                          {/* Admin routes */}
                          <Route path="/admin" element={<AdminLogin />} />
                          <Route path="/super" element={<Navigate to="/super/dashboard" replace />} />
                          <Route path="/super/dashboard" element={<SuperAdminProtectedRoute><SuperDashboard /></SuperAdminProtectedRoute>} />
                          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                          <Route path="/admin/restaurants" element={<AdminProtectedRoute><AdminRestaurants /></AdminProtectedRoute>} />
                          <Route path="/admin/restaurants/:id/manage" element={<AdminProtectedRoute><AdminRestaurantManage /></AdminProtectedRoute>} />
                          <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrders /></AdminProtectedRoute>} />
                          <Route path="/admin/orders/history" element={<AdminProtectedRoute><AdminOrderHistory /></AdminProtectedRoute>} />
                          <Route path="/admin/orders/:orderId" element={<AdminProtectedRoute><AdminOrders /></AdminProtectedRoute>} />
                          <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
                          <Route path="/admin/delivery-partners" element={<AdminProtectedRoute><AdminDeliveryPartners /></AdminProtectedRoute>} />
                          <Route path="/admin/delivery-settings" element={<Navigate to="/admin/billing-settings" replace />} />
                          <Route path="/admin/payment-settings" element={<AdminProtectedRoute><AdminPaymentSettings /></AdminProtectedRoute>} />
                          <Route path="/admin/billing-settings" element={<AdminProtectedRoute><AdminBillingSettings /></AdminProtectedRoute>} />
                          <Route path="/admin/extra-charges" element={<Navigate to="/admin/billing-settings" replace />} />
                          <Route path="/admin/announcements" element={<AdminProtectedRoute><AdminAnnouncements /></AdminProtectedRoute>} />
                          <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReports /></AdminProtectedRoute>} />
                          <Route path="/admin/carousel" element={<AdminProtectedRoute><AdminCarouselManager /></AdminProtectedRoute>} />
                          <Route path="/admin/category-groups" element={<AdminProtectedRoute><AdminCategoryGroups /></AdminProtectedRoute>} />
                          <Route path="/admin/home-delivery" element={<AdminProtectedRoute><AdminHomeDelivery /></AdminProtectedRoute>} />
                          <Route path="/admin/popups" element={<AdminProtectedRoute><AdminPopupManager /></AdminProtectedRoute>} />
                          <Route path="/admin/marketing" element={<AdminProtectedRoute><AdminMarketingHub /></AdminProtectedRoute>} />
                          <Route path="/admin/referrals" element={<Navigate to="/admin/marketing" replace />} />
                          <Route path="/admin/referral-analytics" element={<Navigate to="/admin/marketing" replace />} />
                          <Route path="/admin/coupons" element={<Navigate to="/admin/marketing" replace />} />
                          <Route path="/admin/coupon-analytics" element={<Navigate to="/admin/marketing" replace />} />

                          {/* Delivery Partner Routes */}
                          <Route path="/delivery-login" element={<DeliveryLogin />} />
                          <Route path="/delivery-dashboard" element={
                            <DeliveryProtectedRoute>
                              <DeliveryDashboard />
                            </DeliveryProtectedRoute>
                          } />

                          {/* Checkout & Order Routes */}
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/order-confirmation" element={<OrderConfirmation />} />
                          <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
                          <Route path="/payment/upi" element={<PaymentPage />} />
                          <Route path="/payment" element={<PaymentPage />} />

                          {/* User Profile & Features */}
                          <Route path="/refer-and-earn" element={<ReferAndEarn />} />
                          <Route path="/wallet" element={<WalletPage />} />
                          <Route path="/info" element={<InfoPage />} />

                          {/* Legacy/Fallback Routes */}
                          <Route path="/track-order" element={<OrderTracking />} />

                          {/* Listing & Search Routes */}
                          <Route path="/show-case" element={<ShowcasePage />} />
                          <Route path="/category/:categoryGroup" element={<ShowcasePage />} />
                          <Route path="/offers/:offerId" element={<Navigate to="/" replace />} /> {/* Placeholder */}

                          {/* Generic / Catch-all Routes (MUST BE LAST) */}
                          <Route path="/restaurant/:hotel" element={<RestaurantPage />} />
                          <Route path="/:city/:hotel" element={<RestaurantPage />} />
                          <Route path="/:city/:hotel/:page" element={<RestaurantPage />} />

                          {/* 404 Not Found Page */}
                          <Route path="*" element={<ErrorPage />} />
                        </Routes>
                        <Cart />
                        <PersistentOrderTracker />
                        <GlobalUserNotifications />
                        <GlobalAdminNotifications />
                        <GlobalDeliveryNotifications />
                        <GlobalModals />
                        <FloatingThemeToggle />
                      </Suspense>
                    </StoreGuard>
                  </BrowserRouter>
                </CartProvider>
              </AuthProvider>
            </SocketProvider>
          </ToastProvider>
        </ThemeProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
