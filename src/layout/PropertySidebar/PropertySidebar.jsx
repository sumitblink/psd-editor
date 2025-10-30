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
  Tooltip
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
  const checkAutocomplete = (text, cursorPosition) => {
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
    
    // If we're between {{ and }} or no closing brace yet
    if (closeBraceIndex === -1 || closeBraceIndex > (cursorPosition - lastOpenBrace)) {
      const textAfterBrace = beforeCursor.substring(lastOpenBrace + 2);
      const prefix = textAfterBrace;
      
      // Filter keys that start with the prefix
      const filtered = availableKeys.filter(key => 
        key.toLowerCase().startsWith(prefix.toLowerCase())
      );
      
      if (filtered.length > 0) {
        setCurrentPrefix(prefix);
        setFilteredKeys(filtered);
        setSelectedIndex(0);
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
      // Auto-close brackets first
      if (textInputRef.current) {
        const cursorPosition = textInputRef.current.selectionStart;
        
        if (value.endsWith('{{') && !value.endsWith('{{}}')) {
          const newValue = value + '}}';
          dispatch(setLayerDataBinding({ layerName: selected.name, apiKey: newValue }));
          dispatch(changeTextProperty({ property, value: newValue }));
          
          // Set cursor between braces and show autocomplete
          setTimeout(() => {
            if (textInputRef.current) {
              textInputRef.current.selectionStart = cursorPosition;
              textInputRef.current.selectionEnd = cursorPosition;
              checkAutocomplete(newValue, cursorPosition);
            }
          }, 0);
          return;
        }
      }
      
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
      const newText = currentText.substring(0, lastOpenBrace + 2) + 
                     key + 
                     '}}' + 
                     currentText.substring(cursorPosition);
      
      handleTextChange('text', newText);
      setShowAutocomplete(false);
      
      // Set cursor after the inserted key
      setTimeout(() => {
        if (textInputRef.current) {
          const newCursorPos = lastOpenBrace + 2 + key.length + 2;
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
      setSelectedIndex(prev => (prev + 1) % filteredKeys.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredKeys.length) % filteredKeys.length);
    } else if (e.key === 'Enter' && filteredKeys.length > 0) {
      e.preventDefault();
      insertAutocompleteKey(filteredKeys[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
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

            <Box mb={2} position="relative">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.500">Text</Text>
                <Tooltip label="Type {{ to insert variables" placement="top">
                  <Text fontSize="xs" color="blue.500" cursor="help">Insert variable</Text>
                </Tooltip>
              </HStack>
              <Input
                ref={textInputRef}
                size="sm"
                value={dataBindings[selected.name] || selected.text || ''}
                onChange={(e) => handleTextChange('text', e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => {
                  const cursorPosition = e.target.selectionStart;
                  checkAutocomplete(e.target.value, cursorPosition);
                }}
                borderRadius="lg"
                fontSize="sm"
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
