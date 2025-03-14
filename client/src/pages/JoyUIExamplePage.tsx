import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateWalletFormJoy from '../components/ui/CreateWalletFormJoy';
import WithdrawUsdtFormJoy from '../components/ui/WithdrawUsdtFormJoy';

// Import our Joy UI components
import { 
  Typography, 
  Button, 
  Alert, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  FormControl,
  Input,
  Modal,
  Tabs,
  Table,
  TableColumn,
  Box,
  Sheet,
  Divider
} from '../components/ui';

// Define user type for table
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

// Sample data for table
const sampleUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Admin', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
];

// Table columns
const userColumns: TableColumn<User>[] = [
  { header: 'ID', accessor: 'id', width: '10%' },
  { header: 'Name', accessor: 'name', width: '30%' },
  { header: 'Email', accessor: 'email', width: '30%' },
  { header: 'Role', accessor: 'role', width: '15%' },
  { 
    header: 'Status', 
    accessor: (row: User) => (
      <Chip color={row.status === 'Active' ? 'success' : 'neutral'}>
        {row.status}
      </Chip>
    ),
    width: '15%',
    align: 'center'
  },
];

function JoyUIExamplePage() {
  const [showAlert, setShowAlert] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState<'basic' | 'form' | 'confirmation'>('basic');

  const handleButtonClick = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length < 3) {
      setInputError('Input must be at least 3 characters');
    } else {
      setInputError(undefined);
    }
  };

  const openModal = (variant: 'basic' | 'form' | 'confirmation') => {
    setModalVariant(variant);
    setModalOpen(true);
  };

  // Content for tabs
  const tabItems = [
    {
      label: 'Create Wallet',
      value: 'create-wallet',
      content: <CreateWalletFormJoy />
    },
    {
      label: 'Withdraw',
      value: 'withdraw',
      content: <WithdrawUsdtFormJoy />
    },
    {
      label: 'Users',
      value: 'users',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography level="h3" sx={{ mb: 2 }}>User Management</Typography>
          <Table
            columns={userColumns}
            data={sampleUsers}
            borderAxis="both"
            stickyHeader
          />
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography level="h1">Joy UI Examples</Typography>
        <Link to="/">
          <Button color="neutral" variant="outlined">Back to Dashboard</Button>
        </Link>
      </Box>

      {showAlert && (
        <Alert 
          color="success" 
          variant="soft" 
          sx={{ mb: 2 }}
          endDecorator={
            <Button 
              variant="soft" 
              color="success" 
              size="sm" 
              onClick={() => setShowAlert(false)}
            >
              Dismiss
            </Button>
          }
        >
          Button clicked successfully!
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Typography Examples</Typography>
              <Typography level="h1">Heading 1</Typography>
              <Typography level="h2">Heading 2</Typography>
              <Typography level="h3">Heading 3</Typography>
              <Typography level="body-lg">Body Large Text</Typography>
              <Typography level="body-md">Body Medium Text</Typography>
              <Typography level="body-sm">Body Small Text</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Button Examples</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Button>Default</Button>
                <Button color="primary">Primary</Button>
                <Button color="neutral">Neutral</Button>
                <Button color="danger">Danger</Button>
                <Button color="success">Success</Button>
                <Button color="warning">Warning</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Button variant="solid">Solid</Button>
                <Button variant="soft">Soft</Button>
                <Button variant="outlined">Outlined</Button>
                <Button variant="plain">Plain</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button loading>Loading</Button>
                <Button 
                  startDecorator={<span>🚀</span>}
                  endDecorator={<span>🎉</span>}
                >
                  With Decorators
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Form Controls</Typography>
              <FormControl 
                label="Example Input" 
                error={Boolean(inputError)}
                errorText={inputError}
                helperText="Enter at least 3 characters"
              >
                <Input
                  placeholder="Type something..."
                  value={inputValue}
                  onChange={handleInputChange}
                />
              </FormControl>
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleButtonClick}>Submit</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Chips & Alerts</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip>Default</Chip>
                <Chip color="primary">Primary</Chip>
                <Chip color="neutral">Neutral</Chip>
                <Chip color="danger">Danger</Chip>
                <Chip color="success">Success</Chip>
                <Chip color="warning">Warning</Chip>
              </Box>
              <Alert color="primary" sx={{ mb: 1 }}>This is an info alert</Alert>
              <Alert color="success" sx={{ mb: 1 }}>This is a success alert</Alert>
              <Alert color="warning" sx={{ mb: 1 }}>This is a warning alert</Alert>
              <Alert color="danger" sx={{ mb: 1 }}>This is a danger alert</Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal Examples */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography level="h2" sx={{ mb: 2 }}>Modal Examples</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={() => openModal('basic')}>Open Basic Modal</Button>
            <Button onClick={() => openModal('form')}>Open Form Modal</Button>
            <Button color="danger" onClick={() => openModal('confirmation')}>
              Open Confirmation Modal
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table Example */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography level="h2" sx={{ mb: 2 }}>Table Example</Typography>
          <Table
            columns={userColumns}
            data={sampleUsers}
            caption="User Management"
            borderAxis="both"
            stripe="odd"
            hoverRow
          />
        </CardContent>
      </Card>

      {/* Tabs Example */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography level="h2" sx={{ mb: 2 }}>Tabs Example</Typography>
          <Tabs tabs={tabItems} />
        </CardContent>
      </Card>

      <Sheet 
        variant="outlined" 
        sx={{ 
          borderRadius: 'md', 
          p: 3, 
          mb: 4,
          boxShadow: 'sm'
        }}
      >
        <Typography level="h2" sx={{ mb: 2 }}>Migrated Form Examples</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography level="h3" sx={{ mb: 2 }}>Create Wallet Form (Joy UI Version)</Typography>
        <CreateWalletFormJoy />
        <Divider sx={{ my: 3 }} />
        <Typography level="h3" sx={{ mb: 2 }}>Withdraw USDT Form (Joy UI Version)</Typography>
        <WithdrawUsdtFormJoy />
      </Sheet>

      {/* Modals */}
      <Modal
        open={modalOpen && modalVariant === 'basic'}
        onClose={() => setModalOpen(false)}
        title="Basic Modal"
      >
        <Typography>
          This is a basic modal dialog. You can use it to display information to the user.
          It can be closed by clicking the X button or clicking outside the modal.
        </Typography>
      </Modal>

      <Modal
        open={modalOpen && modalVariant === 'form'}
        onClose={() => setModalOpen(false)}
        title="Form Modal"
        footer={
          <>
            <Button variant="plain" color="neutral" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Submit</Button>
          </>
        }
      >
        <FormControl label="Name">
          <Input placeholder="Enter your name" />
        </FormControl>
        <FormControl label="Email">
          <Input placeholder="Enter your email" />
        </FormControl>
      </Modal>

      <Modal
        open={modalOpen && modalVariant === 'confirmation'}
        onClose={() => setModalOpen(false)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="plain" color="neutral" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button color="danger" onClick={() => setModalOpen(false)}>
              Confirm Deletion
            </Button>
          </>
        }
      >
        <Typography>
          Are you sure you want to delete this item? This action cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}

export default JoyUIExamplePage; 