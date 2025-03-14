# Accessibility Guidelines

## Overview

This document provides guidelines for maintaining and improving the accessibility of our application. Adhering to these practices ensures our application is usable by everyone, including people with disabilities.

## Standards

We aim to comply with [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aaa) standards, which covers a wide range of recommendations for making web content more accessible.

## Key Principles

1. **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive.
2. **Operable**: User interface components and navigation must be operable.
3. **Understandable**: Information and the operation of the user interface must be understandable.
4. **Robust**: Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

## Implementation Guidelines

### Semantic HTML

- Use appropriate HTML elements for their intended purpose
- Employ semantic elements like `<header>`, `<nav>`, `<main>`, `<section>`, etc.
- Ensure a logical heading structure (`h1` through `h6`)

```jsx
// Good
<section>
  <h2>Section Title</h2>
  <p>Content here</p>
</section>

// Avoid
<div>
  <div class="heading">Section Title</div>
  <div>Content here</div>
</div>
```

### ARIA Attributes

- Add ARIA landmarks to identify regions of a page
- Use ARIA roles, states, and properties when HTML semantics are not sufficient
- Always prefer native HTML semantics over ARIA when possible

```jsx
// Example of ARIA attributes
<div role="alert" aria-live="assertive">
  Error: Form submission failed
</div>

<button aria-expanded="false" aria-controls="menu-content">
  Menu
</button>
```

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Maintain a logical tab order
- Provide visible focus indicators
- Implement keyboard shortcuts where appropriate

```jsx
// Example of managing focus
const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
};

// Focus trap example
useEffect(() => {
  if (isModalOpen && modalRef.current) {
    const focusTrap = createFocusTrap(modalRef);
    focusTrap.activate();
    return () => focusTrap.deactivate();
  }
}, [isModalOpen]);
```

### Color and Contrast

- Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information
- Test for color blindness scenarios

```css
/* Good contrast example */
.button-primary {
  background-color: rgb(var(--color-primary-700));
  color: white; /* High contrast with dark background */
}

/* Complement color with other indicators */
.error-text {
  color: rgb(var(--color-error-700));
  font-weight: bold;
  border-left: 3px solid rgb(var(--color-error-700));
  padding-left: 8px;
}
```

### Screen Readers

- Provide alternative text for images
- Hide decorative elements from screen readers
- Announce dynamic content changes

```jsx
// Image with appropriate alt text
<img src="chart.png" alt="Q1 2023 revenue chart showing 15% growth" />

// Decorative image
<img src="divider.png" alt="" role="presentation" />

// Announcing dynamic content
const updateMessage = (message) => {
  announceToScreenReader(message);
  setStatus(message);
};
```

### Forms

- Associate labels with form controls
- Group related form elements
- Provide clear error messages
- Ensure form validation is accessible

```jsx
// Good form example
<div>
  <label htmlFor="email-input">Email Address</label>
  <input 
    id="email-input"
    type="email"
    aria-describedby="email-error"
    aria-invalid={hasError}
  />
  {hasError && (
    <div id="email-error" role="alert">
      Please enter a valid email address
    </div>
  )}
</div>
```

### Responsive Design

- Ensure content is accessible at all viewport sizes
- Support text resizing up to 200% without loss of content
- Design for touch devices with appropriate target sizes

```css
/* Responsive text */
.body-text {
  font-size: 16px;
}

@media (max-width: 768px) {
  .body-text {
    font-size: 14px;
  }
}

/* Touch-friendly targets */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
}
```

## Testing Accessibility

### Automated Testing

We have several tools to help test for accessibility issues:

1. **Built-in Audit Tool**: Use our custom accessibility audit tool during development
   ```javascript
   import { runAccessibilityAudit } from '../utils/accessibilityAudit';
   
   // Run in the browser console
   runAccessibilityAudit();
   
   // Or target specific components
   runAccessibilityAudit('#user-profile');
   ```

2. **Browser Extensions**:
   - [axe DevTools](https://www.deque.com/axe/devtools/)
   - [WAVE Evaluation Tool](https://wave.webaim.org/extension/)
   - [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Manual Testing

Automated tools can't catch everything. Manual testing is essential:

1. **Keyboard Navigation**: Tab through the interface without using a mouse
2. **Screen Reader Testing**: Use NVDA, JAWS, or VoiceOver
3. **Zoom Testing**: Test the site at 200% zoom
4. **Reduced Motion**: Test with reduced motion preference enabled
5. **High Contrast Mode**: Test in high contrast mode

## Useful Resources

- [WebAIM](https://webaim.org/) - Web accessibility resources and articles
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/) - Accessibility checklist
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Comprehensive developer documentation
- [Inclusive Components](https://inclusive-components.design/) - Accessible component patterns

## Our Accessibility Utilities

We have custom utilities to help implement accessible features:

1. **Focus Management**:
   ```typescript
   import { createFocusTrap } from '../utils/accessibility';
   
   // In a modal component
   const modalRef = useRef(null);
   const focusTrap = createFocusTrap(modalRef);
   
   useEffect(() => {
     if (isOpen) {
       focusTrap.activate();
     }
     return () => focusTrap.deactivate();
   }, [isOpen]);
   ```

2. **Screen Reader Announcements**:
   ```typescript
   import { announceToScreenReader } from '../utils/accessibility';
   
   // When content changes
   announceToScreenReader('Your message has been sent', 'polite');
   
   // For critical alerts
   announceToScreenReader('Error: Form submission failed', 'assertive');
   ```

3. **Skip to Content**:
   ```typescript
   import { skipToContent } from '../utils/accessibility';
   
   // In a component with a skip link
   <a 
     href="#main-content" 
     className="skip-link"
     onClick={(e) => {
       e.preventDefault();
       skipToContent('main-content');
     }}
   >
     Skip to content
   </a>
   ```

## Continuous Improvement

Accessibility is an ongoing process. We should:

1. Run regular audits
2. Address issues promptly
3. Stay updated on best practices
4. Include accessibility in code reviews
5. Train team members on accessibility principles 