/**
 * Accessibility Utilities
 * Helper functions for ensuring accessible UI components
 */

/**
 * Calculates the contrast ratio between two colors
 * @param foreground - Foreground color in hex format (#RRGGBB)
 * @param background - Background color in hex format (#RRGGBB)
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const getRGB = (hex: string): number[] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // Calculate relative luminance
  const getLuminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map(v => {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const rgb1 = getRGB(foreground);
  const rgb2 = getRGB(background);
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  // Ensure darker color is l1
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination meets WCAG 2.1 AA standards
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether the combination meets AA standards
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Creates a focus trap to keep focus within a modal/dialog
 * @param containerRef - React ref to the container element
 * @returns Functions to activate/deactivate the focus trap
 */
export function createFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  let focusableElements: HTMLElement[] = [];
  
  const activate = () => {
    if (!containerRef.current) return;
    
    // Find all focusable elements
    focusableElements = Array.from(
      containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
    
    if (focusableElements.length === 0) return;
    
    // Focus the first element
    focusableElements[0].focus();
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
  };
  
  const deactivate = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (focusableElements.length === 0) return;
    
    // Handle tabbing through elements
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // If shift+tab on first element, go to last element
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } 
    // If tab on last element, go to first element
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };
  
  return { activate, deactivate };
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - The priority of the announcement (assertive for important, polite for less important)
 */
export function announceToScreenReader(message: string, priority: 'assertive' | 'polite' = 'polite') {
  const announcer = document.getElementById('screen-reader-announcer');
  if (!announcer) return;
  
  // Set the aria-live attribute to the requested priority
  announcer.setAttribute('aria-live', priority);
  
  // Clear the announcer first (this is a trick to make sure screen readers announce the new content)
  announcer.textContent = '';
  
  // Small delay to ensure the content change is registered
  setTimeout(() => {
    announcer.textContent = message;
  }, 50);
} 