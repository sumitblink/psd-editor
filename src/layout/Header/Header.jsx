import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, HStack, Input, IconButton, Tooltip, Menu, MenuButton, MenuList, MenuItem, ButtonGroup, useToast, Text } from '@chakra-ui/react';
import { Undo, Redo, Type, Image, ArrowUp, ArrowDown, Trash2, Square, Circle, Triangle, ChevronDown, Shapes, Link2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { HeadBar, HeaderLogo } from '../container';
import { useDispatch, useSelector } from 'react-redux';
import { parsePSDFromFile, convertPSDTOTemplate } from '../../functions/psd';
import { setActive as setActiveTemplate, selectActiveTemplate } from '../../store/templateSlice';
import { loadFromTemplate, undoAction, redoAction, selectCanUndo, selectCanRedo, selectCanvasInstance, loadFromJSON, updateObjects, deleteObject, changeObjectLayer, selectSelected, addRectangle, addCircle, addTriangle, addText, addImage, selectDataBindings, applyDataBindings } from '../../store/canvasSlice';

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

  // Dummy product data - matches real API response structure
  const [productData, setProductData] = useState([
    {
      "id": "9561097167296403",
      "name": "Amara Clutch Bag",
      "price": "₹2,999.00",
      "offer": "15",
      "availability": "out of stock",
      "image_url": "https://cdn.shopify.com/s/files/1/0704/1030/5849/products/02A.jpg?v=1680245758&width=713",
      "retailer_id": "39",
      "image_cdn_urls": [],
      "additional_image_urls": [
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758778065409.jpg",
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758778089756.jpeg"
      ]
    },
    {
      "id": "9718709914836084",
      "name": "Clare Laptop Case",
      "price": "₹1,500.00",
      "offer": "25",
      "availability": "out of stock",
      "image_url": "https://cdn.shopify.com/s/files/1/0704/1030/5849/products/1_37d3cbf4-e790-4bba-8691-d4a757bba94a.webp?v=1673078290&width=713",
      "retailer_id": "46",
      "image_cdn_urls": [],
      "additional_image_urls": [
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758712378572.jpeg",
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758712403599.jpeg"
      ]
    },
    {
      "id": "9823456789012345",
      "name": "Bella Leather Wallet",
      "price": "₹899.00",
      "offer": "30",
      "availability": "in stock",
      "image_url": "https://cdn.shopify.com/s/files/1/0704/1030/5849/products/wallet-brown.jpg?v=1680245890&width=713",
      "retailer_id": "52",
      "image_cdn_urls": [],
      "additional_image_urls": [
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758712378572.jpeg",
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758712403599.jpeg"
      ]
    },
    {
      "id": "9934567890123456",
      "name": "Diana Crossbody Bag",
      "price": "₹3,499.00",
      "offer": "10",
      "availability": "in stock",
      "image_url": "https://cdn.shopify.com/s/files/1/0704/1030/5849/products/crossbody-black.webp?v=1680246012&width=713",
      "retailer_id": "58",
      "image_cdn_urls": [],
      "additional_image_urls": [
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758778065409.jpg",
        "https://forex-media-space.ams3.digitaloceanspaces.com/ai-video-files/6593d66d11ae13ea69d8c13d/files-1758778089756.jpeg"
      ]
    }
  ]);

  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const hasDataBindings = Object.keys(dataBindings).length > 0;

  // Auto-apply data when preview index changes
  useEffect(() => {
    if (hasDataBindings && productData.length > 0) {
      dispatch(applyDataBindings(productData[currentPreviewIndex]));
    }
  }, [currentPreviewIndex, hasDataBindings, productData, dispatch]);

  // Check image URLs for errors
  useEffect(() => {
    if (hasDataBindings && productData.length > 0) {
      const checkImageUrl = (url, index) => {
        const img = new Image();
        img.onload = () => {
          setImageErrors(prev => ({ ...prev, [index]: false }));
        };
        img.onerror = () => {
          setImageErrors(prev => ({ ...prev, [index]: true }));
        };
        img.src = url;
      };

      productData.forEach((product, index) => {
        // Check the bound image URL based on data bindings
        Object.entries(dataBindings).forEach(([layerName, binding]) => {
          if (binding.includes('additional_image_urls')) {
            const urlPath = binding.split('.');
            if (urlPath[0] === 'additional_image_urls' && product.additional_image_urls) {
              const imageIndex = parseInt(urlPath[1]);
              const imageUrl = product.additional_image_urls[imageIndex];
              if (imageUrl) {
                checkImageUrl(imageUrl, index);
              }
            }
          } else if (binding === 'image_url' && product.image_url) {
            checkImageUrl(product.image_url, index);
          }
        });
      });
    }
  }, [hasDataBindings, productData, dataBindings]);

  const handlePreviousPreview = () => {
    setCurrentPreviewIndex((prev) => (prev > 0 ? prev - 1 : productData.length - 1));
  };

  const handleNextPreview = () => {
    setCurrentPreviewIndex((prev) => (prev < productData.length - 1 ? prev + 1 : 0));
  };


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

  return (
    <HeadBar>
      {/* Left Section */}
      <HStack spacing={4}>
        <HeaderLogo src="/logo.jpeg" alt="Logo" />
        <Box fontSize="lg" fontWeight="bold">
          PSD Editor
        </Box>

        {/* Preview Carousel - Only show when data bindings exist */}
        {hasDataBindings && (
          <HStack 
            spacing={2} 
            ml={6} 
            px={4} 
            py={1} 
            bg="gray.100" 
            borderRadius="md"
            border="1px solid"
            borderColor="gray.300"
          >
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ChevronLeft size={16} />}
              onClick={handlePreviousPreview}
              aria-label="Previous preview"
            />
            <HStack spacing={2} minW="120px" justify="center">
              <Text fontSize="sm" fontWeight="medium">
                Preview
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="blue.600">
                {currentPreviewIndex + 1}
              </Text>
              <Text fontSize="sm" color="gray.500">
                of
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {productData.length}
              </Text>
            </HStack>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ChevronRight size={16} />}
              onClick={handleNextPreview}
              aria-label="Next preview"
            />
            {imageErrors[currentPreviewIndex] && (
              <Tooltip label="Image URL is broken or not found">
                <Box color="orange.500" display="flex" alignItems="center">
                  <AlertTriangle size={18} />
                </Box>
              </Tooltip>
            )}
          </HStack>
        )}
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