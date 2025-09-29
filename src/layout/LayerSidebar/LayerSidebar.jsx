
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, VStack, Text, HStack, IconButton } from '@chakra-ui/react';
import { EyeIcon, EyeOffIcon, TrashIcon } from 'lucide-react';
import { Drawer, Item } from '../container';
import { selectObjects, selectSelected, deleteObject } from '../../store/canvasSlice';

const LayerSidebar = () => {
  const dispatch = useDispatch();
  const objects = useSelector(selectObjects);
  const selected = useSelector(selectSelected);

  const handleDeleteObject = () => {
    dispatch(deleteObject());
  };

  return (
    <Drawer>
      <Box p={4} borderBottom="1px solid" borderColor="gray.200">
        <Text fontSize="lg" fontWeight="semibold">
          Layers
        </Text>
      </Box>
      <VStack spacing={1} p={2} flex={1}>
        {objects.map((object, index) => (
          <Item key={index} width="full">
            <HStack flex={1}>
              <Box flex={1}>
                <Text fontSize="sm" noOfLines={1}>
                  {object.name || `Layer ${index + 1}`}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {object.type}
                </Text>
              </Box>
              <HStack spacing={1}>
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={<EyeIcon size={12} />}
                  aria-label="Toggle visibility"
                />
                {selected?.name === object.name && (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<TrashIcon size={12} />}
                    aria-label="Delete layer"
                    onClick={handleDeleteObject}
                  />
                )}
              </HStack>
            </HStack>
          </Item>
        ))}
        {objects.length === 0 && (
          <Box p={4} textAlign="center">
            <Text fontSize="sm" color="gray.500">
              No layers yet
            </Text>
          </Box>
        )}
      </VStack>
    </Drawer>
  );
};

export default LayerSidebar;
