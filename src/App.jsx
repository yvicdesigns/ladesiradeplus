import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingFallback from './components/LoadingFallback';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ensureAdminSettingsExists } from './lib/adminSettingsSetup';
import { runStartupDiagnostics } from './lib/startupDiagnostics';
import { ConnectionStatusMonitor } from './components/ConnectionStatusMonitor';
import { AIAssistant } from './components/AIAssistant';
import { WhatsAppButton } from './components/WhatsAppButton';
import './i18n/config';

// Lazy load Client pages
const HomePage = lazy(() => import('./pages/HomePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'));
const QRMenuPage = lazy(() => import('./pages/QRMenuPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const DeliveryTrackerPage = lazy(() => import('./pages/DeliveryTrackerPage'));
const PaymentProofPage = lazy(() => import('./pages/PaymentProofPage'));
const MobileMoneyPaymentPage = lazy(() => import('./pages/MobileMoneyPaymentPage'));
const RestaurantOrderTrackingPage = lazy(() => import('./pages/RestaurantOrderTrackingPage'));
const ReservationConfirmationPage = lazy(() => import('./pages/ReservationConfirmationPage'));
const PromoPopupPage = lazy(() => import('./pages/PromoPopupPage'));

// --- NEW ORDERS MODULE PAGES ---
const ModuleOrdersPage = lazy(() => import('./modules/orders/pages/OrdersPage'));
const ModuleOrderDetailPage = lazy(() => import('./modules/orders/pages/OrderDetailPage'));
const ModuleAdminOrdersPage = lazy(() => import('./modules/orders/pages/AdminOrdersPage'));

// Lazy load Admin Pages (Core & Auxiliary)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminMenuPage = lazy(() => import('./pages/AdminMenuPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));

// Core operational pages
const AdminDeliveryOrdersPage = lazy(() => import('./pages/AdminDeliveryOrdersPage'));
const AdminRestaurantOrdersPage = lazy(() => import('./pages/AdminRestaurantOrdersPage'));
const AdminClientsPage = lazy(() => import('./pages/AdminClientsPage'));
const StockManagementPage = lazy(() => import('./pages/StockManagementPage'));
const AdminPromoBannerPage = lazy(() => import('./pages/AdminPromoBannerPage'));

// Secondary operational pages
const AdminTablesPage = lazy(() => import('./pages/AdminTablesPage'));
const AdminReservationsPage = lazy(() => import('./pages/AdminReservationsPage'));
const AdminFeedbackPage = lazy(() => import('./pages/AdminFeedbackPage'));
const AdminCustomRequestsPage = lazy(() => import('./pages/AdminCustomRequestsPage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const AdminHistoryPage = lazy(() => import('./pages/AdminHistoryPage'));
const AdminCalendarPage = lazy(() => import('./pages/AdminCalendarPage'));
const AdminInventoryPage = lazy(() => import('./pages/AdminInventoryPage'));
const AdminMessagingPage = lazy(() => import('./pages/AdminMessagingPage'));
const AdminMessagePage = lazy(() => import('./pages/AdminMessagePage'));
const AdminMobileAppPage = lazy(() => import('./pages/AdminMobileAppPage'));
const AdminReviewsPage = lazy(() => import('./pages/AdminReviewsPage'));
const AdminActivityLogsPage = lazy(() => import('./pages/AdminActivityLogsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminDeliveryPage = lazy(() => import('./pages/AdminDeliveryPage'));
const AdminFeeCalculatorPage = lazy(() => import('./pages/AdminFeeCalculatorPage'));

// QA / Tests
const AdminManualTestsPage = lazy(() => import('./pages/AdminManualTestsPage'));

// Maintenance routes
const AdminTrashPage = lazy(() => import('./pages/AdminTrashPage'));

// Suspense Wrapper
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-[100vw] overflow-x-clip bg-[#F7F7F7]">
      <Header />
      <main className="flex-1 flex flex-col w-full relative">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SuspenseWrapper><HomePage /></SuspenseWrapper>} />
          <Route path="/menu" element={<SuspenseWrapper><MenuPage /></SuspenseWrapper>} />
          <Route path="/search" element={<SuspenseWrapper><SearchPage /></SuspenseWrapper>} />
          <Route path="/product/:id" element={<SuspenseWrapper><ProductDetailsPage /></SuspenseWrapper>} />
          <Route path="/cart" element={<SuspenseWrapper><CartPage /></SuspenseWrapper>} />
          <Route path="/checkout" element={<SuspenseWrapper><CheckoutPage /></SuspenseWrapper>} />
          <Route path="/order-confirmation/:id" element={<SuspenseWrapper><OrderConfirmationPage /></SuspenseWrapper>} />
          <Route path="/reservation-confirmation" element={<SuspenseWrapper><ReservationConfirmationPage /></SuspenseWrapper>} />
          
          <Route path="/track-order/:id" element={<SuspenseWrapper><OrderTrackingPage /></SuspenseWrapper>} />
          <Route path="/track-restaurant-order/:id" element={<SuspenseWrapper><RestaurantOrderTrackingPage /></SuspenseWrapper>} />
          <Route path="/qr-menu" element={<SuspenseWrapper><QRMenuPage /></SuspenseWrapper>} />
          <Route path="/payment-proof/:orderType/:orderId" element={<SuspenseWrapper><PaymentProofPage /></SuspenseWrapper>} />
          <Route path="/mobile-money/:orderType/:orderId" element={<SuspenseWrapper><MobileMoneyPaymentPage /></SuspenseWrapper>} />
          <Route path="/promo-popup/:bannerId" element={<SuspenseWrapper><PromoPopupPage /></SuspenseWrapper>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
          <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />
          <Route path="/admin/login" element={<SuspenseWrapper><AdminLoginPage /></SuspenseWrapper>} />
          
          {/* Protected Client Routes */}
          <Route path="/profile" element={<ProtectedRoute><SuspenseWrapper><ProfilePage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SuspenseWrapper><SettingsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute><SuspenseWrapper><ReservationsPage /></SuspenseWrapper></ProtectedRoute>} />
          
          {/* NEW ORDERS MODULE ROUTES (Replaces old /orders) */}
          <Route path="/orders" element={<ProtectedRoute><SuspenseWrapper><ModuleOrdersPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><SuspenseWrapper><ModuleOrderDetailPage /></SuspenseWrapper></ProtectedRoute>} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminDashboard /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminMenuPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminSettingsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminUsersPage /></SuspenseWrapper></ProtectedRoute>} />
          
          {/* NEW ORDERS MODULE ADMIN ROUTE */}
          <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><SuspenseWrapper><ModuleAdminOrdersPage /></SuspenseWrapper></ProtectedRoute>} />

          {/* Les 4 fonctionnalités principales stabilisées */}
          <Route path="/admin/delivery-orders" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminDeliveryOrdersPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/restaurant-orders" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminRestaurantOrdersPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminClientsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/stock-management" element={<ProtectedRoute requireAdmin><SuspenseWrapper><StockManagementPage /></SuspenseWrapper></ProtectedRoute>} />
          
          {/* Modules secondaires d'administration */}
          <Route path="/admin/promo-banner" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminPromoBannerPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/tables" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminTablesPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/reservations" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminReservationsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminFeedbackPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/custom-requests" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminCustomRequestsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminReportsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/history" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminHistoryPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/calendar" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminCalendarPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminInventoryPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/messagerie" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminMessagingPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/message" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminMessagePage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/mobile-app" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminMobileAppPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminReviewsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/activity-logs" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminActivityLogsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminAnalyticsPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/delivery" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminDeliveryPage /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/calculateur-frais" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminFeeCalculatorPage /></SuspenseWrapper></ProtectedRoute>} />
          
          {/* QA / Tests manuels */}
          <Route path="/admin/tests" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminManualTestsPage /></SuspenseWrapper></ProtectedRoute>} />

          {/* Maintenance */}
          <Route path="/admin/trash" element={<ProtectedRoute requireAdmin><SuspenseWrapper><AdminTrashPage /></SuspenseWrapper></ProtectedRoute>} />

          {/* Alias pour correspondre exactement à la demande si accédé sans /admin */}
          <Route path="/delivery-orders" element={<Navigate to="/admin/delivery-orders" replace />} />
          <Route path="/restaurant-orders" element={<Navigate to="/admin/restaurant-orders" replace />} />
          <Route path="/stock-management" element={<Navigate to="/admin/stock-management" replace />} />

          {/* CRITICAL: Fallback catch-all strictly for /admin paths */}
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

          {/* Global catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MobileBottomNav />
      <AIAssistant />
      <WhatsAppButton />
    </div>
  );
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await runStartupDiagnostics();
        await ensureAdminSettingsExists();
      } catch (err) {
        console.error("Initialization warning (App is proceeding anyway):", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <LoadingFallback />
        <p className="mt-4 text-sm text-gray-500">Démarrage et vérification du système...</p>
      </div>
    );
  }

  return (
    <>
      <ConnectionStatusMonitor />
      <AppRoutes />
    </>
  );
}

export default App;