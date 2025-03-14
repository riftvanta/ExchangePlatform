import React, { useState, useRef } from 'react';
import { Box, Button, FormControl, Typography, Alert } from './index';
import FormLabel from '@mui/joy/FormLabel';
import FormHelperText from '@mui/joy/FormHelperText';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { getJoyProps } from '../../styles/compatibility';

interface FileUploadProps {
  className?: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  required?: boolean;
  error?: boolean;
  errorText?: string;
  helperText?: string;
  onFileSelect: (files: File[]) => void;
  buttonText?: string;
  dropzoneText?: string;
}

/**
 * A Joy UI styled FileUpload component
 * This component provides a standardized file upload experience with drag-and-drop support
 */
export default function AppFileUpload({
  className,
  label,
  accept = '*/*',
  multiple = false,
  maxSize,
  required = false,
  error = false,
  errorText,
  helperText,
  onFileSelect,
  buttonText = 'Select File',
  dropzoneText = 'or drop files here',
  ...props
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const fileList = Array.from(files);
    validateAndSetFiles(fileList);
  };

  const validateAndSetFiles = (files: File[]) => {
    setInternalError(null);
    
    // Validate file size if maxSize is provided
    if (maxSize) {
      const oversizedFiles = files.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        setInternalError(`Some files exceed the maximum size limit of ${formatFileSize(maxSize)}`);
        return;
      }
    }
    
    setSelectedFiles(files);
    onFileSelect(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    // Filter files based on accept attribute if specified
    let fileList = Array.from(files);
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      fileList = fileList.filter(file => {
        return acceptedTypes.some(type => {
          // Handle mime types with wildcards (e.g., "image/*")
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(`${category}/`);
          }
          // Handle file extensions (e.g., ".pdf")
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          // Handle exact mime types (e.g., "application/pdf")
          return file.type === type;
        });
      });
      
      if (fileList.length === 0) {
        setInternalError(`Only ${accept} files are accepted`);
        return;
      }
    }
    
    // If multiple is false, only take the first file
    if (!multiple && fileList.length > 1) {
      fileList = [fileList[0]];
    }
    
    validateAndSetFiles(fileList);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Combine user-provided error and internal validation error
  const hasError = error || !!internalError;
  const displayErrorText = internalError || errorText;

  return (
    <FormControl
      error={hasError}
      sx={{ mb: 2, width: '100%' }}
      {...joyProps}
    >
      {label && <FormLabel>{label}{required && ' *'}</FormLabel>}
      
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : hasError ? 'danger.main' : 'neutral.outlinedBorder',
          borderRadius: 'md',
          p: 3,
          textAlign: 'center',
          transition: 'all 0.2s',
          backgroundColor: isDragging ? 'primary.softBg' : 'background.surface',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'neutral.softBg',
          },
        }}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
        />
        
        <CloudUploadIcon sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
        <Typography level="body-md" sx={{ mb: 1 }}>{buttonText}</Typography>
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{dropzoneText}</Typography>
        
        {accept !== '*/*' && (
          <Typography level="body-xs" sx={{ mt: 1, color: 'text.tertiary' }}>
            Accepted formats: {accept}
          </Typography>
        )}
        
        {maxSize && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            Max size: {formatFileSize(maxSize)}
          </Typography>
        )}
      </Box>
      
      {/* Display selected files */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography level="body-sm" sx={{ mb: 1 }}>Selected files:</Typography>
          {selectedFiles.map((file, index) => (
            <Box
              key={`${file.name}-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                mb: 1,
                borderRadius: 'sm',
                backgroundColor: 'background.surface',
                border: '1px solid',
                borderColor: 'neutral.outlinedBorder',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography level="body-sm">{file.name}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="plain"
                color="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                sx={{ minWidth: 'auto', p: 1 }}
              >
                <HighlightOffIcon />
              </Button>
            </Box>
          ))}
        </Box>
      )}
      
      {(helperText || (hasError && displayErrorText)) && (
        <FormHelperText>{hasError ? displayErrorText : helperText}</FormHelperText>
      )}
    </FormControl>
  );
} 