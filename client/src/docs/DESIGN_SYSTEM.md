# Design System Documentation

This document outlines the design system for the USDT-JOD Exchange platform. It serves as a guide for consistent UI development across the application.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Typography](#typography)
3. [Colors](#colors)
4. [Spacing](#spacing)
5. [Components](#components)
6. [Responsive Design](#responsive-design)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Best Practices](#best-practices)

## Design Tokens

Design tokens are the visual design atoms of our design system. They are stored as CSS variables and used across the application to maintain consistency.

### Location

Design tokens are defined in:
- `client/src/styles/design-tokens.css` - Definition of all tokens as CSS variables
- `client/src/styles/utilities.css` - Utility classes based on these tokens
- `client/tailwind.config.js` - Integration with Tailwind CSS

## Typography

Our type system is designed to create clear hierarchies and ensure readability.

### Font Family

- **Primary Font**: System font stack (native to each device)
- **Monospace**: Used for code examples and technical information

### Font Sizes

We use a modular scale for consistent sizing:

- `--font-size-xs`: 0.75rem (12px) - Small captions, labels
- `--font-size-sm`: 0.875rem (14px) - Secondary text, metadata
- `--font-size-base`: 1rem (16px) - Body text
- `--font-size-lg`: 1.125rem (18px) - Large body text
- `--font-size-xl`: 1.25rem (20px) - Subheadings
- `--font-size-2xl`: 1.5rem (24px) - Small headings (h3, h4)
- `--font-size-3xl`: 1.875rem (30px) - Medium headings (h2)
- `--font-size-4xl`: 2.25rem (36px) - Large headings (h1)

### Usage

```jsx
// Using Tailwind classes
<h1 className="text-4xl font-bold">Heading 1</h1>
<p className="text-base">Body text</p>

// Using utility classes
<h2 className="text-heading-2">Heading 2</h2>
<p className="text-body">Body text</p>
```

## Colors

Our color system is designed to be accessible and cohesive. Each color has multiple shades to allow for flexibility and hierarchy.

### Primary Colors (Blue/Sky)

Used for primary actions, links, and focus states.

- Primary-50 to Primary-950: Sky blue scale

### Secondary Colors (Teal)

Used for secondary actions and highlights.

- Secondary-50 to Secondary-950: Teal scale

### Neutral Colors (Gray)

Used for text, backgrounds, and borders.

- Neutral-50 to Neutral-950: Gray scale

### Semantic Colors

- **Success**: Green shades for positive actions and confirmation
- **Warning**: Yellow shades for caution and alerts
- **Error**: Red shades for errors and critical issues

### Usage

```jsx
// Using Tailwind classes
<button className="bg-primary-600 text-white hover:bg-primary-700">
  Primary Action
</button>

<div className="bg-neutral-100 text-neutral-800">
  Content section
</div>

<div className="text-error-600">
  Error message
</div>
```

## Spacing

We use a consistent spacing scale throughout the application. Our spacing units are based on a 4px grid.

### Scale

- `--spacing-0`: 0px
- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-3`: 0.75rem (12px)
- `--spacing-4`: 1rem (16px)
- `--spacing-5`: 1.25rem (20px)
- `--spacing-6`: 1.5rem (24px)
- And so on...

### Usage

```jsx
// Using Tailwind classes
<div className="p-4 my-6">
  Content with 16px padding and 24px vertical margin
</div>

// Using utility classes
<div className="py-4 px-6">
  Content with different vertical and horizontal padding
</div>
```

## Components

Our component library is built with React, Tailwind CSS, and accessibility in mind.

### Core Components

1. **Button**
   - Primary, secondary, outline, and ghost variants
   - Multiple sizes from XS to XL
   - Support for icons, loading state, and disabled state

2. **Input**
   - Text inputs with labels, helper text, and error states
   - Support for left and right icons

3. **Select**
   - Dropdown selection built on Headless UI
   - Support for disabled options, error states, and custom styling

4. **Card**
   - Card container with optional header, body, and footer
   - Various elevation levels and border options

5. **Checkbox**
   - Accessible checkbox with label, description, and error states

6. **Badge**
   - Small labels for statuses and tags
   - Multiple variants and colors

7. **Alert**
   - Notification component with success, warning, and error variants
   - Support for dismiss functionality

8. **IconButton**
   - Button specifically for icon-only interactions
   - With proper aria-label for accessibility

### Component Usage

Each component is documented in the component library README file at `client/src/components/ui/README.md`.

## Responsive Design

Our application follows a mobile-first approach to ensure a great experience on all devices.

### Breakpoints

- **sm**: 640px - Small devices like phones
- **md**: 768px - Medium devices like tablets
- **lg**: 1024px - Large devices like laptops
- **xl**: 1280px - Extra large devices like desktops
- **2xl**: 1536px - Huge screens

### Responsive Utilities

```jsx
// Grid that adapts to screen size
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>

// Hiding elements on mobile
<div className="hidden md:block">
  Only visible on tablets and above
</div>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
  Padding increases with screen size
</div>
```

### Container Classes

Use the `.container` class for a responsive, centered container that adjusts its maximum width at each breakpoint.

```jsx
<div className="container mx-auto">
  Content with responsive width
</div>
```

## Accessibility Guidelines

Our design system is built with accessibility as a priority.

### Color Contrast

- Text colors meet WCAG AA standards (minimum 4.5:1 contrast for normal text, 3:1 for large text)
- Interactive elements have distinct focus states

### Keyboard Navigation

- All interactive elements are focusable and operable with keyboard
- Focus trapping in modals and dialogs

### Screen Readers

- Proper ARIA labels on interactive elements
- Semantic HTML structure

### Best Practices

- Use heading levels appropriately (h1-h6) to maintain document hierarchy
- Include alt text for all images
- Use the `sr-only` utility class for screen-reader-only content

## Best Practices

### Component Pattern Usage

1. **When to Use Cards**
   - For contained pieces of information with clear boundaries
   - For content that needs visual separation from the surrounding UI

2. **Button Hierarchy**
   - Primary buttons for main actions (Submit, Save)
   - Secondary buttons for alternative actions
   - Outline or ghost buttons for less important options

3. **Form Layout**
   - Group related form fields
   - Place labels above inputs for better readability
   - Use helper text to provide additional context
   - Display error messages close to the relevant input

### Responsive Implementation

1. **Mobile-First Approach**
   - Start with mobile layout and scale up
   - Use the smallest necessary breakpoint modifiers

2. **Flexible Layouts**
   - Use grid and flex layouts for responsive content
   - Avoid fixed widths that might break on smaller screens

### Performance Considerations

1. **CSS Efficiency**
   - Use Tailwind's utility classes for most styling
   - Create custom components for repeating patterns
   - Minimize nested CSS selectors

2. **Asset Optimization**
   - Use SVG icons when possible
   - Optimize images for web

---

## Contribution Guidelines

When extending the design system:

1. Update this documentation when adding new tokens or components
2. Ensure new components follow accessibility guidelines
3. Test components across different screen sizes
4. Document component usage with examples

---

*Last Updated: June 27, 2024* 