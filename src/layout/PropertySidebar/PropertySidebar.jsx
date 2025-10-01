import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Text, 
  Input, 
  Select, 
  Grid, 
  HStack,
  IconButton,
  Flex
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

const CompactNumberInput = ({ label, value, onChange, icon, suffix }) => {
  return (
    <Flex
      align="center"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      bg="white"
      h="32px"
      fontSize="sm"
      overflow="hidden"
    >
      <Box
        px={2}
        fontWeight="bold"
        color="gray.600"
        fontSize="xs"
        minW="24px"
        textAlign="center"
      >
        {icon || label}
      </Box>
      <Input
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        type="number"
        border="none"
        h="30px"
        fontSize="sm"
        px={2}
        _focus={{ outline: 'none', boxShadow: 'none' }}
      />
      {suffix && (
        <Box px={2} color="gray.500" fontSize="xs">
          {suffix}
        </Box>
      )}
    </Flex>
  );
};

const DebouncedColorPicker = ({ value, onChange, label }) => {
  const [localColor, setLocalColor] = useState(value);
  const timeoutRef = useRef(null);

  // Update local color when prop changes
  useEffect(() => {
    setLocalColor(value);
  }, [value]);

  const handleColorChange = (newColor) => {
    setLocalColor(newColor);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the actual update
    timeoutRef.current = setTimeout(() => {
      onChange(newColor);
    }, 100);
  };

  const handleBlur = () => {
    // Immediately apply on blur
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onChange(localColor);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Box mb={2}>
      <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
      <Input
        size="sm"
        type="color"
        value={localColor}
        onChange={(e) => handleColorChange(e.target.value)}
        onBlur={handleBlur}
        borderRadius="lg"
        h="32px"
      />
    </Box>
  );
};

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
          <HStack spacing={1}>
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
          <CompactNumberInput
            icon="X"
            value={Math.round(selected.left || 0)}
            onChange={(value) => handleObjectChange('left', value)}
          />
          <CompactNumberInput
            icon="Y"
            value={Math.round(selected.top || 0)}
            onChange={(value) => handleObjectChange('top', value)}
          />
        </Grid>

        {/* Size - Width and Height */}
        <Grid templateColumns="1fr 1fr" gap={2} mb={2}>
          <CompactNumberInput
            icon="↔"
            value={Math.round(selected.width || 0)}
            onChange={(value) => handleObjectChange('width', value)}
          />
          <CompactNumberInput
            icon="↕"
            value={Math.round(selected.height || 0)}
            onChange={(value) => handleObjectChange('height', value)}
          />
        </Grid>

        {/* Rotation and Opacity */}
        <Grid templateColumns="1fr 1fr" gap={2} mb={2}>
          <CompactNumberInput
            icon="↻"
            value={Math.round(selected.angle || 0)}
            onChange={(value) => handleObjectChange('angle', value)}
          />
          <CompactNumberInput
            icon="◐"
            value={Math.round((selected.opacity || 1) * 100)}
            onChange={(value) => handlePropertyChange('opacity', value / 100)}
            suffix="%"
          />
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
              <Input
                size="sm"
                type="number"
                value={selected.fontSize || 16}
                onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value))}
                borderRadius="lg"
                fontSize="sm"
              />
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

            <DebouncedColorPicker
              label="Color"
              value={selected.fill || '#000000'}
              onChange={(color) => handleTextChange('fill', color)}
            />
          </>
        )}

        {/* Shape-specific properties */}
        {(selected.type === 'rect' || selected.type === 'circle' || selected.type === 'triangle') && (
          <>
            <DebouncedColorPicker
              label="Fill Color"
              value={selected.fill || '#3182ce'}
              onChange={(color) => handleImageChange('fill', color)}
            />

            {selected.type === 'circle' && (
              <Box mb={2}>
                <Text fontSize="xs" color="gray.500" mb={1}>Radius</Text>
                <Input
                  size="sm"
                  type="number"
                  value={Math.round(selected.radius || 0)}
                  onChange={(e) => handleImageChange('radius', parseInt(e.target.value))}
                  borderRadius="lg"
                  fontSize="sm"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default PropertySidebar;
