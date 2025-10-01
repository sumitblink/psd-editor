import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Text, 
  Input, 
  Select, 
  Grid, 
  InputGroup, 
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Lock, 
  Unlock,
  MoreHorizontal 
} from 'lucide-react';
import { Drawer } from '../container';
import { 
  selectSelected, 
  changeTextProperty, 
  changeImageProperty, 
  changeObjectDimensions, 
  changeFontFamily,
  toggleObjectLock,
  duplicateObject,
  deleteObject,
  updateObjects,
  selectCanvasInstance
} from '../../store/canvasSlice';

const PropertySidebar = () => {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelected);
  const canvas = useSelector(selectCanvasInstance);

  const handleTextChange = (property, value) => {
    if (property === 'fontFamily') {
      dispatch(changeFontFamily(value));
    } else {
      dispatch(changeTextProperty({ property, value }));
    }
  };

  const handleImageChange = (property, value) => {
    dispatch(changeImageProperty({ property, value }));
  };

  const handleObjectChange = (property, value) => {
    dispatch(changeObjectDimensions({ property, value }));
  };

  const handlePropertyChange = (property, value) => {
    if (selected.type === 'textbox') {
      handleTextChange(property, value);
    } else {
      handleImageChange(property, value);
    }
  };

  const toggleVisibility = () => {
    if (!canvas) return;
    const canvasObjects = canvas.getObjects();
    const targetObject = canvasObjects.find(obj => obj.name === selected.name);
    if (targetObject) {
      targetObject.set('visible', !targetObject.visible);
      canvas.renderAll();
      dispatch(updateObjects());
    }
  };

  if (!selected) {
    return (
      <Drawer>
        <Box p={4} borderBottom="1px solid" borderColor="gray.200">
          <Text fontSize="sm" fontWeight="bold" letterSpacing="wide" color="gray.600">
            LAYER
          </Text>
        </Box>
        <Box p={4}>
          <Text fontSize="sm" color="gray.500">
            Select an object to edit properties
          </Text>
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer>
      <Box p={3} borderBottom="1px solid" borderColor="gray.200">
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" fontWeight="bold" letterSpacing="wide" color="gray.600">
            LAYER
          </Text>
          <HStack spacing={2}>
            <IconButton
              icon={selected.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
              size="xs"
              variant="ghost"
              onClick={toggleVisibility}
              aria-label="Toggle visibility"
            />
            <IconButton
              icon={<Copy size={16} />}
              size="xs"
              variant="ghost"
              onClick={() => dispatch(duplicateObject())}
              aria-label="Duplicate"
            />
            <IconButton
              icon={<Trash2 size={16} />}
              size="xs"
              variant="ghost"
              onClick={() => dispatch(deleteObject())}
              aria-label="Delete"
            />
            <IconButton
              icon={selected.locked ? <Lock size={16} /> : <Unlock size={16} />}
              size="xs"
              variant="ghost"
              onClick={() => dispatch(toggleObjectLock(selected.name))}
              aria-label="Toggle lock"
            />
            <IconButton
              icon={<MoreHorizontal size={16} />}
              size="xs"
              variant="ghost"
              aria-label="More options"
            />
          </HStack>
        </HStack>
        
        <Text fontSize="xs" color="gray.500" mb={1}>Layer name</Text>
        <Input
          size="sm"
          value={selected.name || ''}
          onChange={(e) => handlePropertyChange('name', e.target.value)}
          borderRadius="lg"
          bg="white"
          fontSize="sm"
        />
      </Box>

      <Box p={3}>
        {/* Position - X and Y */}
        <Grid templateColumns="1fr 1fr" gap={2} mb={2}>
          <Box>
            <NumberInput
              value={Math.round(selected.left || 0)}
              onChange={(_, value) => handleObjectChange('left', value)}
              size="sm"
            >
              <NumberInputField 
                borderRadius="lg" 
                pl={8}
                fontSize="sm"
              />
              <InputLeftElement h="32px" pl={2} pointerEvents="none">
                <Text fontSize="xs" fontWeight="bold">X</Text>
              </InputLeftElement>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
          
          <Box>
            <NumberInput
              value={Math.round(selected.top || 0)}
              onChange={(_, value) => handleObjectChange('top', value)}
              size="sm"
            >
              <NumberInputField 
                borderRadius="lg" 
                pl={8}
                fontSize="sm"
              />
              <InputLeftElement h="32px" pl={2} pointerEvents="none">
                <Text fontSize="xs" fontWeight="bold">Y</Text>
              </InputLeftElement>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
        </Grid>

        {/* Size - Width and Height */}
        <Grid templateColumns="1fr 1fr" gap={2} mb={2}>
          <Box>
            <NumberInput
              value={Math.round(selected.width || 0)}
              onChange={(_, value) => handleObjectChange('width', value)}
              size="sm"
            >
              <NumberInputField 
                borderRadius="lg" 
                pl={8}
                fontSize="sm"
              />
              <InputLeftElement h="32px" pl={2} pointerEvents="none">
                <Text fontSize="xs" fontWeight="bold">↔</Text>
              </InputLeftElement>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
          
          <Box>
            <NumberInput
              value={Math.round(selected.height || 0)}
              onChange={(_, value) => handleObjectChange('height', value)}
              size="sm"
            >
              <NumberInputField 
                borderRadius="lg" 
                pl={8}
                fontSize="sm"
              />
              <InputLeftElement h="32px" pl={2} pointerEvents="none">
                <Text fontSize="xs" fontWeight="bold">↕</Text>
              </InputLeftElement>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
        </Grid>

        {/* Rotation and Opacity */}
        <Grid templateColumns="1fr 1fr" gap={2} mb={2}>
          <Box>
            <NumberInput
              value={Math.round(selected.angle || 0)}
              onChange={(_, value) => handleObjectChange('angle', value)}
              size="sm"
              min={0}
              max={360}
            >
              <NumberInputField 
                borderRadius="lg" 
                pl={8}
                fontSize="sm"
              />
              <InputLeftElement h="32px" pl={2} pointerEvents="none">
                <Text fontSize="xs" fontWeight="bold">↻</Text>
              </InputLeftElement>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
          
          <Box>
            <NumberInput
              value={Math.round((selected.opacity || 1) * 100)}
              onChange={(_, value) => handlePropertyChange('opacity', value / 100)}
              size="sm"
              min={0}
              max={100}
            >
              <NumberInputField 
                borderRadius="lg" 
                pl={8}
                pr={8}
                fontSize="sm"
              />
              <InputLeftElement h="32px" pl={2} pointerEvents="none">
                <Text fontSize="xs" fontWeight="bold">◐</Text>
              </InputLeftElement>
              <Box 
                position="absolute" 
                right={10} 
                top="50%" 
                transform="translateY(-50%)"
                pointerEvents="none"
                fontSize="xs"
                color="gray.500"
              >
                %
              </Box>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
        </Grid>

        {/* Text-specific properties */}
        {selected.type === 'textbox' && (
          <>
            <Box mb={2}>
              <Text fontSize="xs" color="gray.500" mb={1}>Font Family</Text>
              <Select
                size="sm"
                value={selected.fontFamily || 'Arial'}
                onChange={(e) => handleTextChange('fontFamily', e.target.value)}
                borderRadius="lg"
                fontSize="sm"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </Select>
            </Box>

            <Box mb={2}>
              <Text fontSize="xs" color="gray.500" mb={1}>Font Size</Text>
              <NumberInput
                value={selected.fontSize || 16}
                onChange={(_, value) => handleTextChange('fontSize', value)}
                size="sm"
              >
                <NumberInputField borderRadius="lg" fontSize="sm" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>

            <Box mb={2}>
              <Text fontSize="xs" color="gray.500" mb={1}>Text</Text>
              <Input
                size="sm"
                value={selected.text || ''}
                onChange={(e) => handleTextChange('text', e.target.value)}
                borderRadius="lg"
                fontSize="sm"
              />
            </Box>

            <Box mb={2}>
              <Text fontSize="xs" color="gray.500" mb={1}>Color</Text>
              <Input
                size="sm"
                type="color"
                value={selected.fill || '#000000'}
                onChange={(e) => handleTextChange('fill', e.target.value)}
                borderRadius="lg"
                h="32px"
              />
            </Box>
          </>
        )}

        {/* Shape-specific properties */}
        {(selected.type === 'rect' || selected.type === 'circle' || selected.type === 'triangle') && (
          <>
            <Box mb={2}>
              <Text fontSize="xs" color="gray.500" mb={1}>Fill Color</Text>
              <Input
                size="sm"
                type="color"
                value={selected.fill || '#3182ce'}
                onChange={(e) => handleImageChange('fill', e.target.value)}
                borderRadius="lg"
                h="32px"
              />
            </Box>

            {selected.type === 'circle' && (
              <Box mb={2}>
                <Text fontSize="xs" color="gray.500" mb={1}>Radius</Text>
                <NumberInput
                  value={Math.round(selected.radius || 0)}
                  onChange={(_, value) => handleImageChange('radius', value)}
                  size="sm"
                >
                  <NumberInputField borderRadius="lg" fontSize="sm" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default PropertySidebar;
