import React from 'react';
import JoyModal from '@mui/joy/Modal';
import ModalDialog, { ModalDialogProps } from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import { getJoyProps } from '../../styles/compatibility';

// Define props interface
interface AppModalProps {
  className?: string;
  children: React.ReactNode;
  title?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  color?: ModalDialogProps['color'];
  variant?: ModalDialogProps['variant'];
}

/**
 * A Joy UI based Modal component for dialogs and popups
 * This component provides a standardized modal with optional title and footer
 */
export default function AppModal({ 
  className, 
  children,
  title,
  size = 'md',
  footer,
  open,
  onClose,
  color,
  variant,
  ...props 
}: AppModalProps) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);
  
  // Map size to width
  const sizeToWidth = {
    sm: 400,
    md: 600,
    lg: 800
  };
  
  return (
    <JoyModal
      open={open}
      onClose={onClose}
      {...joyProps}
      {...props}
    >
      <ModalDialog
        sx={{ 
          maxWidth: sizeToWidth[size], 
          width: '100%',
          overflow: 'hidden'
        }}
        color={color}
        variant={variant}
        layout="center"
      >
        <ModalClose />
        
        {title && (
          <div className="modal-header" style={{ 
            padding: '1rem', 
            borderBottom: '1px solid var(--joy-palette-divider)'
          }}>
            {typeof title === 'string' ? (
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
            ) : (
              title
            )}
          </div>
        )}
        
        <div className="modal-body" style={{ 
          padding: '1rem',
          overflowY: 'auto'
        }}>
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer" style={{ 
            padding: '1rem', 
            borderTop: '1px solid var(--joy-palette-divider)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem'
          }}>
            {footer}
          </div>
        )}
      </ModalDialog>
    </JoyModal>
  );
} 