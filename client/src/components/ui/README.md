# UI Component Library

This directory contains a set of reusable UI components built with React, Tailwind CSS, and Headless UI. The components are designed to be accessible, customizable, and consistent with the application's design system.

## Installation

The component library uses the following dependencies:

- `class-variance-authority`: For component variants
- `@headlessui/react`: For accessible UI primitives
- `@heroicons/react`: For consistent iconography

Make sure these dependencies are installed:

```bash
npm install class-variance-authority @headlessui/react @heroicons/react
```

## Available Components

### Button

A versatile button component with multiple variants, sizes, and states.

```tsx
import { Button } from './components/ui';

// Basic usage
<Button>Default Button</Button>

// Variants
<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="success">Success Button</Button>
<Button variant="warning">Warning Button</Button>
<Button variant="error">Error Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// States
<Button loading>Loading</Button>
<Button disabled>Disabled</Button>

// With icons
<Button leftIcon={<Icon />}>With Left Icon</Button>
<Button rightIcon={<Icon />}>With Right Icon</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Input

A flexible input component with support for labels, icons, and validation states.

```tsx
import { Input } from './components/ui';

// Basic usage
<Input 
  label="Email" 
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With helper text
<Input 
  label="Username" 
  helperText="Your username must be 5-20 characters"
/>

// With error
<Input 
  label="Password" 
  type="password"
  error="Password is required"
/>

// With icons
<Input 
  label="Search" 
  leftIcon={<SearchIcon />}
/>
<Input 
  label="Website" 
  rightIcon={<LinkIcon />}
/>

// Disabled
<Input 
  label="Read Only Field" 
  disabled
/>

// Full width
<Input 
  label="Full Width" 
  fullWidth
/>
```

### Select

A dropdown select component built with Headless UI for accessibility.

```tsx
import { Select } from './components/ui';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4 (Disabled)', disabled: true }
];

// Basic usage
<Select
  label="Select an option"
  options={options}
  value={selectedValue}
  onChange={setValue}
/>

// With helper text
<Select
  label="Select Country"
  options={countries}
  helperText="Select your country of residence"
  value={country}
  onChange={setCountry}
/>

// With error
<Select
  label="Select Role"
  options={roles}
  error="Please select a role"
  value={role}
  onChange={setRole}
/>

// Disabled
<Select
  label="Disabled Select"
  options={options}
  disabled
  value=""
  onChange={() => {}}
/>
```

### Card

A card component with optional header and footer sections.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from './components/ui';

// Basic usage
<Card>
  <CardBody>
    Card content goes here
  </CardBody>
</Card>

// With header and footer
<Card>
  <CardHeader>
    Card Title
  </CardHeader>
  <CardBody>
    Card content goes here
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Checkbox

An accessible checkbox component with support for labels and descriptions.

```tsx
import { Checkbox } from './components/ui';

// Basic usage
<Checkbox 
  label="Accept terms" 
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>

// With description
<Checkbox 
  label="Subscribe to newsletter" 
  description="Receive weekly updates about our products"
  checked={isSubscribed}
  onChange={(e) => setIsSubscribed(e.target.checked)}
/>

// With error
<Checkbox 
  label="Agree to terms" 
  error="You must agree to the terms"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>

// Disabled
<Checkbox 
  label="Disabled option" 
  disabled
  checked={false}
/>
```

### Badge

A small indicator component for highlighting status, tags, or counts.

```tsx
import { Badge } from './components/ui';

// Basic usage
<Badge>Default</Badge>

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="neutral">Neutral</Badge>

// Outline style
<Badge outline>Outline</Badge>
<Badge variant="success" outline>Success Outline</Badge>
```

### Alert

A notification component for displaying information, success, warning, or error messages.

```tsx
import { Alert } from './components/ui';

// Basic usage
<Alert>
  This is a default alert
</Alert>

// Variants
<Alert variant="info">Information alert</Alert>
<Alert variant="success">Success alert</Alert>
<Alert variant="warning">Warning alert</Alert>
<Alert variant="error">Error alert</Alert>

// With title
<Alert variant="info" title="Information">
  This is an information alert with a title
</Alert>

// Dismissible
<Alert 
  variant="success" 
  title="Success"
  onDismiss={() => setShowAlert(false)}
>
  This alert can be dismissed
</Alert>

// Custom icon
<Alert 
  variant="info"
  icon={<CustomIcon />}
>
  This alert has a custom icon
</Alert>
```

### IconButton

A button component specifically designed for icon-only buttons.

```tsx
import { IconButton } from './components/ui';
import { PlusIcon } from '@heroicons/react/20/solid';

// Basic usage
<IconButton 
  icon={<PlusIcon className="h-5 w-5" />} 
  label="Add item"
/>

// Variants
<IconButton 
  icon={<EditIcon className="h-5 w-5" />} 
  variant="primary" 
  label="Edit item"
/>
<IconButton 
  icon={<TrashIcon className="h-5 w-5" />} 
  variant="error" 
  label="Delete item"
/>
<IconButton 
  icon={<InfoIcon className="h-5 w-5" />} 
  variant="outline" 
  label="View information"
/>
```

## Customization

The components are built using Tailwind CSS, so they can be easily customized by modifying the Tailwind configuration file (`tailwind.config.js`). The components use CSS variables defined in the theme.css file, which can be updated to change the appearance of the components.

For more complex customizations, you can modify the component source code directly. 