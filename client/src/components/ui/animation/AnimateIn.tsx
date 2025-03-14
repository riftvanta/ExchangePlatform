import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// Animation variants for different entrance animations
export const ANIMATION_VARIANTS = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  },
  scaleInUp: {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } }
  }
};

export type AnimationVariant = keyof typeof ANIMATION_VARIANTS;

export interface AnimateInProps 
  extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'variants'> {
  children: ReactNode;
  animation?: AnimationVariant;
  delay?: number;
  duration?: number;
  as?: React.ElementType;
  once?: boolean;
}

export const AnimateIn: React.FC<AnimateInProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration,
  as = 'div',
  once = true,
  className = '',
  ...props
}) => {
  const MotionComponent = motion[as as keyof typeof motion] || motion.div;
  const variants = ANIMATION_VARIANTS[animation];
  
  // Apply custom duration if provided
  if (duration) {
    variants.visible.transition.duration = duration;
  }

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={variants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default AnimateIn; 