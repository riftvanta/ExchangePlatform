import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-800",
        secondary: "bg-secondary-100 text-secondary-800",
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        error: "bg-error-100 text-error-800",
        neutral: "bg-neutral-100 text-neutral-800",
      },
      outline: {
        true: "bg-transparent border",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        outline: true,
        className: "border-primary-300 text-primary-800",
      },
      {
        variant: "secondary",
        outline: true,
        className: "border-secondary-300 text-secondary-800",
      },
      {
        variant: "success",
        outline: true,
        className: "border-success-300 text-success-800",
      },
      {
        variant: "warning",
        outline: true,
        className: "border-warning-300 text-warning-800",
      },
      {
        variant: "error",
        outline: true,
        className: "border-error-300 text-error-800",
      },
      {
        variant: "neutral",
        outline: true,
        className: "border-neutral-300 text-neutral-800",
      },
    ],
    defaultVariants: {
      variant: "default",
      outline: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({
  className = '',
  variant = 'default',
  outline = false,
  ...props
}: BadgeProps) => {
  return (
    <div
      className={badgeVariants({ variant, outline, className })}
      {...props}
    />
  );
};

export default Badge; 