import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, Typography, Button, Card, CardContent, 
  Grid, DatePicker, FileUpload, Notification, NotificationContainer
} from '../components/ui';

function SpecializedComponentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <NotificationContainer />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography level="h1">Specialized Components</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link to="/dashboard-joy">
            <Button color="primary" variant="outlined">View Joy UI Dashboard</Button>
          </Link>
          <Link to="/joy-ui-examples">
            <Button color="neutral" variant="outlined">Back to Joy UI Examples</Button>
          </Link>
        </Box>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>DatePicker</Typography>
              <Typography level="body-md" sx={{ mb: 2 }}>
                A Joy UI styled DatePicker component using MUI X Date Pickers.
                This component provides a standardized date selection experience.
              </Typography>
              
              <DatePicker
                label="Basic DatePicker"
                value={selectedDate}
                onChange={handleDateChange}
                helperText="Click to open the calendar"
              />
              
              <Box sx={{ mt: 3 }}>
                <DatePicker
                  label="DatePicker with Min/Max Constraints"
                  value={selectedDate}
                  onChange={handleDateChange}
                  minDate={new Date(2023, 0, 1)}
                  maxDate={new Date(2025, 11, 31)}
                  helperText="Date range: Jan 1, 2023 - Dec 31, 2025"
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <DatePicker
                  label="Required DatePicker"
                  value={selectedDate}
                  onChange={handleDateChange}
                  required
                  format="yyyy-MM-dd"
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <DatePicker
                  label="Disabled DatePicker"
                  value={selectedDate}
                  onChange={handleDateChange}
                  disabled
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>FileUpload</Typography>
              <Typography level="body-md" sx={{ mb: 2 }}>
                A Joy UI styled FileUpload component with drag-and-drop support.
                This component provides a standardized file upload experience.
              </Typography>
              
              <FileUpload
                label="Basic FileUpload"
                onFileSelect={handleFileSelect}
                buttonText="Select File"
                dropzoneText="or drop file here"
              />
              
              <Box sx={{ mt: 4 }}>
                <FileUpload
                  label="Image Upload"
                  accept=".jpg,.jpeg,.png,.gif"
                  maxSize={2 * 1024 * 1024} // 2MB
                  onFileSelect={handleFileSelect}
                  buttonText="Select Image"
                  dropzoneText="or drop image here"
                  helperText="Accepted formats: JPG, JPEG, PNG, GIF. Max size: 2MB"
                />
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <FileUpload
                  label="Multiple Files Upload"
                  multiple
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={handleFileSelect}
                  buttonText="Select Multiple Files"
                  dropzoneText="or drop files here"
                  helperText="You can select multiple files. Max size: 10MB per file"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography level="h2" sx={{ mb: 2 }}>Notifications</Typography>
              <Typography level="body-md" sx={{ mb: 2 }}>
                A Joy UI styled Notification system using react-toastify.
                This component provides a standardized notification experience with various types and customization options.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography level="body-lg" sx={{ mb: 2 }}>Basic Notifications</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button color="success" onClick={showSuccessNotification}>
                          Success
                        </Button>
                        <Button color="danger" onClick={showErrorNotification}>
                          Error
                        </Button>
                        <Button color="primary" onClick={showInfoNotification}>
                          Info
                        </Button>
                        <Button color="warning" onClick={showWarningNotification}>
                          Warning
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography level="body-lg" sx={{ mb: 2 }}>Custom Notifications</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button 
                          onClick={() => Notification.info(
                            'This notification will close in 10 seconds',
                            'Auto Close',
                            { autoClose: 10000 }
                          )}
                        >
                          Auto Close (10s)
                        </Button>
                        <Button 
                          onClick={() => Notification.success(
                            'This notification appears at the bottom',
                            'Position',
                            { position: 'bottom-center' }
                          )}
                        >
                          Bottom Position
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography level="body-sm" sx={{ mt: 2, color: 'text.tertiary' }}>
                Note: Notifications can be customized with various options such as auto-close duration, position, and more.
                Check the component documentation for more details.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SpecializedComponentsPage; 