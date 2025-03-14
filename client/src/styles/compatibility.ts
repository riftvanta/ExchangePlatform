// Define types for our mapping objects
interface JoyComponentMapping {
  component: string;
  props: Record<string, any>;
}

// Map existing CSS class names to Joy UI styling props
export const mapClassToJoy: Record<string, JoyComponentMapping> = {
  'button': {
    component: 'Button',
    props: { variant: 'solid', size: 'md', color: 'primary' }
  },
  'button text': {
    component: 'Button',
    props: { variant: 'plain', size: 'md', color: 'neutral' }
  },
  'button small': {
    component: 'Button',
    props: { variant: 'solid', size: 'sm', color: 'primary' }
  },
  'alert success': {
    component: 'Alert',
    props: { color: 'success', variant: 'soft' }
  },
  'alert error': {
    component: 'Alert',
    props: { color: 'danger', variant: 'soft' }
  },
  'alert warning': {
    component: 'Alert',
    props: { color: 'warning', variant: 'soft' }
  },
  'alert info': {
    component: 'Alert',
    props: { color: 'primary', variant: 'soft' }
  },
  'loading': {
    component: 'CircularProgress',
    props: { size: 'md', color: 'primary' }
  },
  'status success': {
    component: 'Chip',
    props: { color: 'success', variant: 'soft' }
  },
  'status error': {
    component: 'Chip',
    props: { color: 'danger', variant: 'soft' }
  },
  'status warning': {
    component: 'Chip',
    props: { color: 'warning', variant: 'soft' }
  },
  'status info': {
    component: 'Chip',
    props: { color: 'primary', variant: 'soft' }
  },
  'status success pill': {
    component: 'Chip',
    props: { color: 'success', variant: 'soft', size: 'sm' }
  },
  'status info pill': {
    component: 'Chip',
    props: { color: 'primary', variant: 'soft', size: 'sm' }
  },
  'form-group': {
    component: 'FormControl',
    props: { sx: { mb: 2 } }
  },
  'nav-link': {
    component: 'Link',
    props: { variant: 'plain', color: 'primary' }
  },
};

/**
 * Helper function to convert existing class names to Joy UI props
 * @param className The CSS class name to convert
 * @returns Equivalent Joy UI props
 */
export function getJoyProps(className: string | undefined): Record<string, any> {
  if (!className) return {};
  
  const classes = className.split(' ');
  let props: Record<string, any> = {};
  
  // First look for exact matches
  for (const fullClass of classes) {
    if (mapClassToJoy[fullClass]) {
      props = { ...props, ...mapClassToJoy[fullClass].props };
      return props; // Return on first exact match
    }
  }
  
  // Then look for partial matches
  for (const cls of classes) {
    for (const [key, value] of Object.entries(mapClassToJoy)) {
      if (key.includes(cls)) {
        props = { ...props, ...value.props };
      }
    }
  }
  
  return props;
}

/**
 * Helper function to get the equivalent Joy UI component for a CSS class
 * @param className The CSS class name
 * @returns The equivalent Joy UI component name
 */
export function getJoyComponent(className: string | undefined): string {
  if (!className) return 'div';
  
  const classes = className.split(' ');
  
  for (const cls of classes) {
    for (const [key, value] of Object.entries(mapClassToJoy)) {
      if (key.includes(cls)) {
        return value.component;
      }
    }
  }
  
  return 'div'; // Default fallback
} 