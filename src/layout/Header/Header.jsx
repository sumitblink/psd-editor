import React, { useRef } from 'react';
import { Box, Button, HStack, Input, IconButton, Tooltip, Menu, MenuButton, MenuList, MenuItem, ButtonGroup } from '@chakra-ui/react';
import { Undo, Redo, Type, Image, ArrowUp, ArrowDown, Trash2, Square, Circle, Triangle, ChevronDown, Shapes, Link2 } from 'lucide-react';
import { HeadBar, HeaderLogo } from '../container';
import { useDispatch, useSelector } from 'react-redux';
import { parsePSDFromFile, convertPSDTOTemplate } from '../../functions/psd';
import { setActive as setActiveTemplate, selectActiveTemplate, selectDataBindings, applyDataBindings } from '../../store/templateSlice';
import { loadFromTemplate, undoAction, redoAction, selectCanUndo, selectCanRedo, selectCanvasInstance, loadFromJSON, updateObjects, deleteObject, changeObjectLayer, selectSelected, addRectangle, addCircle, addTriangle, addText, addImage } from '../../store/canvasSlice';

const Header = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);
  const canvas = useSelector(selectCanvasInstance);
  const selected = useSelector(selectSelected);
  const template = useSelector(selectActiveTemplate);
  const dataBindings = useSelector(selectDataBindings);
  const toast = useToast();


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
    dispatch(undoAction());
  };

  const handleRedo = () => {
    if (!canvas || !canRedo) return;
    dispatch(redoAction());
  };

  const handleAddText = () => {
    if (!canvas) return;
    dispatch(addText({ text: 'Sample Text', options: { fill: '#000000', fontSize: 20 } }));
  };

  const handleAddImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      dispatch(addImage({ source: e.target.result, options: { width: 300, height: 300 } }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleMoveBack = () => {
    if (!selected || !canvas) return;
    dispatch(changeObjectLayer('back'));
  };

  const handleMoveFront = () => {
    if (!selected || !canvas) return;
    dispatch(changeObjectLayer('front'));
  };

  const handleDelete = () => {
    if (!selected || !canvas) return;
    dispatch(deleteObject());
  };

  const handleAddRectangle = () => {
    if (!canvas) return;
    dispatch(addRectangle({}));
  };

  const handleAddCircle = () => {
    if (!canvas) return;
    dispatch(addCircle({}));
  };

  const handleAddTriangle = () => {
    if (!canvas) return;
    dispatch(addTriangle({}));
  };

  const handleApplyTestData = () => {
    // Sample test data from the API response
    const testData = {
      id: "9561097167296403",
      name: "Amara Clutch Bag",
      price: "₹2,999.00",
      availability: "out of stock",
      image_url: "https://cdn.shopify.com/s/files/1/0704/1030/5849/products/02A.jpg?v=1680245758&width=713",
    };

    dispatch(applyDataBindings(testData));
    toast({
      title: 'Test data applied',
      description: 'Data bindings have been applied to layers',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDownload = () => {
    if (!canvas) return;
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

        <Menu>
          <Tooltip label="Add Shape">
            <Box textAlign="center">
              <MenuButton
                as={IconButton}
                size="sm"
                variant="ghost"
                icon={<Shapes size={20} />}
                aria-label="Add Shape"
                mb={1}
              />
              <Box fontSize="xs" color="gray.600">Shapes</Box>
            </Box>
          </Tooltip>
          <MenuList minW="150px">
            <MenuItem icon={<Square size={16} />} onClick={handleAddRectangle}>
              Rectangle
            </MenuItem>
            <MenuItem icon={<Circle size={16} />} onClick={handleAddCircle}>
              Circle
            </MenuItem>
            <MenuItem icon={<Triangle size={16} />} onClick={handleAddTriangle}>
              Triangle
            </MenuItem>
          </MenuList>
        </Menu>

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

        <ButtonGroup size="sm" variant="ghost">
          <IconButton icon={<Undo size={16} />} aria-label="Undo" onClick={handleUndo} isDisabled={!canUndo} />
          <IconButton icon={<Redo size={16} />} aria-label="Redo" onClick={handleRedo} isDisabled={!canRedo} />
        </ButtonGroup>

        {Object.keys(dataBindings).length > 0 && (
          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<Link2 size={16} />}
            onClick={handleApplyTestData}
          >
            Apply Test Data
          </Button>
        )}
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