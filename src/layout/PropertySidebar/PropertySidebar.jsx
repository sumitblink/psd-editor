
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, VStack, Text, Input, Select, FormLabel, FormControl } from '@chakra-ui/react';
import { Drawer } from '../container';
import { selectSelected, updateTextProperty } from '../../store/canvasSlice';

const PropertySidebar = () => {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelected);

  const handleTextChange = (property, value) => {
    dispatch(updateTextProperty({ property, value }));
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

        <FormControl>
          <FormLabel fontSize="sm">Width</FormLabel>
          <Text fontSize="sm" color="gray.600">
            {Math.round(selected.width || 0)}px
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Height</FormLabel>
          <Text fontSize="sm" color="gray.600">
            {Math.round(selected.height || 0)}px
          </Text>
        </FormControl>
      </VStack>
    </Drawer>
  );
};

export default PropertySidebar;
