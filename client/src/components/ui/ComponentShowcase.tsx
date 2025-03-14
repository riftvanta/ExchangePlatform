import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Select,
  Checkbox,
  Badge,
  Alert,
  IconButton
} from './';
import { 
  CheckIcon, 
  ChevronRightIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  PlusIcon 
} from '@heroicons/react/20/solid';

export const ComponentShowcase = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4 (Disabled)', disabled: true }
  ];

  return (
    <div className="p-6 space-y-10">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="success">Success Button</Button>
          <Button variant="warning">Warning Button</Button>
          <Button variant="error">Error Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
          <Button variant="primary" loading>Loading Button</Button>
          <Button variant="primary" disabled>Disabled Button</Button>
          <Button variant="primary" leftIcon={<CheckIcon className="h-4 w-4" />}>
            With Left Icon
          </Button>
          <Button variant="primary" rightIcon={<ChevronRightIcon className="h-4 w-4" />}>
            With Right Icon
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Icon Buttons</h2>
        <div className="flex flex-row gap-4">
          <IconButton icon={<PlusIcon className="h-5 w-5" />} variant="primary" label="Add item" />
          <IconButton icon={<CheckIcon className="h-5 w-5" />} variant="success" label="Confirm" />
          <IconButton icon={<InformationCircleIcon className="h-5 w-5" />} variant="outline" label="Information" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Basic Input"
            placeholder="Enter some text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input 
            label="With Helper Text"
            placeholder="Enter some text"
            helperText="This is some helpful information about this field"
          />
          <Input 
            label="With Error"
            placeholder="Enter some text"
            error="This field has an error"
          />
          <Input 
            label="With Left Icon"
            placeholder="Search..."
            leftIcon={<InformationCircleIcon className="h-5 w-5" />}
          />
          <Input 
            label="With Right Icon"
            placeholder="Enter email address"
            rightIcon={<CheckIcon className="h-5 w-5" />}
          />
          <Input 
            label="Disabled Input"
            placeholder="This input is disabled"
            disabled
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Select</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Basic Select"
            options={selectOptions}
            value={selectValue}
            onChange={setSelectValue}
          />
          <Select
            label="With Helper Text"
            options={selectOptions}
            value={selectValue}
            onChange={setSelectValue}
            helperText="Select an option from the list"
          />
          <Select
            label="With Error"
            options={selectOptions}
            value={selectValue}
            onChange={setSelectValue}
            error="Please select a valid option"
          />
          <Select
            label="Disabled Select"
            options={selectOptions}
            value={selectValue}
            onChange={setSelectValue}
            disabled
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Checkboxes</h2>
        <div className="space-y-4">
          <Checkbox
            label="Basic Checkbox"
            checked={checkboxValue}
            onChange={(e) => setCheckboxValue(e.target.checked)}
          />
          <Checkbox
            label="With Description"
            description="This is some additional information about this checkbox"
            checked={checkboxValue}
            onChange={(e) => setCheckboxValue(e.target.checked)}
          />
          <Checkbox
            label="With Error"
            error="This checkbox has an error"
            checked={checkboxValue}
            onChange={(e) => setCheckboxValue(e.target.checked)}
          />
          <Checkbox
            label="Disabled Checkbox"
            disabled
            checked={checkboxValue}
            onChange={(e) => setCheckboxValue(e.target.checked)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Card Title</h3>
            </CardHeader>
            <CardBody>
              <p>This is the content of the card. You can put any elements here.</p>
            </CardBody>
            <CardFooter>
              <Button variant="primary" size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardBody>
              <p>This card has only a body section without header or footer.</p>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge outline>Outline</Badge>
          <Badge variant="success" outline>Success Outline</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Alerts</h2>
        <div className="space-y-4">
          {showAlert && (
            <Alert 
              variant="info" 
              title="Information"
              onDismiss={() => setShowAlert(false)}
            >
              This is an information alert with a dismiss button.
            </Alert>
          )}
          <Alert variant="success" title="Success">
            Your action was completed successfully.
          </Alert>
          <Alert variant="warning" title="Warning">
            This action might have some consequences.
          </Alert>
          <Alert variant="error" title="Error">
            An error occurred while processing your request.
          </Alert>
          <Alert 
            variant="info"
            icon={<ExclamationCircleIcon className="h-5 w-5 text-blue-700" />}
          >
            This alert has a custom icon.
          </Alert>
        </div>
      </section>
    </div>
  );
}; 