
import React, { useRef } from 'react';
import { Box, Button, HStack, Input } from '@chakra-ui/react';
import { HeadBar, HeaderLogo } from '../container';
import { useDispatch, useSelector } from 'react-redux';
import { parsePSDFromFile, convertPSDTOTemplate } from '../../functions/psd';
import { setActive as setActiveTemplate } from '../../store/templateSlice';
import { loadFromTemplate, selectCanUndo, selectCanRedo, selectCanvasInstance, loadFromJSON } from '../../store/canvasSlice';

const Header = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);
  const canvas = useSelector(selectCanvasInstance);

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

  const handleUndo = () => {
    if (!canvas || !canUndo) return;
    // Get the current state from canvas store
    const state = canvas.toObject();
    // Load previous state - this would need to be implemented in canvasSlice
    // For now, just trigger the undo action
    console.log('Undo clicked - implement undo logic');
  };

  const handleRedo = () => {
    if (!canvas || !canRedo) return;
    // Similar to undo, implement redo logic
    console.log('Redo clicked - implement redo logic');
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
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleUndo}
          isDisabled={!canUndo}
        >
          Undo
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRedo}
          isDisabled={!canRedo}
        >
          Redo
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
