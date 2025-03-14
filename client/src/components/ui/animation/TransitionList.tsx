import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Props for the TransitionList component
interface TransitionListProps {
  children: ReactNode[];
  className?: string;
  stagger?: number;
  transition?: {
    duration?: number;
    ease?: string;
    delay?: number;
  };
}

/**
 * TransitionList component that animates a list of items with staggered animations
 * when they enter or leave the DOM.
 */
export const TransitionList: React.FC<TransitionListProps> = ({
  children,
  className = '',
  stagger = 0.05,
  transition = {
    duration: 0.3,
    ease: 'easeOut',
    delay: 0,
  },
}) => {
  // List container animation
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: transition.delay || 0,
      },
    },
  };

  // Individual item animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: transition.duration || 0.3,
        ease: transition.ease || 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: (transition.duration || 0.3) * 0.75,
        ease: transition.ease || 'easeOut',
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={`list-item-${index}`}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// TransitionListItem for handling individual items with keys
interface TransitionListItemProps {
  children: ReactNode;
  itemKey: string | number;
  className?: string;
  transition?: {
    duration?: number;
    ease?: string;
    delay?: number;
  };
}

export const TransitionListItem: React.FC<TransitionListItemProps> = ({
  children,
  itemKey,
  className = '',
  transition = {
    duration: 0.3,
    ease: 'easeOut',
    delay: 0,
  },
}) => {
  // Individual item animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: transition.duration || 0.3,
        ease: transition.ease || 'easeOut',
        delay: transition.delay || 0,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: (transition.duration || 0.3) * 0.75,
        ease: transition.ease || 'easeOut',
      },
    },
  };

  return (
    <motion.div
      key={itemKey}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      layout
    >
      {children}
    </motion.div>
  );
};

// TransitionGroup for handling a dynamic list of items with keys
interface TransitionGroupProps {
  children: ReactNode;
  className?: string;
}

export const TransitionGroup: React.FC<TransitionGroupProps> = ({
  children,
  className = '',
}) => {
  return (
    <AnimatePresence mode="sync">
      <motion.div className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default TransitionList; 