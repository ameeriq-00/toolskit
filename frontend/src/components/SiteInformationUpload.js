import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { styled } from '@mui/system';

const Input = styled('input')({
  display: 'none',
});

const SiteInformationUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-site-information/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('File uploaded successfully');
      } else {
        setUploadStatus('Error uploading file');
      }
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus('An error occurred');
    }
  };

  return (
    <Box>
      <Typography variant="h6">Upload Site Information</Typography>
      <Box mb={2}>
        <Input
          accept=".xlsx,.xls"
          id="site-information-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="site-information-file-input">
          <Button variant="contained" component="span">
            Select File
          </Button>
        </label>
        {file && <Typography>{file.name}</Typography>}
      </Box>
      <Button variant="contained" color="primary" onClick={handleUpload}>
        Upload
      </Button>
      {uploadStatus && <Typography mt={2}>{uploadStatus}</Typography>}
    </Box>
  );
};

export default SiteInformationUpload;
