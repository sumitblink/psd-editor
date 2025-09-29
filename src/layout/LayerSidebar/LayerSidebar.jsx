
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, VStack, Text, HStack, IconButton, Button, ButtonGroup } from '@chakra-ui/react';
import { EyeIcon, EyeOffIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, MoveUpIcon, MoveDownIcon } from 'lucide-react';
import { Drawer, Item } from '../container';
import { selectObjects, selectSelected, selectCanvasInstance, deleteObject, changeObjectLayer } from '../../store/canvasSlice';

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

  return (
    <Drawer>
      <Box p={4} borderBottom="1px solid" borderColor="gray.200">
        <Text fontSize="lg" fontWeight="semibold">
          Layers
        </Text>
        {selected && (
          <Box mt={2}>
            <Text fontSize="xs" color="gray.500" mb={2}>Layer Controls:</Text>
            <ButtonGroup size="xs" spacing={1}>
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
      <VStack spacing={1} p={2} flex={1}>
        {objects.map((object, index) => (
          <Item 
            key={index} 
            width="full"
            bg={selected?.name === object.name ? "blue.50" : "transparent"}
            cursor="pointer"
            onClick={() => handleSelectLayer(object.name)}
            _hover={{ bg: "gray.50" }}
          >
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
          <Box p={4} textAlign="center">
            <Text fontSize="sm" color="gray.500">
              No layers yet. Import a PSD file to get started.
            </Text>
          </Box>
        )}
      </VStack>
    </Drawer>
  );
};

export default LayerSidebar;
