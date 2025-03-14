# Design System Guide

This guide provides practical examples and guidance for using our design system in development. It's a companion to the more detailed [Design System Documentation](./DESIGN_SYSTEM.md).

## Quick Start

1. **Install Dependencies**: 
   ```bash
   npm install class-variance-authority @headlessui/react @heroicons/react
   ```

2. **Import Components**:
   ```tsx
   import { Button, Input, Card, Select } from '../components/ui';
   ```

3. **Use Design Tokens through Tailwind**:
   ```tsx
   <div className="bg-primary-600 text-white p-4 rounded-lg">
     Using design tokens via Tailwind classes
   </div>
   ```

## Common UI Patterns

### 1. Building a Form

```tsx
import { Button, Input, Select, Checkbox } from '../components/ui';

export const SignupForm = () => {
  return (
    <form className="space-y-4">
      <Input
        label="Email Address"
        type="email"
        placeholder="your@email.com"
        required
      />
      
      <Input
        label="Password"
        type="password"
        helperText="Must be at least 8 characters"
        required
      />
      
      <Select
        label="Country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'mx', label: 'Mexico' }
        ]}
        placeholder="Select your country"
      />
      
      <Checkbox
        label="I agree to the terms and conditions"
        description="By checking this box, you agree to our Terms of Service and Privacy Policy."
      />
      
      <Button type="submit" fullWidth>
        Sign Up
      </Button>
    </form>
  );
};
```

### 2. Building a Card with Actions

```tsx
import { Card, CardHeader, CardBody, CardFooter, Button } from '../components/ui';

export const ProductCard = ({ product }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium">{product.name}</h3>
      </CardHeader>
      
      <CardBody>
        <p className="text-neutral-600 mb-4">{product.description}</p>
        <div className="flex items-center">
          <Badge variant="success">{product.category}</Badge>
          <span className="ml-auto font-bold">${product.price}</span>
        </div>
      </CardBody>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline">Details</Button>
        <Button>Add to Cart</Button>
      </CardFooter>
    </Card>
  );
};
```

### 3. Responsive Layout Pattern

```tsx
import { Card } from '../components/ui';

export const ResponsiveGrid = ({ items }) => {
  return (
    <div className="container mx-auto px-4">
      <h2 className="text-heading-2 mb-6">Featured Products</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <Card key={item.id} className="h-full">
            {/* Card content */}
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### 4. Alert and Notification Pattern

```tsx
import { Alert } from '../components/ui';

export const Notifications = () => {
  const [showAlert, setShowAlert] = useState(true);
  
  return (
    <div className="space-y-4">
      {showAlert && (
        <Alert 
          variant="info" 
          title="Welcome!"
          onDismiss={() => setShowAlert(false)}
        >
          This is your first time using our application.
        </Alert>
      )}
      
      <Alert variant="success" title="Payment Received">
        Your payment of $29.99 has been processed successfully.
      </Alert>
    </div>
  );
};
```

## Responsive Design Examples

### Mobile-First Approach

Always start with the mobile layout and then progressively enhance for larger screens:

```tsx
<div className="p-4 md:p-6 lg:p-8">
  {/* Content that gets more padding on larger screens */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Text that gets larger on bigger screens */}
</div>

<div className="flex flex-col md:flex-row">
  {/* Stack vertically on mobile, horizontally on tablet+ */}
</div>
```

### Responsive Navigation

```tsx
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="bg-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex space-x-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/products">Products</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden pt-4">
          <div className="flex flex-col space-y-2">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/products">Products</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
          </div>
        </div>
      )}
    </nav>
  );
};
```

## Accessibility Tips

1. **Always include focus states**: Our components have built-in focus states, but ensure custom elements have focus states too.

2. **Use semantic HTML**: Use the appropriate element for its purpose (buttons for actions, anchors for links).

3. **Add alt text to images**:
   ```tsx
   <img 
     src="/product.jpg" 
     alt="Red t-shirt with white logo" 
     className="w-full h-auto"
   />
   ```

4. **Hide elements visually but keep them accessible to screen readers**:
   ```tsx
   <span className="sr-only">Close menu</span>
   ```

5. **Ensure sufficient color contrast**: Use our predefined color tokens which are designed for good contrast.

## Theme Customization

Our design system is built to be customizable. You can customize aspects of the design in several places:

1. **CSS Variables**: Modify values in `src/styles/design-tokens.css` to change colors, spacing, etc.

2. **Tailwind Config**: Update `tailwind.config.js` to extend or override theme values

3. **Component Variants**: Components like Button, Badge, and Alert have variants that can be customized

## Performance Tips

1. **Use CSS variables for animations** to ensure smoother performance:
   ```css
   .animate-custom {
     transition: var(--transition-transform);
   }
   ```

2. **Lazy load components** that aren't needed on initial page load:
   ```tsx
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
   ```

3. **Use responsive images**:
   ```tsx
   <img 
     srcSet="/image-sm.jpg 480w, /image-md.jpg 768w, /image-lg.jpg 1024w" 
     sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw" 
     src="/image-md.jpg" 
     alt="Product"
   />
   ```

## Common Issues and Solutions

1. **Problem**: Component styling doesn't match the design system
   **Solution**: Make sure you're importing from the UI component library, not creating ad-hoc components.

2. **Problem**: Responsive layout breaks at certain widths
   **Solution**: Test with each breakpoint and ensure you're using mobile-first approach with responsive classes.

3. **Problem**: Colors don't match the design
   **Solution**: Use the color tokens from the design system (like `bg-primary-600`) rather than hardcoding colors.

---

For more detailed information, refer to the [full Design System Documentation](./DESIGN_SYSTEM.md) and the [Component Library README](../components/ui/README.md). 