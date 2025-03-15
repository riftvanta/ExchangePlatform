import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  // Transform values for scroll-based animations
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.9]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };
  
  // Testimonials data
  const testimonials = [
    {
      id: 1,
      content: "The exchange process was incredibly smooth. I was able to convert my USDT to JOD in minutes with a great exchange rate.",
      author: "Ahmad S.",
      role: "Verified Customer",
    },
    {
      id: 2,
      content: "Their customer support team was very helpful when I had questions about my first deposit. The process was simple and secure.",
      author: "Sarah K.",
      role: "Regular User",
    },
    {
      id: 3,
      content: "I've been using this platform for 6 months now. The rates are consistently competitive and transactions are always fast.",
      author: "Mohammed H.",
      role: "Business Owner",
    }
  ];
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  return (
    <>
      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Fast & Secure USDT-JOD Exchange</h1>
            <p>Exchange your Tether (USDT) to Jordanian Dinar (JOD) and vice versa with the most competitive rates and lightning-fast processing.</p>
            
            {user ? (
              <Link to="/dashboard" className="button hero-button">
                Go to Dashboard
              </Link>
            ) : (
              <div className="hero-buttons">
                <Link to="/register" className="button hero-button">
                  Create Account
                </Link>
                <Link to="/login" className="button text hero-text-button">
                  Already have an account? Login
                </Link>
              </div>
            )}
          </motion.div>
          
          <motion.div 
            className="hero-image"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className="exchange-graphic"
              whileHover={{ 
                rotate: [0, -1, 1, -1, 0],
                transition: { duration: 0.5 }
              }}
            >
              <motion.div 
                className="crypto-coin usdt"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <i className="fa-brands fa-ethereum" aria-hidden="true"></i>
                <span>USDT</span>
              </motion.div>
              <motion.div 
                className="exchange-arrows"
                animate={{ 
                  x: [0, 5, 0, -5, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5 
                }}
              >
                <i className="fa-solid fa-right-left" aria-hidden="true"></i>
              </motion.div>
              <motion.div 
                className="crypto-coin jod"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <span>JOD</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </motion.section>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            Why Choose Our Exchange?
          </motion.h2>
          
          <motion.div 
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <i className="fa-solid fa-lock" aria-hidden="true"></i>
              </div>
              <h3>Secure Transactions</h3>
              <p>All transactions are encrypted and processed with bank-grade security protocols. Your funds and data are always protected.</p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <i className="fa-solid fa-bolt" aria-hidden="true"></i>
              </div>
              <h3>Fast Processing</h3>
              <p>Experience quick transaction processing with confirmations in minutes. No more waiting for days for your money to arrive.</p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <i className="fa-solid fa-chart-line" aria-hidden="true"></i>
              </div>
              <h3>Best Exchange Rates</h3>
              <p>We offer competitive exchange rates with minimal fees for maximum value. Get more for every exchange you make.</p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <i className="fa-solid fa-headset" aria-hidden="true"></i>
              </div>
              <h3>24/7 Support</h3>
              <p>Our customer support team is available around the clock to assist you with any questions or concerns you may have.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          
          <motion.div 
            className="steps-container"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div className="step" variants={itemVariants} whileHover={{ y: -5 }}>
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up for a free account with your email and verify your identity to get started.</p>
            </motion.div>
            
            <motion.div 
              className="step-connector" 
              variants={itemVariants}
              animate={{ 
                x: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2 
              }}
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </motion.div>
            
            <motion.div className="step" variants={itemVariants} whileHover={{ y: -5 }}>
              <div className="step-number">2</div>
              <h3>Deposit Funds</h3>
              <p>Deposit USDT into your account wallet or JOD through our secure bank transfer options.</p>
            </motion.div>
            
            <motion.div 
              className="step-connector" 
              variants={itemVariants}
              animate={{ 
                x: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                delay: 0.5
              }}
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </motion.div>
            
            <motion.div className="step" variants={itemVariants} whileHover={{ y: -5 }}>
              <div className="step-number">3</div>
              <h3>Exchange Currency</h3>
              <p>Convert your USDT to JOD or vice versa at the current best available exchange rate.</p>
            </motion.div>
            
            <motion.div 
              className="step-connector" 
              variants={itemVariants}
              animate={{ 
                x: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                delay: 1
              }}
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </motion.div>
            
            <motion.div className="step" variants={itemVariants} whileHover={{ y: -5 }}>
              <div className="step-number">4</div>
              <h3>Withdraw Funds</h3>
              <p>Withdraw your exchanged currency to your bank account or crypto wallet quickly and securely.</p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="cta-container"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 8px 25px rgba(74, 108, 247, 0.5)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                to={user ? "/dashboard" : "/register"} 
                className="button cta-button"
              >
                {user ? "Go to Dashboard" : "Get Started Now"}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            What Our Customers Say
          </motion.h2>
          
          <motion.div 
            className="testimonials-carousel"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.id}
                className="testimonial-card"
                initial={{ opacity: 0, x: 100 }}
                animate={{ 
                  opacity: currentTestimonial === index ? 1 : 0,
                  x: currentTestimonial === index ? 0 : 100,
                  display: currentTestimonial === index ? 'flex' : 'none'
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="testimonial-content">
                  <p>{testimonial.content}</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <i className="fa-solid fa-user-circle" aria-hidden="true"></i>
                  </div>
                  <div className="author-info">
                    <h4>{testimonial.author}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button 
                  key={index}
                  className={`testimonial-dot ${currentTestimonial === index ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="container">
          <motion.div 
            className="final-cta-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>Ready to Start Exchanging?</h2>
            <p>Join thousands of satisfied customers exchanging USDT and JOD on our platform.</p>
            
            <div className="final-cta-buttons">
              <Link to={user ? "/dashboard" : "/register"} className="button cta-button">
                {user ? "Go to Dashboard" : "Create an Account"}
              </Link>
              
              {!user && (
                <Link to="/login" className="button text hero-text-button">
                  Already have an account? Login
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage; 