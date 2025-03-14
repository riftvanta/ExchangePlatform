import React, { createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';

// Animation context types
interface AnimationContextType {
  childAnimationDelay: number;
  staggerIndex: number;
  incrementStaggerIndex: () => void;
  resetStaggerIndex: () => void;
}

// Create the context
const AnimationContext = createContext<AnimationContextType>({
  childAnimationDelay: 0,
  staggerIndex: 0,
  incrementStaggerIndex: () => {},
  resetStaggerIndex: () => {},
});

// Animation provider props
interface AnimationProviderProps {
  children: ReactNode;
  staggerDelay?: number; // Delay between each child animation in seconds
  initialDelay?: number; // Initial delay before the first animation in seconds
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

// List animation variants
const listVariants = {
  hidden: {},
  visible: {},
};

// Component that provides animation context
export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children,
  staggerDelay = 0.05,
  initialDelay = 0,
  className = '',
  tag = 'div',
}) => {
  const [staggerIndex, setStaggerIndex] = React.useState(0);
  
  const incrementStaggerIndex = React.useCallback(() => {
    setStaggerIndex((prev) => prev + 1);
  }, []);
  
  const resetStaggerIndex = React.useCallback(() => {
    setStaggerIndex(0);
  }, []);
  
  // Reset stagger index when component unmounts
  React.useEffect(() => {
    return () => {
      resetStaggerIndex();
    };
  }, [resetStaggerIndex]);
  
  const MotionComponent = motion[tag];
  
  return (
    <AnimationContext.Provider
      value={{
        childAnimationDelay: staggerDelay,
        staggerIndex,
        incrementStaggerIndex,
        resetStaggerIndex,
      }}
    >
      <MotionComponent
        initial="hidden"
        animate="visible"
        variants={listVariants}
        className={className}
      >
        {children}
      </MotionComponent>
    </AnimationContext.Provider>
  );
};

// Hook to use animation context
export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

// Staggered child component props
interface StaggerChildProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: ReactNode;
  delay?: number; // Additional delay in seconds
  as?: keyof JSX.IntrinsicElements;
}

// Child animation variants
const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
};

// Component for staggered child animations
export const StaggerChild: React.FC<StaggerChildProps> = ({
  children,
  delay = 0,
  as = 'div',
  ...props
}) => {
  const { childAnimationDelay, staggerIndex, incrementStaggerIndex } = useAnimation();
  const MotionComponent = motion[as];
  
  // Calculate the total delay based on stagger index and extra delay
  const totalDelay = childAnimationDelay * staggerIndex + delay;
  
  // Increment the stagger index on mount
  React.useEffect(() => {
    incrementStaggerIndex();
  }, [incrementStaggerIndex]);
  
  return (
    <MotionComponent
      variants={childVariants}
      custom={totalDelay}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default AnimationProvider; 