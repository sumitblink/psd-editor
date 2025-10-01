
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, VStack, Text, Input, Select, FormLabel, FormControl } from '@chakra-ui/react';
import { Drawer } from '../container';
import { selectSelected, changeTextProperty, changeImageProperty, changeObjectDimensions } from '../../store/canvasSlice';

const PropertySidebar = () => {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelected);

  const handleTextChange = (property, value) => {
    dispatch(changeTextProperty({ property, value }));
  };

  const handleImageChange = (property, value) => {
    dispatch(changeImageProperty({ property, value }));
  };

  const handleObjectChange = (property, value) => {
    dispatch(changeObjectDimensions({ property, value }));
  };

  if (!selected) {
    return (
      <Drawer>
        <Box p={4} borderBottom="1px solid" borderColor="gray.200">
          <Text fontSize="lg" fontWeight="semibold">
            Properties
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
      <Box p={4} borderBottom="1px solid" borderColor="gray.200">
        <Text fontSize="lg" fontWeight="semibold">
          Properties
        </Text>
      </Box>
      <VStack spacing={4} p={4} align="stretch">
        <FormControl>
          <FormLabel fontSize="sm">Type</FormLabel>
          <Text fontSize="sm" color="gray.600">
            {selected.type}
          </Text>
        </FormControl>

        {selected.type === 'textbox' && (
          <>
            <FormControl>
              <FormLabel fontSize="sm">Text</FormLabel>
              <Input
                size="sm"
                value={selected.text || ''}
                onChange={(e) => handleTextChange('text', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Font Size</FormLabel>
              <Input
                size="sm"
                type="number"
                value={selected.fontSize || 16}
                onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value))}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Font Family</FormLabel>
              <Select
                size="sm"
                value={selected.fontFamily || 'Arial'}
                onChange={(e) => handleTextChange('fontFamily', e.target.value)}
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Color</FormLabel>
              <Input
                size="sm"
                type="color"
                value={selected.fill || '#000000'}
                onChange={(e) => handleTextChange('fill', e.target.value)}
              />
            </FormControl>
          </>
        )}

        {(selected.type === 'rect' || selected.type === 'circle' || selected.type === 'triangle') && (
          <>
            <FormControl>
              <FormLabel fontSize="sm">Fill Color</FormLabel>
              <Input
                size="sm"
                type="color"
                value={selected.fill || '#3182ce'}
                onChange={(e) => handleImageChange('fill', e.target.value)}
              />
            </FormControl>

            {selected.type === 'circle' && (
              <FormControl>
                <FormLabel fontSize="sm">Radius</FormLabel>
                <Input
                  size="sm"
                  type="number"
                  value={Math.round(selected.radius || 0)}
                  onChange={(e) => handleImageChange('radius', parseInt(e.target.value))}
                />
              </FormControl>
            )}
          </>
        )}

        <FormControl>
          <FormLabel fontSize="sm">Left</FormLabel>
          <Input
            size="sm"
            type="number"
            value={Math.round(selected.left || 0)}
            onChange={(e) => handleObjectChange('left', parseInt(e.target.value))}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Top</FormLabel>
          <Input
            size="sm"
            type="number"
            value={Math.round(selected.top || 0)}
            onChange={(e) => handleObjectChange('top', parseInt(e.target.value))}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Width</FormLabel>
          <Input
            size="sm"
            type="number"
            value={Math.round(selected.width || 0)}
            onChange={(e) => handleObjectChange('width', parseInt(e.target.value))}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Height</FormLabel>
          <Input
            size="sm"
            type="number"
            value={Math.round(selected.height || 0)}
            onChange={(e) => handleObjectChange('height', parseInt(e.target.value))}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Opacity</FormLabel>
          <Input
            size="sm"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selected.opacity || 1}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (selected.type === 'textbox') {
                handleTextChange('opacity', value);
              } else {
                handleImageChange('opacity', value);
              }
            }}
          />
        </FormControl>
      </VStack>
    </Drawer>
  );
};

export default PropertySidebar;
