import React from 'react';
import { Navbar, Footer } from './index';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  const location = useLocation();
  
  // Determine which routes should have transparent navbar
  const isHomePage = location.pathname === '/';
  
  // Determine which routes are auth pages to exclude navbar and footer
  const authRoutes = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password', 
    '/verify-email', 
    '/resend-verification'
  ];
  
  const isAuthPage = authRoutes.includes(location.pathname);
  
  return (
    <>
      {!isAuthPage && <Navbar transparent={isHomePage} />}
      {children}
      {!isAuthPage && isHomePage && !hideFooter && <Footer />}
    </>
  );
};

export default Layout; 