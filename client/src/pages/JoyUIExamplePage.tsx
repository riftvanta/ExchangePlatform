import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateWalletFormJoy from '../components/ui/CreateWalletFormJoy';
import WithdrawUsdtFormJoy from '../components/ui/WithdrawUsdtFormJoy';
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
  Divider,
  DatePicker,
  FileUpload,
  Notification,
  NotificationContainer
} from '../components/ui';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleButtonClick = () => {
    if (inputValue.length < 3) {
      setInputError('Input must be at least 3 characters');
    } else {
      setInputError('');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (inputError && e.target.value.length >= 3) {
      setInputError('');
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    if (files.length > 0) {
      Notification.success(
        `${files.length} file${files.length > 1 ? 's' : ''} selected`,
        'Files ready for upload'
      );
    }
  };

  const showSuccessNotification = () => {
    Notification.success('Operation completed successfully', 'Success');
  };

  const showErrorNotification = () => {
    Notification.error('Something went wrong', 'Error');
  };

  const showInfoNotification = () => {
    Notification.info('This is an informational message');
  };

  const showWarningNotification = () => {
    Notification.warning('Please proceed with caution', 'Warning');
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
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <NotificationContainer />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography level="h1">Joy UI Components</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link to="/">
            <Button color="primary" variant="outlined">Back to Dashboard</Button>
          </Link>
          <Link to="/specialized-components">
            <Button color="primary" variant="outlined">View Specialized Components</Button>
          </Link>
          <Link to="/dashboard-legacy">
            <Button color="neutral" variant="outlined">View Legacy Dashboard</Button>
          </Link>
        </Box>
      </Box>
      
      {showAlert && (
        <Alert color="success" sx={{ mb: 4 }}>
          Form submitted successfully!
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Alerts</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert color="primary">This is a primary alert</Alert>
                <Alert color="neutral">This is a neutral alert</Alert>
                <Alert color="danger">This is a danger alert</Alert>
                <Alert color="success">This is a success alert</Alert>
                <Alert color="warning">This is a warning alert</Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Typography</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography level="h1">Heading 1</Typography>
                <Typography level="h2">Heading 2</Typography>
                <Typography level="h3">Heading 3</Typography>
                <Typography level="body-lg">Body Large</Typography>
                <Typography level="body-md">Body Medium</Typography>
                <Typography level="body-sm">Body Small</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Buttons</Typography>
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
      </Grid>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Table</Typography>
              <Table
                columns={userColumns}
                data={sampleUsers}
                borderAxis="x"
                hoverRow
                stickyHeader
                keyExtractor={(row) => row.id}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Tabs</Typography>
              <Tabs
                tabs={tabItems}
                defaultValue="create-wallet"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>DatePicker</Typography>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                helperText="Click to open the calendar"
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>File Upload</Typography>
              <FileUpload
                label="Upload Files"
                accept=".jpg,.jpeg,.png,.pdf"
                maxSize={5 * 1024 * 1024} // 5MB
                onFileSelect={handleFileSelect}
                buttonText="Select Files"
                dropzoneText="or drop files here"
                helperText="Max file size: 5MB"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Notifications</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button color="success" onClick={showSuccessNotification}>
                  Success Notification
                </Button>
                <Button color="danger" onClick={showErrorNotification}>
                  Error Notification
                </Button>
                <Button color="primary" onClick={showInfoNotification}>
                  Info Notification
                </Button>
                <Button color="warning" onClick={showWarningNotification}>
                  Warning Notification
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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