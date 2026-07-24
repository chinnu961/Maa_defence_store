import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleNav = (target) => {
    if (target === 'home') {
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (target === 'shop') {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === 'contact') {
      navigate('/contact');
    } else if (target === 'profile') {
      if (isAdmin) {
        navigate('/admin');
      } else if (isAuthenticated) {
        navigate('/profile');
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <div className="mobile-bottom-nav">
      <button onClick={() => handleNav('home')} className="bottom-nav-item">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
      </button>
      <button onClick={() => handleNav('shop')} className="bottom-nav-item">
        <i className="fa-solid fa-store"></i>
        <span>Shop Catalog</span>
      </button>
      <button onClick={() => handleNav('contact')} className="bottom-nav-item">
        <i className="fa-solid fa-envelope"></i>
        <span>Contact</span>
      </button>
      <button onClick={() => handleNav('profile')} className="bottom-nav-item">
        <i className="fa-solid fa-user"></i>
        <span>Profile</span>
      </button>
    </div>
  );
}
