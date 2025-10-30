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
  Flex,
  Divider,
  Tooltip,
  Textarea
} from '@chakra-ui/react';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Lock, 
  Unlock,
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalSpaceAround
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
  selectCanvasInstance,
  selectDataBindings,
  setLayerDataBinding,
  applyDataBindings
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
  const dataBindings = useSelector(selectDataBindings);
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const textInputRef = useRef(null);

  // Available keys for autocomplete
  const availableKeys = selected?.type === 'image' 
    ? ['image_url', 'additional_image_urls.0', 'additional_image_urls.1']
    : ['name', 'price', 'offer', 'availability', 'id'];

  // Check if cursor is inside {{}} and show autocomplete
  const checkAutocomplete = (text, cursorPosition, preserveSelection = false) => {
    // Find the last {{ before cursor
    const beforeCursor = text.substring(0, cursorPosition);
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    
    if (lastOpenBrace === -1) {
      setShowAutocomplete(false);
      return;
    }
    
    // Check if there's a closing }} after the last {{
    const afterOpenBrace = text.substring(lastOpenBrace);
    const closeBraceIndex = afterOpenBrace.indexOf('}}');
    
    // Calculate if cursor is between {{ and }}
    const isBetweenBraces = closeBraceIndex !== -1 && (cursorPosition - lastOpenBrace) <= closeBraceIndex + 2;
    
    // If we're between {{ and }} or no closing brace yet
    if (isBetweenBraces || closeBraceIndex === -1) {
      const textAfterBrace = beforeCursor.substring(lastOpenBrace + 2);
      const prefix = textAfterBrace;
      
      // Filter keys that start with the prefix (show all if prefix is empty)
      const filtered = prefix === '' 
        ? availableKeys 
        : availableKeys.filter(key => 
            key.toLowerCase().startsWith(prefix.toLowerCase())
          );
      
      if (filtered.length > 0) {
        setCurrentPrefix(prefix);
        setFilteredKeys(filtered);
        // Only reset selectedIndex if not preserving selection
        if (!preserveSelection) {
          setSelectedIndex(0);
        }
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleTextChange = (property, value) => {
    if (property === 'fontFamily') {
      dispatch(changeFontFamily(value));
    } else if (property === 'text') {
      // Always update the binding template when text changes
      dispatch(setLayerDataBinding({ layerName: selected.name, apiKey: value }));
      
      // Always update the text on canvas immediately
      dispatch(changeTextProperty({ property, value }));
      
      // Check for autocomplete after state update
      if (textInputRef.current) {
        const cursorPosition = textInputRef.current.selectionStart;
        checkAutocomplete(value, cursorPosition);
      }
      
      // If there's binding data in localStorage, also re-render with it
      const savedData = localStorage.getItem('api_data');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          // Apply data bindings to re-render the template
          dispatch(applyDataBindings(data));
        } catch (error) {
          console.error('Error applying data bindings:', error);
        }
      }
    } else {
      dispatch(changeTextProperty({ property, value }));
    }
  };

  const insertAutocompleteKey = (key) => {
    if (!textInputRef.current || !selected) return;
    
    const currentText = dataBindings[selected.name] || selected.text || '';
    const cursorPosition = textInputRef.current.selectionStart;
    
    // Find the {{ before cursor
    const beforeCursor = currentText.substring(0, cursorPosition);
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    
    if (lastOpenBrace !== -1) {
      // Replace from {{ to cursor position with {{key}}
      const newText = currentText.substring(0, lastOpenBrace) + 
                     '{{' + key + '}}' + 
                     currentText.substring(cursorPosition);
      
      handleTextChange('text', newText);
      setShowAutocomplete(false);
      
      // Set cursor after the inserted {{key}}
      setTimeout(() => {
        if (textInputRef.current) {
          const newCursorPos = lastOpenBrace + 4 + key.length;
          textInputRef.current.selectionStart = newCursorPos;
          textInputRef.current.selectionEnd = newCursorPos;
          textInputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (!showAutocomplete) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex(prev => (prev + 1) % filteredKeys.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex(prev => (prev - 1 + filteredKeys.length) % filteredKeys.length);
    } else if (e.key === 'Enter' && filteredKeys.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      insertAutocompleteKey(filteredKeys[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowAutocomplete(false);
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

  // Alignment functions for multiple selection
  const handleAlign = (alignment) => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'activeSelection') return;

    const objects = activeObject.getObjects();
    if (objects.length < 2) return;

    // Calculate the bounds of all selected objects in absolute canvas coordinates
    const bounds = objects.reduce((acc, obj) => {
      const objLeft = obj.left + activeObject.left;
      const objTop = obj.top + activeObject.top;
      const objRight = objLeft + obj.width * obj.scaleX;
      const objBottom = objTop + obj.height * obj.scaleY;
      
      return {
        left: Math.min(acc.left, objLeft),
        top: Math.min(acc.top, objTop),
        right: Math.max(acc.right, objRight),
        bottom: Math.max(acc.bottom, objBottom)
      };
    }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });

    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    
    switch (alignment) {
      case 'left':
        objects.forEach(obj => {
          const currentAbsoluteLeft = obj.left + activeObject.left;
          obj.set('left', obj.left + (bounds.left - currentAbsoluteLeft));
        });
        break;
      case 'center-h':
        objects.forEach(obj => {
          const currentAbsoluteLeft = obj.left + activeObject.left;
          const objCenterOffset = (obj.width * obj.scaleX) / 2;
          obj.set('left', obj.left + (centerX - objCenterOffset - currentAbsoluteLeft));
        });
        break;
      case 'right':
        objects.forEach(obj => {
          const currentAbsoluteLeft = obj.left + activeObject.left;
          const objWidth = obj.width * obj.scaleX;
          obj.set('left', obj.left + (bounds.right - objWidth - currentAbsoluteLeft));
        });
        break;
      case 'top':
        objects.forEach(obj => {
          const currentAbsoluteTop = obj.top + activeObject.top;
          obj.set('top', obj.top + (bounds.top - currentAbsoluteTop));
        });
        break;
      case 'center-v':
        objects.forEach(obj => {
          const currentAbsoluteTop = obj.top + activeObject.top;
          const objCenterOffset = (obj.height * obj.scaleY) / 2;
          obj.set('top', obj.top + (centerY - objCenterOffset - currentAbsoluteTop));
        });
        break;
      case 'bottom':
        objects.forEach(obj => {
          const currentAbsoluteTop = obj.top + activeObject.top;
          const objHeight = obj.height * obj.scaleY;
          obj.set('top', obj.top + (bounds.bottom - objHeight - currentAbsoluteTop));
        });
        break;
    }

    activeObject.addWithUpdate();
    canvas.renderAll();
    dispatch(updateObjects());
  };

  const isMultipleSelection = selected && selected.type === 'activeSelection';

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
        
        {/* Alignment controls for multiple selection */}
        {isMultipleSelection && (
          <Box mb={3}>
            <HStack spacing={1} justify="center">
              <Tooltip label="Align Left">
                <IconButton
                  icon={<AlignLeft size={18} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAlign('left')}
                  aria-label="Align left"
                />
              </Tooltip>
              <Tooltip label="Align Center Horizontally">
                <IconButton
                  icon={<AlignCenter size={18} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAlign('center-h')}
                  aria-label="Align center horizontally"
                />
              </Tooltip>
              <Tooltip label="Align Right">
                <IconButton
                  icon={<AlignRight size={18} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAlign('right')}
                  aria-label="Align right"
                />
              </Tooltip>
              <Box w="1px" h="24px" bg="gray.300" mx={1} />
              <Tooltip label="Align Top">
                <IconButton
                  icon={<AlignVerticalSpaceAround size={18} style={{ transform: 'rotate(180deg)' }} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAlign('top')}
                  aria-label="Align top"
                />
              </Tooltip>
              <Tooltip label="Align Center Vertically">
                <IconButton
                  icon={<AlignVerticalJustifyCenter size={18} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAlign('center-v')}
                  aria-label="Align center vertically"
                />
              </Tooltip>
              <Tooltip label="Align Bottom">
                <IconButton
                  icon={<AlignVerticalSpaceAround size={18} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAlign('bottom')}
                  aria-label="Align bottom"
                />
              </Tooltip>
            </HStack>
            <Divider mt={3} />
          </Box>
        )}
        
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
            <Text fontSize="xs" fontWeight="bold" letterSpacing="wide" color="gray.600" mb={3}>
              APPEARANCE
            </Text>

            {/* Font Family */}
            <Box mb={2}>
              <Select
                size="sm"
                value={selected.fontFamily || 'Arial'}
                onChange={(e) => handleTextChange('fontFamily', e.target.value)}
                borderRadius="lg"
                fontSize="sm"
                h="40px"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </Select>
            </Box>

            {/* Font Weight */}
            <Box mb={2}>
              <Select
                size="sm"
                value={selected.fontWeight || 'normal'}
                onChange={(e) => handleTextChange('fontWeight', e.target.value)}
                borderRadius="lg"
                fontSize="sm"
                h="40px"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="100">Thin (100)</option>
                <option value="200">Extra Light (200)</option>
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi Bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800)</option>
                <option value="900">Black (900)</option>
              </Select>
            </Box>

            {/* Bold and Italic buttons */}
            <Grid templateColumns="1fr 1fr" gap={2} mb={2}>
              <IconButton
                icon={<Text fontWeight="bold" fontSize="md">B</Text>}
                size="md"
                variant={selected.fontWeight === 'bold' || selected.fontWeight === '700' ? 'solid' : 'outline'}
                colorScheme={selected.fontWeight === 'bold' || selected.fontWeight === '700' ? 'blue' : 'gray'}
                onClick={() => handleTextChange('fontWeight', selected.fontWeight === 'bold' ? 'normal' : 'bold')}
                aria-label="Bold"
                borderRadius="lg"
                h="40px"
              />
              <IconButton
                icon={<Text fontStyle="italic" fontSize="md">I</Text>}
                size="md"
                variant={selected.fontStyle === 'italic' ? 'solid' : 'outline'}
                colorScheme={selected.fontStyle === 'italic' ? 'blue' : 'gray'}
                onClick={() => handleTextChange('fontStyle', selected.fontStyle === 'italic' ? 'normal' : 'italic')}
                aria-label="Italic"
                borderRadius="lg"
                h="40px"
              />
            </Grid>

            {/* Font Size with increment/decrement */}
            <Box mb={2}>
              <Flex
                align="center"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                h="40px"
                overflow="hidden"
              >
                <Box px={3} fontWeight="bold" color="gray.600" fontSize="md">
                  TT
                </Box>
                <Input
                  value={selected.fontSize || 16}
                  onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value) || 16)}
                  type="number"
                  border="none"
                  h="38px"
                  fontSize="sm"
                  px={2}
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                  flex={1}
                />
                <Flex direction="column" borderLeft="1px solid" borderColor="gray.200">
                  <IconButton
                    icon={<Text fontSize="xs">▲</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleTextChange('fontSize', (selected.fontSize || 16) + 1)}
                    aria-label="Increase font size"
                    h="19px"
                    minW="30px"
                    borderRadius="0"
                    _hover={{ bg: 'gray.100' }}
                  />
                  <IconButton
                    icon={<Text fontSize="xs">▼</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleTextChange('fontSize', Math.max(1, (selected.fontSize || 16) - 1))}
                    aria-label="Decrease font size"
                    h="19px"
                    minW="30px"
                    borderRadius="0"
                    borderTop="1px solid"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.100' }}
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Letter Spacing */}
            <Box mb={2}>
              <Flex
                align="center"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                h="40px"
                overflow="hidden"
              >
                <Box px={3} fontWeight="bold" color="gray.600" fontSize="md">
                  ₮
                </Box>
                <Input
                  value={Math.round(selected.charSpacing || 0)}
                  onChange={(e) => handleTextChange('charSpacing', parseInt(e.target.value) || 0)}
                  type="number"
                  border="none"
                  h="38px"
                  fontSize="sm"
                  px={2}
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                  flex={1}
                />
                <Flex direction="column" borderLeft="1px solid" borderColor="gray.200">
                  <IconButton
                    icon={<Text fontSize="xs">▲</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleTextChange('charSpacing', (selected.charSpacing || 0) + 10)}
                    aria-label="Increase letter spacing"
                    h="19px"
                    minW="30px"
                    borderRadius="0"
                    _hover={{ bg: 'gray.100' }}
                  />
                  <IconButton
                    icon={<Text fontSize="xs">▼</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleTextChange('charSpacing', (selected.charSpacing || 0) - 10)}
                    aria-label="Decrease letter spacing"
                    h="19px"
                    minW="30px"
                    borderRadius="0"
                    borderTop="1px solid"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.100' }}
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Line Height */}
            <Box mb={2}>
              <Flex
                align="center"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                h="40px"
                overflow="hidden"
              >
                <Box px={3} fontWeight="bold" color="gray.600" fontSize="md">
                  Â
                </Box>
                <Input
                  value={selected.lineHeight || 1.16}
                  onChange={(e) => handleTextChange('lineHeight', parseFloat(e.target.value) || 1.16)}
                  type="number"
                  step="0.1"
                  border="none"
                  h="38px"
                  fontSize="sm"
                  px={2}
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                  flex={1}
                />
                <Flex direction="column" borderLeft="1px solid" borderColor="gray.200">
                  <IconButton
                    icon={<Text fontSize="xs">▲</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleTextChange('lineHeight', Math.round(((selected.lineHeight || 1.16) + 0.1) * 100) / 100)}
                    aria-label="Increase line height"
                    h="19px"
                    minW="30px"
                    borderRadius="0"
                    _hover={{ bg: 'gray.100' }}
                  />
                  <IconButton
                    icon={<Text fontSize="xs">▼</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleTextChange('lineHeight', Math.max(0.1, Math.round(((selected.lineHeight || 1.16) - 0.1) * 100) / 100))}
                    aria-label="Decrease line height"
                    h="19px"
                    minW="30px"
                    borderRadius="0"
                    borderTop="1px solid"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.100' }}
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Text Color */}
            <Box mb={2}>
              <Flex
                align="center"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                h="40px"
                overflow="hidden"
              >
                <Input
                  type="color"
                  value={selected.fill || '#000000'}
                  onChange={(e) => handleTextChange('fill', e.target.value)}
                  border="none"
                  h="38px"
                  w="full"
                  cursor="pointer"
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                />
              </Flex>
            </Box>

            {/* Text Alignment */}
            <HStack spacing={2} mb={2}>
              <IconButton
                icon={<AlignLeft size={18} />}
                size="md"
                variant={selected.textAlign === 'left' ? 'solid' : 'outline'}
                colorScheme={selected.textAlign === 'left' ? 'blue' : 'gray'}
                onClick={() => handleTextChange('textAlign', 'left')}
                aria-label="Align left"
                borderRadius="lg"
                flex={1}
                h="40px"
              />
              <IconButton
                icon={<AlignCenter size={18} />}
                size="md"
                variant={selected.textAlign === 'center' ? 'solid' : 'outline'}
                colorScheme={selected.textAlign === 'center' ? 'blue' : 'gray'}
                onClick={() => handleTextChange('textAlign', 'center')}
                aria-label="Align center"
                borderRadius="lg"
                flex={1}
                h="40px"
              />
              <IconButton
                icon={<AlignRight size={18} />}
                size="md"
                variant={selected.textAlign === 'right' ? 'solid' : 'outline'}
                colorScheme={selected.textAlign === 'right' ? 'blue' : 'gray'}
                onClick={() => handleTextChange('textAlign', 'right')}
                aria-label="Align right"
                borderRadius="lg"
                flex={1}
                h="40px"
              />
            </HStack>

            {/* Text Transform */}
            <HStack spacing={2} mb={2}>
              <Tooltip label="Dash">
                <IconButton
                  icon={<Text fontSize="md">—</Text>}
                  size="md"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {}}
                  aria-label="Dash"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
              <Tooltip label="Uppercase">
                <IconButton
                  icon={<Flex align="center"><Text fontSize="sm" fontWeight="bold">A</Text><Text fontSize="xs">↑</Text></Flex>}
                  size="md"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {
                    const upperText = (dataBindings[selected.name] || selected.text || '').toUpperCase();
                    handleTextChange('text', upperText);
                  }}
                  aria-label="Uppercase"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
              <Tooltip label="Lowercase">
                <IconButton
                  icon={<Flex align="center"><Text fontSize="sm">a</Text><Text fontSize="xs">↓</Text></Flex>}
                  size="md"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {
                    const lowerText = (dataBindings[selected.name] || selected.text || '').toLowerCase();
                    handleTextChange('text', lowerText);
                  }}
                  aria-label="Lowercase"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
              <Tooltip label="Title Case">
                <IconButton
                  icon={<Text fontSize="sm" fontWeight="medium">Tt</Text>}
                  size="md"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {
                    const titleText = (dataBindings[selected.name] || selected.text || '')
                      .toLowerCase()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    handleTextChange('text', titleText);
                  }}
                  aria-label="Title case"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
            </HStack>

            {/* Line Spacing Options */}
            <HStack spacing={2} mb={2}>
              <Tooltip label="Line spacing 1.0">
                <IconButton
                  icon={<Text fontSize="xl" lineHeight="1">≡</Text>}
                  size="md"
                  variant={selected.lineHeight === 1.0 ? 'solid' : 'outline'}
                  colorScheme={selected.lineHeight === 1.0 ? 'blue' : 'gray'}
                  onClick={() => handleTextChange('lineHeight', 1.0)}
                  aria-label="Line spacing tight"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
              <Tooltip label="Line spacing 1.5">
                <IconButton
                  icon={<Flex direction="column" align="center" justify="center" h="full"><Text fontSize="xs">↕</Text><Text fontSize="xs">*</Text></Flex>}
                  size="md"
                  variant={selected.lineHeight === 1.5 ? 'solid' : 'outline'}
                  colorScheme={selected.lineHeight === 1.5 ? 'blue' : 'gray'}
                  onClick={() => handleTextChange('lineHeight', 1.5)}
                  aria-label="Line spacing medium"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
              <Tooltip label="Line spacing 2.0">
                <IconButton
                  icon={<Text fontSize="xl" lineHeight="2">≡</Text>}
                  size="md"
                  variant={selected.lineHeight === 2.0 ? 'solid' : 'outline'}
                  colorScheme={selected.lineHeight === 2.0 ? 'blue' : 'gray'}
                  onClick={() => handleTextChange('lineHeight', 2.0)}
                  aria-label="Line spacing loose"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
            </HStack>

            {/* Vertical Alignment */}
            <HStack spacing={2} mb={2}>
              <Tooltip label="Align top">
                <IconButton
                  icon={<AlignVerticalSpaceAround size={18} style={{ transform: 'rotate(180deg)' }} />}
                  size="md"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {}}
                  aria-label="Vertical align top"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
              <Tooltip label="Align middle">
                <IconButton
                  icon={<AlignVerticalJustifyCenter size={18} />}
                  size="md"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {}}
                  aria-label="Vertical align middle"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
              <Tooltip label="Align bottom">
                <IconButton
                  icon={<AlignVerticalSpaceAround size={18} />}
                  size="md"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {}}
                  aria-label="Vertical align bottom"
                  borderRadius="lg"
                  h="40px"
                  flex={1}
                />
              </Tooltip>
            </HStack>

            {/* Underline and Strikethrough */}
            <HStack spacing={2} mb={2}>
              <IconButton
                icon={<Text fontSize="md" textDecoration="underline" fontWeight="bold">U</Text>}
                size="md"
                variant={selected.underline ? 'solid' : 'outline'}
                colorScheme={selected.underline ? 'blue' : 'gray'}
                onClick={() => handleTextChange('underline', !selected.underline)}
                aria-label="Underline"
                borderRadius="lg"
                h="40px"
                flex={1}
              />
              <IconButton
                icon={<Text fontSize="md" textDecoration="line-through" fontWeight="bold">S</Text>}
                size="md"
                variant={selected.linethrough ? 'solid' : 'outline'}
                colorScheme={selected.linethrough ? 'blue' : 'gray'}
                onClick={() => handleTextChange('linethrough', !selected.linethrough)}
                aria-label="Strikethrough"
                borderRadius="lg"
                h="40px"
                flex={1}
              />
            </HStack>

            <Divider my={3} />

            {/* Text Content */}
            <Box position="relative">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.500">Text</Text>
                <Tooltip label="Type {{ to insert variables" placement="top">
                  <Text fontSize="xs" color="blue.500" cursor="help">Insert variable</Text>
                </Tooltip>
              </HStack>
              <Textarea
                ref={textInputRef}
                size="sm"
                value={dataBindings[selected.name] || selected.text || ''}
                onChange={(e) => {
                  handleTextChange('text', e.target.value);
                  setTimeout(() => {
                    if (textInputRef.current) {
                      const cursorPosition = textInputRef.current.selectionStart;
                      checkAutocomplete(e.target.value, cursorPosition);
                    }
                  }, 0);
                }}
                onKeyDown={handleKeyDown}
                onClick={(e) => {
                  const cursorPosition = e.target.selectionStart;
                  checkAutocomplete(e.target.value, cursorPosition);
                }}
                onKeyUp={(e) => {
                  const isArrowKey = e.key === 'ArrowDown' || e.key === 'ArrowUp';
                  const cursorPosition = e.target.selectionStart;
                  checkAutocomplete(e.target.value, cursorPosition, isArrowKey);
                }}
                borderRadius="lg"
                fontSize="sm"
                minH="60px"
                resize="vertical"
              />
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && filteredKeys.length > 0 && (
                <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  mt={1}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  boxShadow="lg"
                  maxH="200px"
                  overflowY="auto"
                  zIndex={1000}
                >
                  {filteredKeys.map((key, index) => (
                    <Box
                      key={key}
                      px={3}
                      py={2}
                      cursor="pointer"
                      bg={index === selectedIndex ? 'blue.50' : 'white'}
                      color={index === selectedIndex ? 'blue.600' : 'gray.700'}
                      _hover={{ bg: 'blue.50', color: 'blue.600' }}
                      onClick={() => insertAutocompleteKey(key)}
                      fontSize="sm"
                    >
                      {key}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
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
