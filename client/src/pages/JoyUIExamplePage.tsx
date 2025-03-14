import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateWalletFormJoy from '../components/ui/CreateWalletFormJoy';

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
  Input
} from '../components/ui';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';

function JoyUIExamplePage() {
  const [showAlert, setShowAlert] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | undefined>(undefined);

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

      <Sheet 
        variant="outlined" 
        sx={{ 
          borderRadius: 'md', 
          p: 3, 
          mb: 4,
          boxShadow: 'sm'
        }}
      >
        <Typography level="h2" sx={{ mb: 2 }}>Create Wallet Form (Joy UI Version)</Typography>
        <CreateWalletFormJoy />
      </Sheet>
    </Box>
  );
}

export default JoyUIExamplePage; 