
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  VStack, 
  Text, 
  Input, 
  Select, 
  FormLabel, 
  FormControl, 
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  ColorPicker,
  useColorModeValue
} from '@chakra-ui/react';
import { Drawer } from '../container';
import { 
  selectSelected, 
  selectCanvasInstance,
  changeTextProperty, 
  changeImageProperty, 
  changeObjectDimensions,
  updateObjects
} from '../../store/canvasSlice';

const PropertySidebar = () => {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelected);
  const canvas = useSelector(selectCanvasInstance);
  
  // Local state for immediate UI updates
  const [localValues, setLocalValues] = useState({});
  
  // Update local values when selection changes
  useEffect(() => {
    if (selected) {
      setLocalValues({
        text: selected.text || '',
        fontSize: selected.fontSize || 20,
        fontFamily: selected.fontFamily || 'Times New Roman',
        fill: selected.fill || '#000000',
        left: Math.round(selected.left || 0),
        top: Math.round(selected.top || 0),
        width: Math.round(selected.width || 0),
        height: Math.round(selected.height || 0),
        opacity: selected.opacity || 1,
      });
    } else {
      setLocalValues({});
    }
  }, [selected?.name, selected?.type]); // Only update when selection changes, not on every property change

  // Debounced update function
  const debounceUpdate = useCallback((property, value, isTextProperty = false) => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    try {
      if (property === 'text' && isTextProperty) {
        activeObject.set('text', value);
        dispatch(changeTextProperty({ property, value }));
      } else if (property === 'fill' && isTextProperty) {
        activeObject.set('fill', value);
        dispatch(changeTextProperty({ property, value }));
      } else if (property === 'fontSize' && isTextProperty) {
        const numValue = parseInt(value) || 20;
        activeObject.set('fontSize', numValue);
        dispatch(changeTextProperty({ property, value: numValue }));
      } else if (property === 'fontFamily' && isTextProperty) {
        activeObject.set('fontFamily', value);
        dispatch(changeTextProperty({ property, value }));
      } else if (property === 'opacity') {
        activeObject.set('opacity', value);
        if (isTextProperty) {
          dispatch(changeTextProperty({ property, value }));
        } else {
          dispatch(changeImageProperty({ property, value }));
        }
      } else if (['left', 'top', 'width', 'height'].includes(property)) {
        const numValue = parseInt(value) || 0;
        
        if (property === 'left' || property === 'top') {
          activeObject.set(property, numValue);
        } else {
          // For width/height, use the dimension change handler
          dispatch(changeObjectDimensions({ property, value: numValue }));
          return; // Don't call renderAll again
        }
      }
      
      canvas.renderAll();
      dispatch(updateObjects());
    } catch (error) {
      console.error('Error updating property:', error);
    }
  }, [canvas, dispatch]);

  // Handle input changes with immediate local update and debounced canvas update
  const handleChange = useCallback((property, value, isTextProperty = false) => {
    // Update local state immediately for responsive UI
    setLocalValues(prev => ({ ...prev, [property]: value }));
    
    // Debounce the actual canvas update
    clearTimeout(handleChange.timeoutId);
    handleChange.timeoutId = setTimeout(() => {
      debounceUpdate(property, value, isTextProperty);
    }, 150); // 150ms debounce
  }, [debounceUpdate]);

  // Handle immediate changes (like sliders)
  const handleImmediateChange = useCallback((property, value, isTextProperty = false) => {
    setLocalValues(prev => ({ ...prev, [property]: value }));
    debounceUpdate(property, value, isTextProperty);
  }, [debounceUpdate]);

  if (!selected) {
    return (
      <Drawer>
        <Box p={4} textAlign="center" color="gray.500">
          <Text>Select an object to edit properties</Text>
        </Box>
      </Drawer>
    );
  }

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Drawer>
      <Box p={4} bg={bgColor} borderBottom="1px solid" borderColor={borderColor}>
        <Text fontSize="lg" fontWeight="semibold">Properties</Text>
      </Box>
      
      <Box p={4} overflowY="auto" flex={1}>
        <VStack spacing={4} align="stretch">
          
          {/* Type Display */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">Type</FormLabel>
            <Text fontSize="sm" color="gray.600" p={2} bg="gray.50" borderRadius="md">
              {selected.type}
            </Text>
          </FormControl>

          {/* Text Properties */}
          {selected.type === 'textbox' && (
            <>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Text</FormLabel>
                <Input
                  value={localValues.text || ''}
                  onChange={(e) => handleChange('text', e.target.value, true)}
                  placeholder="Enter text..."
                  size="sm"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Font Size</FormLabel>
                <Input
                  type="number"
                  value={localValues.fontSize || ''}
                  onChange={(e) => handleChange('fontSize', e.target.value, true)}
                  placeholder="Font size"
                  size="sm"
                  min="1"
                  max="500"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Font Family</FormLabel>
                <Select
                  value={localValues.fontFamily || ''}
                  onChange={(e) => handleChange('fontFamily', e.target.value, true)}
                  size="sm"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Montserrat">Montserrat</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Color</FormLabel>
                <Input
                  type="color"
                  value={localValues.fill || '#000000'}
                  onChange={(e) => handleChange('fill', e.target.value, true)}
                  size="sm"
                  h="40px"
                />
              </FormControl>
            </>
          )}

          {/* Position Properties */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">Left</FormLabel>
            <Input
              type="number"
              value={localValues.left || ''}
              onChange={(e) => handleChange('left', e.target.value)}
              placeholder="X position"
              size="sm"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">Top</FormLabel>
            <Input
              type="number"
              value={localValues.top || ''}
              onChange={(e) => handleChange('top', e.target.value)}
              placeholder="Y position"
              size="sm"
            />
          </FormControl>

          {/* Dimension Properties */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">Width</FormLabel>
            <Input
              type="number"
              value={localValues.width || ''}
              onChange={(e) => handleChange('width', e.target.value)}
              placeholder="Width"
              size="sm"
              min="1"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">Height</FormLabel>
            <Input
              type="number"
              value={localValues.height || ''}
              onChange={(e) => handleChange('height', e.target.value)}
              placeholder="Height"
              size="sm"
              min="1"
            />
          </FormControl>

          {/* Opacity Slider */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Opacity ({Math.round((localValues.opacity || 1) * 100)}%)
            </FormLabel>
            <Slider
              value={localValues.opacity || 1}
              onChange={(value) => handleImmediateChange('opacity', value, selected.type === 'textbox')}
              min={0}
              max={1}
              step={0.01}
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

        </VStack>
      </Box>
    </Drawer>
  );
};

export default PropertySidebar;
