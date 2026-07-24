import { Route, Routes, Navigate } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { OrdersProvider } from './context/OrdersContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import ToastContainer from './components/ToastContainer.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Profile from './pages/Profile.jsx';
import AdminProfile from './pages/AdminProfile.jsx';
import AdminUserDetail from './pages/AdminUserDetail.jsx';
import BottomNavigation from './components/BottomNavigation.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationsProvider>
            <OrdersProvider>
              <CartProvider>
                <ToastContainer />
                <Routes>
                  <Route
                    path="/"
                    element={
                      <>
                        <Header />
                        <Home />
                        <Footer />
                        <CartDrawer />
                        <BottomNavigation />
                      </>
                    }
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin" element={
                    <>
                      <Header />
                      <AdminDashboard />
                      <Footer />
                    </>
                  } />
                  <Route path="/admin/profile" element={
                    <>
                      <Header />
                      <AdminProfile />
                      <Footer />
                    </>
                  } />
                  <Route path="/admin/user/:id" element={
                    <>
                      <Header />
                      <AdminUserDetail />
                      <Footer />
                    </>
                  } />
                  <Route
                    path="/product/:id"
                    element={
                      <>
                        <Header />
                        <ProductDetails />
                        <Footer />
                        <CartDrawer />
                        <BottomNavigation />
                      </>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <>
                        <Header />
                        <div style={{ paddingTop: '100px', background: '#0a0a0a', minHeight: '80vh' }}>
                          <Contact />
                        </div>
                        <Footer />
                        <BottomNavigation />
                      </>
                    }
                  />
                  <Route path="/profile" element={
                    <>
                      <Header />
                      <Profile />
                      <Footer />
                      <BottomNavigation />
                    </>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </CartProvider>
            </OrdersProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
