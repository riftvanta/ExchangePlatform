import React, { useState, useCallback } from 'react';
import JoyTabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';
import { getJoyProps } from '../../styles/compatibility';

export interface TabItem {
  label: React.ReactNode;
  value: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AppTabsProps {
  className?: string;
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  color?: 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
  variant?: 'plain' | 'outlined' | 'soft' | 'solid';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A Joy UI based Tabs component for tabbed navigation
 * This component provides a standardized tabs interface with content panels
 */
export default function AppTabs({
  className,
  tabs,
  defaultValue,
  value: controlledValue,
  onChange,
  orientation = 'horizontal',
  color = 'primary',
  variant = 'soft',
  size = 'md',
  ...props
}: AppTabsProps) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);
  
  // If the component is uncontrolled, manage state internally
  // If controlled, use the provided value and onChange handler
  const [internalValue, setInternalValue] = useState(defaultValue || tabs[0]?.value || '');
  
  const handleChange = useCallback((_event: React.SyntheticEvent | null, newValue: string | number | null) => {
    if (onChange && typeof newValue === 'string') {
      onChange(newValue);
    } else if (typeof newValue === 'string') {
      setInternalValue(newValue);
    }
  }, [onChange]);
  
  // Use either controlled value or internal value
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;
  
  return (
    <JoyTabs
      aria-label="Tabs"
      defaultValue={defaultValue || tabs[0]?.value}
      value={activeValue}
      onChange={handleChange}
      orientation={orientation}
      {...joyProps}
      {...props}
    >
      <TabList
        color={color}
        variant={variant}
        size={size}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
      
      {tabs.map((tab) => (
        <TabPanel key={tab.value} value={tab.value}>
          {tab.content}
        </TabPanel>
      ))}
    </JoyTabs>
  );
} 