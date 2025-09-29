import React, { useRef } from 'react';
import { Box, Button, HStack, Input, IconButton, Tooltip } from '@chakra-ui/react';
import { Undo, Redo, Type, Image, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { HeadBar, HeaderLogo } from '../container';
import { useDispatch, useSelector } from 'react-redux';
import { parsePSDFromFile, convertPSDTOTemplate } from '../../functions/psd';
import { setActive as setActiveTemplate } from '../../store/templateSlice';
import { loadFromTemplate, undo, redo, selectCanUndo, selectCanRedo, selectCanvasInstance, loadFromJSON, updateObjects, deleteObject, changeObjectLayer, selectSelected } from '../../store/canvasSlice';

const Header = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);
  const canvas = useSelector(selectCanvasInstance);
  const selected = useSelector(selectSelected);

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

  const handleAddText = () => {
    if (!canvas) return;
    
    const text = new fabric.Textbox('Sample Text', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 20,
      fill: '#000000',
      name: `Text ${canvas.getObjects().length + 1}`
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    dispatch(updateObjects());
  };

  const handleAddImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target.result, (img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
          name: `Image ${canvas.getObjects().length + 1}`
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        dispatch(updateObjects());
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleMoveBack = () => {
    if (!selected || !canvas) return;
    dispatch(changeObjectLayer({ direction: 'back' }));
  };

  const handleMoveFront = () => {
    if (!selected || !canvas) return;
    dispatch(changeObjectLayer({ direction: 'front' }));
  };

  const handleDelete = () => {
    if (!selected || !canvas) return;
    dispatch(deleteObject());
  };

  return (
    <HeadBar>
      {/* Left Section */}
      <HStack spacing={4}>
        <HeaderLogo src="/logo.jpeg" alt="Logo" />
        <Box fontSize="lg" fontWeight="bold">
          PSD Editor
        </Box>
      </HStack>

      {/* Center Toolbar */}
      <HStack spacing={6} flex={1} justify="center">
        <Tooltip label="Add Text">
          <Box textAlign="center" cursor="pointer" onClick={handleAddText}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Type size={20} />}
              aria-label="Add Text"
              mb={1}
            />
            <Box fontSize="xs" color="gray.600">Text</Box>
          </Box>
        </Tooltip>

        <Tooltip label="Add Image">
          <Box textAlign="center" cursor="pointer" onClick={handleAddImage}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Image size={20} />}
              aria-label="Add Image"
              mb={1}
            />
            <Box fontSize="xs" color="gray.600">Image</Box>
          </Box>
        </Tooltip>

        <Tooltip label="Move to Back">
          <Box textAlign="center" cursor="pointer" onClick={handleMoveBack}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ArrowDown size={20} />}
              aria-label="Move to Back"
              isDisabled={!selected}
              mb={1}
            />
            <Box fontSize="xs" color={selected ? "gray.600" : "gray.400"}>Back</Box>
          </Box>
        </Tooltip>

        <Tooltip label="Move to Front">
          <Box textAlign="center" cursor="pointer" onClick={handleMoveFront}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ArrowUp size={20} />}
              aria-label="Move to Front"
              isDisabled={!selected}
              mb={1}
            />
            <Box fontSize="xs" color={selected ? "gray.600" : "gray.400"}>Front</Box>
          </Box>
        </Tooltip>

        <Tooltip label="Delete Selected">
          <Box textAlign="center" cursor="pointer" onClick={handleDelete}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Trash2 size={20} />}
              aria-label="Delete Selected"
              isDisabled={!selected}
              mb={1}
            />
            <Box fontSize="xs" color={selected ? "gray.600" : "gray.400"}>Delete</Box>
          </Box>
        </Tooltip>

        <Tooltip label="Undo">
          <Box textAlign="center" cursor="pointer" onClick={handleUndo}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Undo size={20} />}
              aria-label="Undo"
              isDisabled={!canUndo}
              mb={1}
            />
            <Box fontSize="xs" color={canUndo ? "gray.600" : "gray.400"}>Undo</Box>
          </Box>
        </Tooltip>

        <Tooltip label="Redo">
          <Box textAlign="center" cursor="pointer" onClick={handleRedo}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Redo size={20} />}
              aria-label="Redo"
              isDisabled={!canRedo}
              mb={1}
            />
            <Box fontSize="xs" color={canRedo ? "gray.600" : "gray.400"}>Redo</Box>
          </Box>
        </Tooltip>
      </HStack>

      {/* Right Section */}
      <HStack spacing={2}>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".psd"
          onChange={handleFileChange}
          display="none"
        />
        <Input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
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