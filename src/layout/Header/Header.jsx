
import React, { useRef } from 'react';
import { Box, Button, HStack, Input } from '@chakra-ui/react';
import { HeadBar, HeaderLogo } from '../container';
import { useDispatch } from 'react-redux';
import { parsePSDFromFile, convertPSDTOTemplate } from '../../functions/psd';
import { setActive as setActiveTemplate } from '../../store/templateSlice';
import { loadFromTemplate } from '../../store/canvasSlice';

const Header = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const handleImportPSD = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Parse PSD file
      const psd = await parsePSDFromFile(file);
      
      // Convert to template format
      const template = await convertPSDTOTemplate(psd);
      
      // Set as active template and load into canvas
      dispatch(setActiveTemplate(template));
      dispatch(loadFromTemplate(template));
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing PSD:', error);
      alert('Error importing PSD file. Please try again.');
    }
  };

  return (
    <HeadBar>
      <HStack spacing={4}>
        <HeaderLogo src="/logo.jpeg" alt="Logo" />
        <Box fontSize="lg" fontWeight="bold">
          PSD Editor
        </Box>
      </HStack>
      <HStack spacing={2}>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".psd"
          onChange={handleFileChange}
          display="none"
        />
        <Button size="sm" variant="outline" onClick={handleImportPSD}>
          Import PSD
        </Button>
        <Button size="sm" variant="outline">
          Export
        </Button>
        <Button size="sm" colorScheme="blue">
          Save
        </Button>
      </HStack>
    </HeadBar>
  );
};

export default Header;
