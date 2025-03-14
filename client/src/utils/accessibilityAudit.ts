/**
 * Accessibility Audit Utility
 * 
 * This utility helps identify common accessibility issues in the application
 * during development and testing.
 * 
 * Usage: import { runAccessibilityAudit } from './accessibilityAudit';
 *        runAccessibilityAudit(); // Check entire page
 *        runAccessibilityAudit('#my-component'); // Check specific component
 */

interface AuditResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: Element;
  recommendation: string;
}

/**
 * Run an accessibility audit on the current page or a specific selector
 * @param selector - Optional CSS selector to limit the scope of the audit
 * @returns Array of audit results with issues found
 */
export function runAccessibilityAudit(selector: string = 'body'): AuditResult[] {
  const results: AuditResult[] = [];
  const root = document.querySelector(selector);
  
  if (!root) {
    console.error(`No element found for selector: ${selector}`);
    return [];
  }
  
  // Check for images without alt text
  checkImagesWithoutAlt(root, results);
  
  // Check for insufficient color contrast (basic check only)
  checkColorContrast(root, results);
  
  // Check for missing form labels
  checkFormLabels(root, results);
  
  // Check for missing heading structure
  checkHeadingStructure(root, results);
  
  // Check for keyboard traps
  checkKeyboardTraps(results);
  
  // Check for missing ARIA roles
  checkMissingAriaRoles(root, results);
  
  // Output results to console in a readable format
  printResults(results);
  
  return results;
}

/**
 * Check for images without alt text
 */
function checkImagesWithoutAlt(root: Element, results: AuditResult[]): void {
  const images = root.querySelectorAll('img');
  
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      results.push({
        type: 'error',
        message: 'Image without alt text',
        element: img,
        recommendation: 'Add appropriate alt text to the image or empty alt if decorative'
      });
    } else if (img.alt === 'image' || img.alt === 'picture' || img.alt === 'photo') {
      results.push({
        type: 'warning',
        message: 'Generic alt text detected',
        element: img,
        recommendation: 'Replace generic alt text with something more descriptive'
      });
    }
  });
}

/**
 * Basic color contrast check (not a replacement for proper tools)
 */
function checkColorContrast(root: Element, results: AuditResult[]): void {
  // This is a simplified check - real contrast checking requires computing styles
  const elements = root.querySelectorAll('*');
  
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const color = style.color;
    
    // Skip elements with transparent background
    if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      return;
    }
    
    // Very basic detection of potentially low contrast
    // This is not accurate - use proper tools for real testing
    if ((bgColor.includes('255, 255, 255') && color.includes('200, 200, 200')) ||
        (bgColor.includes('240, 240, 240') && color.includes('150, 150, 150'))) {
      results.push({
        type: 'warning',
        message: 'Potential low contrast text detected',
        element: el,
        recommendation: 'Check text contrast ratio (should be at least 4.5:1 for normal text)'
      });
    }
  });
}

/**
 * Check for form controls without labels
 */
function checkFormLabels(root: Element, results: AuditResult[]): void {
  const formControls = root.querySelectorAll('input, select, textarea');
  
  formControls.forEach(control => {
    // Skip hidden, submit, button, and image inputs
    if (control instanceof HTMLInputElement && 
        ['hidden', 'submit', 'button', 'image'].includes(control.type)) {
      return;
    }
    
    const id = control.getAttribute('id');
    let hasLabel = false;
    
    if (id) {
      // Check for explicit label
      const label = root.querySelector(`label[for="${id}"]`);
      hasLabel = !!label;
    }
    
    // Check for aria-label or aria-labelledby
    const ariaLabel = control.getAttribute('aria-label');
    const ariaLabelledBy = control.getAttribute('aria-labelledby');
    
    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
      results.push({
        type: 'error',
        message: 'Form control without label',
        element: control,
        recommendation: 'Add a label element with a for attribute, or use aria-label/aria-labelledby'
      });
    }
  });
}

/**
 * Check for proper heading structure
 */
function checkHeadingStructure(root: Element, results: AuditResult[]): void {
  const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  headings.forEach(heading => {
    const currentLevel = parseInt(heading.tagName.substring(1));
    
    // Check for skipped heading levels
    if (currentLevel > previousLevel + 1 && previousLevel !== 0) {
      results.push({
        type: 'warning',
        message: `Skipped heading level: h${previousLevel} to h${currentLevel}`,
        element: heading,
        recommendation: 'Ensure heading levels are sequential without skipping levels'
      });
    }
    
    previousLevel = currentLevel;
  });
  
  // Check if page has an h1
  if (!root.querySelector('h1')) {
    results.push({
      type: 'warning',
      message: 'No h1 heading found on the page',
      recommendation: 'Add an h1 heading as the main title of the page'
    });
  }
}

/**
 * Check for potential keyboard traps
 * This is a basic check - real keyboard trap detection requires manual testing
 */
function checkKeyboardTraps(results: AuditResult[]): void {
  // This is mostly a reminder - real keyboard trap detection needs manual testing
  results.push({
    type: 'info',
    message: 'Remember to manually test for keyboard traps',
    recommendation: 'Ensure all interactive elements can be navigated to and away from using only the keyboard'
  });
}

/**
 * Check for elements that should have ARIA roles but don't
 */
function checkMissingAriaRoles(root: Element, results: AuditResult[]): void {
  // Check for navigation without role
  const navs = root.querySelectorAll('nav');
  navs.forEach(nav => {
    if (!nav.hasAttribute('aria-label')) {
      results.push({
        type: 'warning',
        message: 'Navigation element without aria-label',
        element: nav,
        recommendation: 'Add aria-label to describe the navigation purpose'
      });
    }
  });
  
  // Check for buttons that are not buttons
  const divButtons = root.querySelectorAll('div[onclick], span[onclick]');
  divButtons.forEach(el => {
    if (!el.getAttribute('role') || el.getAttribute('role') !== 'button') {
      results.push({
        type: 'error',
        message: 'Interactive element without button role',
        element: el,
        recommendation: 'Use a button element or add role="button" and proper keyboard handling'
      });
    }
  });
  
  // Check for tables without proper roles
  const tables = root.querySelectorAll('table');
  tables.forEach(table => {
    if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
      results.push({
        type: 'warning',
        message: 'Table without caption or aria-label',
        element: table,
        recommendation: 'Add a caption or aria-label to describe the table purpose'
      });
    }
  });
}

/**
 * Format and print results to console
 */
function printResults(results: AuditResult[]): void {
  if (results.length === 0) {
    console.log('%c✓ No accessibility issues detected', 'color: green; font-weight: bold;');
    return;
  }
  
  console.group('Accessibility Audit Results');
  
  const errors = results.filter(r => r.type === 'error');
  const warnings = results.filter(r => r.type === 'warning');
  const info = results.filter(r => r.type === 'info');
  
  console.log(`Found ${errors.length} errors, ${warnings.length} warnings, ${info.length} info items`);
  
  if (errors.length > 0) {
    console.group('%c⚠️ Errors (Must Fix)', 'color: red; font-weight: bold;');
    errors.forEach((result, i) => {
      console.group(`Error ${i + 1}: ${result.message}`);
      if (result.element) {
        console.log('Element:', result.element);
      }
      console.log('Recommendation:', result.recommendation);
      console.groupEnd();
    });
    console.groupEnd();
  }
  
  if (warnings.length > 0) {
    console.group('%c⚠️ Warnings (Should Fix)', 'color: orange; font-weight: bold;');
    warnings.forEach((result, i) => {
      console.group(`Warning ${i + 1}: ${result.message}`);
      if (result.element) {
        console.log('Element:', result.element);
      }
      console.log('Recommendation:', result.recommendation);
      console.groupEnd();
    });
    console.groupEnd();
  }
  
  if (info.length > 0) {
    console.group('%cℹ️ Info (Consider)', 'color: blue; font-weight: bold;');
    info.forEach((result, i) => {
      console.group(`Info ${i + 1}: ${result.message}`);
      console.log('Recommendation:', result.recommendation);
      console.groupEnd();
    });
    console.groupEnd();
  }
  
  console.groupEnd();
} 