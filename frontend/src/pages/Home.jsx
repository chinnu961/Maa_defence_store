import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Hero from '../components/Hero.jsx';
import Features from '../components/Features.jsx';
import Shop from '../components/Shop.jsx';
import BulkInquiry from '../components/BulkInquiry.jsx';
import Contact from '../components/Contact.jsx';

export default function Home() {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <Hero />
      <Features />
      <Shop />
      <BulkInquiry />
      <Contact />
    </>
  );
}
