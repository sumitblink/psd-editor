
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, VStack, Text, HStack, IconButton, Button, ButtonGroup } from '@chakra-ui/react';
import { EyeIcon, EyeOffIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, MoveUpIcon, MoveDownIcon } from 'lucide-react';
import { Drawer, Item } from '../container';
import { selectObjects, selectSelected, selectCanvasInstance, deleteObject, changeObjectLayer, selectObject } from '../../store/canvasSlice';

const LayerSidebar = () => {
  const dispatch = useDispatch();
  const objects = useSelector(selectObjects);
  const selected = useSelector(selectSelected);
  const canvas = useSelector(selectCanvasInstance);

  const handleDeleteObject = () => {
    dispatch(deleteObject());
  };

  const handleLayerMove = (direction) => {
    dispatch(changeObjectLayer(direction));
  };

  const handleSelectLayer = (layerName) => {
    if (!canvas) return;
    
    const canvasObjects = canvas.getObjects();
    const targetObject = canvasObjects.find(obj => obj.name === layerName);
    
    if (targetObject) {
      canvas.setActiveObject(targetObject);
      canvas.renderAll();
      dispatch(selectObject());
    }
  };

  const toggleLayerVisibility = (layerName) => {
    if (!canvas) return;
    
    const canvasObjects = canvas.getObjects();
    const targetObject = canvasObjects.find(obj => obj.name === layerName);
    
    if (targetObject) {
      targetObject.set('visible', !targetObject.visible);
      canvas.renderAll();
    }
  };

  // Debug: Log objects to console
  console.log('LayerSidebar objects:', objects);
  console.log('LayerSidebar selected:', selected);

  return (
    <Drawer>
      <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
        <Text fontSize="lg" fontWeight="semibold">
          Layers ({objects.length})
        </Text>
        {selected && (
          <Box mt={2}>
            <Text fontSize="xs" color="gray.500" mb={2}>Layer Controls:</Text>
            <ButtonGroup size="xs" spacing={1} flexWrap="wrap">
              <Button onClick={() => handleLayerMove('front')} leftIcon={<MoveUpIcon size={10} />}>
                Front
              </Button>
              <Button onClick={() => handleLayerMove('forward')} leftIcon={<ArrowUpIcon size={10} />}>
                Up
              </Button>
              <Button onClick={() => handleLayerMove('backward')} leftIcon={<ArrowDownIcon size={10} />}>
                Down
              </Button>
              <Button onClick={() => handleLayerMove('back')} leftIcon={<MoveDownIcon size={10} />}>
                Back
              </Button>
            </ButtonGroup>
          </Box>
        )}
      </Box>
      <Box flex={1} overflowY="auto" bg="white">
        <VStack spacing={1} p={2} align="stretch">
          {objects.map((object, index) => (
            <Item 
              key={`${object.name}-${index}`}
              width="full"
              bg={selected?.name === object.name ? "blue.100" : "white"}
              border="1px solid"
              borderColor={selected?.name === object.name ? "blue.300" : "gray.200"}
              cursor="pointer"
              onClick={() => handleSelectLayer(object.name)}
              _hover={{ bg: "gray.50" }}
              p={2}
              borderRadius="md"
            >
              <HStack flex={1} spacing={2}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(object.name);
                    }}
                  />
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<TrashIcon size={12} />}
                    aria-label="Delete layer"
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLayer(object.name);
                      setTimeout(() => handleDeleteObject(), 100);
                    }}
                  />
                </HStack>
              </HStack>
            </Item>
          ))}
          {objects.length === 0 && (
            <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
              <Text fontSize="sm" color="gray.500" mb={2}>
                No layers yet.
              </Text>
              <Text fontSize="xs" color="gray.400">
                Import a PSD file to get started.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Drawer>
  );
};

export default LayerSidebar;
