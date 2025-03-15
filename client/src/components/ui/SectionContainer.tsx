import React from 'react';
import { motion } from 'framer-motion';

interface SectionContainerProps {
  id?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  background?: 'white' | 'light' | 'primary' | 'dark';
  children: React.ReactNode;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  id,
  className = '',
  title,
  subtitle,
  background = 'white',
  children
}) => {
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

  // Get background class based on prop
  const getBgClass = () => {
    switch(background) {
      case 'light': return 'bg-light';
      case 'primary': return 'bg-primary';
      case 'dark': return 'bg-dark';
      default: return 'bg-white';
    }
  };

  return (
    <section id={id} className={`section ${getBgClass()} ${className}`}>
      <div className="container">
        {(title || subtitle) && (
          <div className="section-header">
            {title && (
              <motion.h2 
                className="section-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                {title}
              </motion.h2>
            )}
            
            {subtitle && (
              <motion.p 
                className="section-subtitle"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}
        
        <motion.div
          className="section-content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default SectionContainer; 