import React, { useRef } from 'react';
import { Box, Button, HStack, Input, IconButton, Tooltip } from '@chakra-ui/react';
import { Undo, Redo } from 'lucide-react';
import { HeadBar, HeaderLogo } from '../container';
import { useDispatch, useSelector } from 'react-redux';
import { parsePSDFromFile, convertPSDTOTemplate } from '../../functions/psd';
import { setActive as setActiveTemplate } from '../../store/templateSlice';
import { loadFromTemplate, undo, redo, selectCanUndo, selectCanRedo, selectCanvasInstance, loadFromJSON, updateObjects } from '../../store/canvasSlice';

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
      await dispatch(loadFromTemplate(template));

      // Force update objects list after import
      setTimeout(() => {
        dispatch(updateObjects());
      }, 500);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing PSD:', error);
      alert('Error importing PSD file. Please try again.');
    }
  };

  const handleUndo = () => {
    if (!canvas || !canUndo) return;
    dispatch(undo());
  };

  const handleRedo = () => {
    if (!canvas || !canRedo) return;
    dispatch(redo());
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
        <HStack spacing={1}>
          <Tooltip label="Undo (Ctrl+Z)">
            <IconButton
              size="sm"
              variant="outline"
              icon={<Undo size={16} />}
              onClick={handleUndo}
              isDisabled={!canUndo}
              aria-label="Undo"
            />
          </Tooltip>
          <Tooltip label="Redo (Ctrl+Y)">
            <IconButton
              size="sm"
              variant="outline"
              icon={<Redo size={16} />}
              onClick={handleRedo}
              isDisabled={!canRedo}
              aria-label="Redo"
            />
          </Tooltip>
        </HStack>
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